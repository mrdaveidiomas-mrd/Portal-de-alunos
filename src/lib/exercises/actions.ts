"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { awardAchievements } from "@/lib/achievements/award";
import {
  EXERCISE_TYPES,
  errorCorrectionData,
  errorCorrectionSolution,
  fillBlankData,
  fillBlankSolution,
  multipleChoiceData,
  multipleChoiceSolution,
  reorderWordsData,
  translationData,
  translationSolution,
  vocabularyData,
} from "@/lib/blocks/schemas";
import { checkLessonJustCompleted } from "@/lib/parts/actions";
import { upsertExerciseSrsItem, upsertVocabSrsItems } from "@/lib/srs/upsert";
import {
  gradeErrorCorrection,
  gradeFillBlank,
  gradeMultipleChoice,
  gradeReorderWords,
  gradeTranslation,
  XP_BY_STATE,
  type GradeState,
} from "@/lib/grading/grade";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

export interface ExerciseResult {
  ok: boolean;
  state: GradeState | null;
  // Resposta correta — só preenchida quando o aluno erra (não vaza antes).
  correctAnswer: string | null;
  xpAwarded: number;
  error: string | null;
  // Informações de conclusão da parte para o cliente disparar a tela de
  // celebração. `partJustCompleted` é true APENAS na transição (uma vez).
  partJustCompleted?: boolean;
  partStars?: number;
  // True quando a parte concluída ERA a última pendente da lição — sinal
  // para abrir o diálogo polido de conclusão de LIÇÃO com compartilhamento.
  lessonJustCompleted?: boolean;
}

const inputSchema = z.object({
  blockId: z.string().uuid(),
  // Resposta de multiple_choice
  selectedIndex: z.number().int().nonnegative().optional(),
  // Resposta de fill_blank / translation / error_correction
  text: z.string().optional(),
  // Resposta de reorder_words: array de índices originais na ordem montada.
  selectedIndices: z.array(z.number().int().nonnegative()).optional(),
  // Modo "pré-visualização" do admin: corrige normalmente, mas NÃO persiste
  // (sem XP, exercise_attempts, part_progress, SRS, conquistas) e dispensa
  // a checagem de matrícula. O servidor só honra a flag se o user de fato
  // tiver role=admin; para outros perfis a flag é ignorada.
  previewMode: z.boolean().optional(),
});

function fail(error: string): ExerciseResult {
  return { ok: false, state: null, correctAnswer: null, xpAwarded: 0, error };
}

export async function submitExercise(raw: {
  blockId: string;
  selectedIndex?: number;
  text?: string;
  selectedIndices?: number[];
  previewMode?: boolean;
}): Promise<ExerciseResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return fail("Entrada inválida.");
  const { blockId, selectedIndex, text, selectedIndices, previewMode } =
    parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Sessão expirada. Entre novamente.");

  const admin = createAdminClient();

  // Verifica se a preview do admin pode ser honrada: requer role=admin no
  // servidor (não confiamos só na flag do cliente).
  let isAdminPreview = false;
  if (previewMode) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdminPreview = profile?.role === "admin";
  }

  const { data: block } = await admin
    .from("blocks")
    .select("id, type, part_id, course_id, data")
    .eq("id", blockId)
    .maybeSingle();
  if (!block) return fail("Exercício não encontrado.");

  // Segurança: só aluno com matrícula ativa pode responder — exceto admin
  // em modo pré-visualização (ele pode não estar matriculado e ainda
  // assim precisa testar o fluxo).
  if (!isAdminPreview) {
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", block.course_id)
      .eq("status", "active")
      .maybeSingle();
    if (!enrollment) return fail("Você não está matriculado neste curso.");
  }

  const { data: solutionRow } = await admin
    .from("exercise_solutions")
    .select("solution")
    .eq("block_id", blockId)
    .maybeSingle();
  if (!solutionRow) return fail("Exercício sem gabarito configurado.");

  // --- Correção (server-side; o gabarito nunca sai daqui) ---
  let state: GradeState;
  let correctAnswer: string | null = null;
  // Para alimentar o SRS quando o aluno erra/quase: precisamos do enunciado
  // e da resposta canônica de cada tipo.
  let srsQuestion = "";
  let srsAnswer = "";

  if (block.type === "multiple_choice") {
    const sol = multipleChoiceSolution.safeParse(solutionRow.solution);
    const pub = multipleChoiceData.safeParse(block.data);
    if (!sol.success || !pub.success) return fail("Exercício mal configurado.");
    if (typeof selectedIndex !== "number") return fail("Selecione uma opção.");
    state = gradeMultipleChoice(selectedIndex, sol.data);
    const canonical = pub.data.options[sol.data.answerIndex] ?? "";
    srsQuestion = pub.data.question;
    srsAnswer = canonical;
    if (state === "incorrect") correctAnswer = canonical;
  } else if (block.type === "fill_blank") {
    const sol = fillBlankSolution.safeParse(solutionRow.solution);
    const pub = fillBlankData.safeParse(block.data);
    if (!sol.success || !pub.success) return fail("Exercício mal configurado.");
    if (typeof text !== "string" || text.trim().length === 0) {
      return fail("Digite sua resposta.");
    }
    state = gradeFillBlank(text, sol.data);
    srsQuestion = pub.data.prompt;
    srsAnswer = sol.data.answer;
    if (state === "incorrect") correctAnswer = sol.data.answer;
  } else if (block.type === "translation") {
    const sol = translationSolution.safeParse(solutionRow.solution);
    const pub = translationData.safeParse(block.data);
    if (!sol.success || !pub.success) return fail("Exercício mal configurado.");
    if (typeof text !== "string" || text.trim().length === 0) {
      return fail("Digite sua tradução.");
    }
    state = gradeTranslation(text, sol.data);
    // SRS payload: pergunta = instrução + frase original.
    srsQuestion = pub.data.instruction
      ? `${pub.data.instruction} ${pub.data.source}`
      : pub.data.source;
    srsAnswer = sol.data.answer;
    if (state === "incorrect") correctAnswer = sol.data.answer;
  } else if (block.type === "error_correction") {
    const sol = errorCorrectionSolution.safeParse(solutionRow.solution);
    const pub = errorCorrectionData.safeParse(block.data);
    if (!sol.success || !pub.success) return fail("Exercício mal configurado.");
    if (typeof text !== "string" || text.trim().length === 0) {
      return fail("Digite a frase corrigida.");
    }
    state = gradeErrorCorrection(text, sol.data);
    srsQuestion = pub.data.instruction
      ? `${pub.data.instruction} ${pub.data.sentence}`
      : pub.data.sentence;
    srsAnswer = sol.data.answer;
    if (state === "incorrect") correctAnswer = sol.data.answer;
  } else if (block.type === "reorder_words") {
    // reorder_words não usa exercise_solutions — a ordem canônica é a própria
    // ordem dos tokens em block.data. O safeParse de solutionRow não é
    // relevante aqui.
    const pub = reorderWordsData.safeParse(block.data);
    if (!pub.success) return fail("Exercício mal configurado.");
    if (!Array.isArray(selectedIndices)) {
      return fail("Monte a frase antes de enviar.");
    }
    state = gradeReorderWords(selectedIndices, pub.data.tokens.length);
    const canonical = pub.data.tokens.join(" ");
    srsQuestion = pub.data.instruction ?? "Reordene as palavras";
    srsAnswer = canonical;
    if (state === "incorrect") correctAnswer = canonical;
  } else {
    return fail("Tipo de exercício não suportado.");
  }

  // Dry-run: admin em pré-visualização recebe a correção, mas nada
  // disto entra no banco — sem tentativa, sem XP, sem SRS, sem progresso,
  // sem conquistas. A frase canônica em "incorrect" continua exibida.
  if (isAdminPreview) {
    return {
      ok: true,
      state,
      correctAnswer,
      xpAwarded: 0,
      error: null,
      // partJustCompleted fica undefined — admin não vê a celebração nem
      // estrelas, porque nada está sendo persistido.
    };
  }

  // --- Tentativas (idempotência de XP) ---
  const { data: existing } = await admin
    .from("exercise_attempts")
    .select("attempts, solved, solved_first_try")
    .eq("user_id", user.id)
    .eq("block_id", blockId)
    .maybeSingle();

  const wasSolved = existing?.solved ?? false;
  const attempts = (existing?.attempts ?? 0) + 1;
  const nowSolved = wasSolved || state !== "incorrect";
  const solvedFirstTry =
    existing?.solved_first_try ?? (attempts === 1 && state === "perfect");

  await admin.from("exercise_attempts").upsert(
    {
      user_id: user.id,
      block_id: blockId,
      part_id: block.part_id,
      course_id: block.course_id,
      attempts,
      solved: nowSolved,
      solved_first_try: solvedFirstTry,
    },
    { onConflict: "user_id,block_id" },
  );

  // XP só na primeira vez que o aluno resolve o exercício.
  let xpAwarded = 0;
  if (!wasSolved && state !== "incorrect" && XP_BY_STATE[state] > 0) {
    xpAwarded = XP_BY_STATE[state];
    await admin.from("xp_events").insert({
      user_id: user.id,
      amount: xpAwarded,
      source: `exercise:${block.type}`,
      part_id: block.part_id,
    });
  }

  // SRS: erros e "quase lá" entram (ou voltam) para a fila de revisão.
  if (state !== "perfect" && srsQuestion && srsAnswer) {
    await upsertExerciseSrsItem(admin, {
      userId: user.id,
      courseId: block.course_id,
      blockId: block.id,
      kind: block.type as "multiple_choice" | "fill_blank",
      question: srsQuestion,
      answer: srsAnswer,
    });
  }

  const { justCompleted, stars: partStars } = await recomputePartProgress(
    admin,
    user.id,
    block.part_id,
    block.course_id,
  );
  // SRS: ao concluir a parte pela primeira vez, semeia itens de vocabulário.
  if (justCompleted) {
    await seedVocabSrsForPart(admin, user.id, block.part_id, block.course_id);
  }

  await awardAchievements(admin, {
    userId: user.id,
    courseId: block.course_id,
    partId: block.part_id,
  });

  const lessonJustCompleted = justCompleted
    ? await checkLessonJustCompleted(admin, user.id, block.part_id)
    : false;

  return {
    ok: true,
    state,
    correctAnswer,
    xpAwarded,
    error: null,
    partJustCompleted: justCompleted,
    partStars: justCompleted ? partStars : undefined,
    lessonJustCompleted,
  };
}

// Para cada bloco de vocabulário da parte concluída, cria itens SRS para
// todos os termos. Idempotente: termos já cadastrados são preservados.
async function seedVocabSrsForPart(
  admin: AdminClient,
  userId: string,
  partId: string,
  courseId: string,
): Promise<void> {
  const { data: vocabBlocks } = await admin
    .from("blocks")
    .select("id, data")
    .eq("part_id", partId)
    .eq("type", "vocabulary");

  for (const b of vocabBlocks ?? []) {
    const parsed = vocabularyData.safeParse(b.data);
    if (!parsed.success) continue;
    await upsertVocabSrsItems(admin, {
      userId,
      courseId,
      blockId: b.id,
      items: parsed.data.items,
    });
  }
}

// Recalcula o progresso da parte: completa quando todos os exercícios foram
// resolvidos; estrelas pela proporção de acertos de primeira. Devolve um
// objeto com:
//   - justCompleted: true APENAS na chamada que transicionou para completa
//     (usado para semear SRS de vocab uma vez e disparar celebração no UI);
//   - stars: nota final da parte (0-3) — útil para a tela de celebração.
async function recomputePartProgress(
  admin: AdminClient,
  userId: string,
  partId: string,
  courseId: string,
): Promise<{ justCompleted: boolean; stars: number }> {
  const { data: exerciseBlocks } = await admin
    .from("blocks")
    .select("id")
    .eq("part_id", partId)
    .in("type", EXERCISE_TYPES);

  const total = exerciseBlocks?.length ?? 0;
  if (total === 0) return { justCompleted: false, stars: 0 };

  const { data: attempts } = await admin
    .from("exercise_attempts")
    .select("solved, solved_first_try")
    .eq("user_id", userId)
    .eq("part_id", partId);

  const solved = (attempts ?? []).filter((a) => a.solved).length;
  const firstTry = (attempts ?? []).filter((a) => a.solved_first_try).length;
  const allSolved = solved >= total;
  const ratio = firstTry / total;
  // Thresholds de estrelas (sobre o ratio de acertos de primeira):
  //   100%  → 3 (perfeito)
  //   ≥50%  → 2
  //   ≥25%  → 1
  //   <25%  → 0 (mesmo terminando, errou demais)
  // Parte não totalmente resolvida também fica em 0.
  const stars = !allSolved
    ? 0
    : ratio >= 1
      ? 3
      : ratio >= 0.5
        ? 2
        : ratio >= 0.25
          ? 1
          : 0;
  const score = Math.round((solved / total) * 100);

  const { data: previous } = await admin
    .from("part_progress")
    .select("status")
    .eq("user_id", userId)
    .eq("part_id", partId)
    .maybeSingle();
  const wasCompleted = previous?.status === "completed";

  await admin.from("part_progress").upsert(
    {
      user_id: userId,
      part_id: partId,
      course_id: courseId,
      status: allSolved ? "completed" : "in_progress",
      stars,
      score,
      completed_at: allSolved ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,part_id" },
  );

  return { justCompleted: allSolved && !wasCompleted, stars };
}
