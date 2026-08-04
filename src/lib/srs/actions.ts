"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  gradeFillBlank,
  gradeSpeaking,
  type GradeState,
} from "@/lib/grading/grade";
import type { SrsPayload } from "@/lib/srs/payload";
import { applySm2 } from "@/lib/srs/sm2";
import { createClient } from "@/lib/supabase/server";

export interface ReviewItemResult {
  ok: boolean;
  state: GradeState; // perfect | close | incorrect
  expected: string; // resposta canônica, sempre mostrada após submit
  xpAwarded: number;
  error: string | null;
}

// XP de revisão é reduzido (é repetição, não conteúdo novo) e só vai
// para "perfect". "close" e "incorrect" não pontuam.
const XP_PERFECT = 2;

// Mapeamento auto-grading → qualidade SM-2:
//   perfect   → 4 ("good": recordou normalmente)
//   close     → 3 ("hard": recordou com dificuldade — preserva ciclo)
//   incorrect → 0 ("again": esqueceu — reinicia)
function qualityFor(state: GradeState): number {
  if (state === "perfect") return 4;
  if (state === "close") return 3;
  return 0;
}

function expectedAnswerOf(payload: SrsPayload): string {
  switch (payload.type) {
    case "exercise":
      return payload.answer;
    case "vocab":
      return payload.translation;
    case "speaking":
      return payload.phrase;
  }
}

// Recebe a resposta digitada do aluno e:
//   1. Carrega o item (com payload) e valida ownership.
//   2. Compara via Levenshtein (mesma tolerância do fill_blank) contra
//      a resposta canônica do payload.
//   3. Aplica SM-2 com a qualidade derivada do estado.
//   4. Em "perfect", insere xp_event com XP_PERFECT (alimenta streak via
//      trigger).
//   5. Incrementa total_srs_reviews e dispara awardAchievements.
export async function reviewItem(
  itemId: string,
  submitted: string,
): Promise<ReviewItemResult> {
  if (!itemId) {
    return {
      ok: false,
      state: "incorrect",
      expected: "",
      xpAwarded: 0,
      error: "Item inválido.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: item } = await supabase
    .from("srs_items")
    .select(
      "ease_factor, interval_days, repetitions, payload, source_type",
    )
    .eq("id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!item) {
    return {
      ok: false,
      state: "incorrect",
      expected: "",
      xpAwarded: 0,
      error: "Item não encontrado.",
    };
  }

  const payload = item.payload as unknown as SrsPayload;
  const expected = expectedAnswerOf(payload);

  // Grading por tipo:
  //  - speaking: `submitted` é a transcrição (voz ou texto-fallback);
  //    usa gradeSpeaking (tolerância maior — STT erra pontuação/homófonos).
  //  - demais: reusa a lógica do fill_blank (Levenshtein + normalização),
  //    só a resposta canônica (sem alternatives).
  const trimmed = (submitted ?? "").trim();
  const state =
    payload.type === "speaking"
      ? gradeSpeaking(trimmed, expected)
      : gradeFillBlank(trimmed, { answer: expected, alternatives: [] });
  const quality = qualityFor(state);

  const next = applySm2(
    {
      easeFactor: Number(item.ease_factor),
      intervalDays: item.interval_days,
      repetitions: item.repetitions,
    },
    quality,
  );

  await supabase
    .from("srs_items")
    .update({
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      repetitions: next.repetitions,
      next_review_at: next.nextReviewAt.toISOString(),
      last_quality: quality,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

  // XP + streak (via xp_event + trigger) — só para perfect.
  let xpAwarded = 0;
  if (state === "perfect") {
    xpAwarded = XP_PERFECT;
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();
      await admin.from("xp_events").insert({
        user_id: user.id,
        amount: xpAwarded,
        source: "srs_review",
      });
    } catch {
      // Não bloqueia a resposta se a inserção do xp_event falhar.
      xpAwarded = 0;
    }
  }

  // Incrementa contador de revisões + dispara conquistas (independente
  // do estado — qualquer tentativa conta como "revisão feita" para o
  // conjunto "Hora de relembrar").
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: cur } = await admin
      .from("user_gamification")
      .select("total_srs_reviews")
      .eq("user_id", user.id)
      .maybeSingle();
    const prev = cur?.total_srs_reviews ?? 0;
    await admin
      .from("user_gamification")
      .update({ total_srs_reviews: prev + 1 })
      .eq("user_id", user.id);

    const { awardAchievements } = await import("@/lib/achievements/award");
    await awardAchievements(admin, { userId: user.id });
  } catch {
    // Não-bloqueante.
  }

  // IMPORTANTE: NÃO revalidar "/painel/revisar/sessao" aqui. Essa é a
  // própria página onde o aluno está no meio da sessão — revalidá-la
  // faz o server component re-buscar os itens "due", o item recém-
  // respondido some da lista, a prop `items` do ReviewSession muda, e o
  // `index` local passa a apontar para outro item. A pergunta troca sob
  // os pés do aluno enquanto o feedback antigo fica preso, travando a
  // resposta. A sessão trabalha sobre um snapshot estável (ver
  // ReviewSession). Só revalidamos a lista e o painel (contadores).
  revalidatePath("/painel/revisar");
  revalidatePath("/painel");

  return { ok: true, state, expected, xpAwarded, error: null };
}
