"use server";

import { z } from "zod";

import { speakingData } from "@/lib/blocks/schemas";
import {
  gradeSpeaking,
  XP_BY_STATE,
  type GradeState,
} from "@/lib/grading/grade";
import { upsertSpeakingSrsItem } from "@/lib/srs/upsert";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface SpeakingResult {
  ok: boolean;
  state: GradeState | null;
  // A frase canônica — exibida apenas em erro para o aluno comparar.
  correctPhrase: string | null;
  xpAwarded: number;
  error: string | null;
}

const inputSchema = z.object({
  blockId: z.string().uuid(),
  phraseIndex: z.number().int().nonnegative(),
  transcript: z.string().min(1),
  viaText: z.boolean().optional(),
  // Pré-visualização do admin — corrige normalmente mas não persiste nada.
  previewMode: z.boolean().optional(),
});

function fail(error: string): SpeakingResult {
  return {
    ok: false,
    state: null,
    correctPhrase: null,
    xpAwarded: 0,
    error,
  };
}

// Ordem do "best": perfect > close > incorrect. Usada para decidir se a nova
// tentativa supera o melhor já registrado (e libera XP adicional).
const STATE_RANK: Record<GradeState, number> = {
  incorrect: 0,
  close: 1,
  perfect: 2,
};

export async function submitSpeaking(raw: {
  blockId: string;
  phraseIndex: number;
  transcript: string;
  viaText?: boolean;
  previewMode?: boolean;
}): Promise<SpeakingResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return fail("Entrada inválida.");
  const {
    blockId,
    phraseIndex,
    transcript,
    viaText = false,
    previewMode,
  } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Sessão expirada. Entre novamente.");

  const admin = createAdminClient();

  // Honra previewMode somente para admin.
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
    .select("id, type, part_id, course_id, data, course:courses(language)")
    .eq("id", blockId)
    .maybeSingle();
  if (!block || block.type !== "speaking") {
    return fail("Bloco não encontrado.");
  }
  // Idioma do curso (en/es) — guardado no item SRS para o reconhecedor de
  // fala e o TTS da revisão usarem o locale certo. Fallback: en.
  const courseLang: "en" | "es" =
    block.course?.language === "es" ? "es" : "en";

  // Segurança: só aluno com matrícula ativa pode submeter — exceto admin
  // em pré-visualização.
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

  const dataParsed = speakingData.safeParse(block.data);
  if (!dataParsed.success) return fail("Bloco mal configurado.");

  const target = dataParsed.data.items[phraseIndex];
  if (!target) return fail("Frase fora do índice.");

  // --- Correção ---
  const state = gradeSpeaking(transcript, target);

  // Dry-run admin: devolve a avaliação, mas sem XP nem persistência.
  if (isAdminPreview) {
    return {
      ok: true,
      state,
      correctPhrase: state === "incorrect" ? target : null,
      xpAwarded: 0,
      error: null,
    };
  }

  // Fallback por texto rende metade do XP (não testou pronúncia).
  const baseXp = XP_BY_STATE[state];
  const earnableXp = viaText ? Math.floor(baseXp / 2) : baseXp;

  // --- Idempotência via speaking_attempts ---
  const { data: existing } = await admin
    .from("speaking_attempts")
    .select("attempts, best_state, xp_awarded")
    .eq("user_id", user.id)
    .eq("block_id", blockId)
    .eq("phrase_index", phraseIndex)
    .maybeSingle();

  const prevRank = existing ? STATE_RANK[existing.best_state as GradeState] : -1;
  const newRank = STATE_RANK[state];
  const improved = newRank > prevRank;
  const newBest: GradeState = improved
    ? state
    : ((existing?.best_state as GradeState) ?? state);
  const newAttempts = (existing?.attempts ?? 0) + 1;

  // XP só quando MELHORA — evita farmar reenviando.
  let xpAwarded = 0;
  if (improved && earnableXp > 0) {
    xpAwarded = earnableXp;
    await admin.from("xp_events").insert({
      user_id: user.id,
      amount: xpAwarded,
      source: viaText ? "speaking:text" : "speaking:voice",
      part_id: block.part_id,
    });
  }

  await admin.from("speaking_attempts").upsert(
    {
      user_id: user.id,
      block_id: blockId,
      phrase_index: phraseIndex,
      part_id: block.part_id,
      course_id: block.course_id,
      best_state: newBest,
      xp_awarded: (existing?.xp_awarded ?? 0) + xpAwarded,
      attempts: newAttempts,
      via_text: viaText,
    },
    { onConflict: "user_id,block_id,phrase_index" },
  );

  // SRS: erros e "quase" entram na fila; perfeito não entra (e não tira).
  if (state !== "perfect") {
    await upsertSpeakingSrsItem(admin, {
      userId: user.id,
      courseId: block.course_id,
      blockId,
      phraseIndex,
      phrase: target,
      lang: courseLang,
    });
  }

  return {
    ok: true,
    state,
    correctPhrase: state === "incorrect" ? target : null,
    xpAwarded,
    error: null,
  };
}
