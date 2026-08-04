import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  SrsExercisePayload,
  SrsSpeakingPayload,
  SrsVocabPayload,
} from "@/lib/srs/payload";
import type { Database, Json } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

// Adiciona ou atualiza um item de revisão SM-2 a partir de um exercício
// errado (ou "quase lá"). Idempotente: chamadas repetidas para o mesmo bloco
// apenas reagendam next_review_at para "agora" (próxima sessão).
//
// IMPORTANTE: não reseta ease_factor/interval/repetitions de um item já
// existente — quem evolui esses campos é a sessão de revisão. O que mudamos
// aqui é só "está pronto pra revisar de novo".
export async function upsertExerciseSrsItem(
  admin: AdminClient,
  params: {
    userId: string;
    courseId: string;
    blockId: string;
    kind: "multiple_choice" | "fill_blank";
    question: string;
    answer: string;
    partTitle?: string;
    courseTitle?: string;
  },
): Promise<void> {
  const payload: SrsExercisePayload = {
    type: "exercise",
    kind: params.kind,
    question: params.question,
    answer: params.answer,
    partTitle: params.partTitle,
    courseTitle: params.courseTitle,
  };

  const { data: existing } = await admin
    .from("srs_items")
    .select("id")
    .eq("user_id", params.userId)
    .eq("source_type", "exercise")
    .eq("source_id", params.blockId)
    .eq("source_key", "")
    .maybeSingle();

  if (existing) {
    await admin
      .from("srs_items")
      .update({
        payload: payload as unknown as Json,
        next_review_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await admin.from("srs_items").insert({
      user_id: params.userId,
      course_id: params.courseId,
      source_type: "exercise",
      source_id: params.blockId,
      source_key: "",
      payload: payload as unknown as Json,
    });
  }
}

// Cria itens de vocabulário (1 por termo) para o aluno. Idempotente: termos
// que já existem permanecem com seu estado SM-2 atual; só os novos entram.
// Chamado quando uma parte é marcada como concluída.
export async function upsertVocabSrsItems(
  admin: AdminClient,
  params: {
    userId: string;
    courseId: string;
    blockId: string;
    items: { term: string; translation: string; example?: string }[];
    partTitle?: string;
    courseTitle?: string;
  },
): Promise<void> {
  if (params.items.length === 0) return;

  const { data: existing } = await admin
    .from("srs_items")
    .select("source_key")
    .eq("user_id", params.userId)
    .eq("source_type", "vocab")
    .eq("source_id", params.blockId);

  const existingKeys = new Set((existing ?? []).map((r) => r.source_key));

  const rows = params.items
    .filter((it) => !existingKeys.has(it.term))
    .map((it) => {
      const payload: SrsVocabPayload = {
        type: "vocab",
        term: it.term,
        translation: it.translation,
        example: it.example,
        partTitle: params.partTitle,
        courseTitle: params.courseTitle,
      };
      return {
        user_id: params.userId,
        course_id: params.courseId,
        source_type: "vocab" as const,
        source_id: params.blockId,
        source_key: it.term,
        payload: payload as unknown as Json,
      };
    });

  if (rows.length > 0) {
    await admin.from("srs_items").insert(rows);
  }
}

// Speaking: 1 item por frase de um bloco. Chave secundária = índice da frase
// para suportar múltiplas frases no mesmo bloco.
export async function upsertSpeakingSrsItem(
  admin: AdminClient,
  params: {
    userId: string;
    courseId: string;
    blockId: string;
    phraseIndex: number;
    phrase: string;
    lang?: "en" | "es";
    partTitle?: string;
    courseTitle?: string;
  },
): Promise<void> {
  const payload: SrsSpeakingPayload = {
    type: "speaking",
    phrase: params.phrase,
    lang: params.lang,
    partTitle: params.partTitle,
    courseTitle: params.courseTitle,
  };
  const sourceKey = String(params.phraseIndex);

  const { data: existing } = await admin
    .from("srs_items")
    .select("id")
    .eq("user_id", params.userId)
    .eq("source_type", "speaking")
    .eq("source_id", params.blockId)
    .eq("source_key", sourceKey)
    .maybeSingle();

  if (existing) {
    await admin
      .from("srs_items")
      .update({
        payload: payload as unknown as Json,
        next_review_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await admin.from("srs_items").insert({
      user_id: params.userId,
      course_id: params.courseId,
      source_type: "speaking",
      source_id: params.blockId,
      source_key: sourceKey,
      payload: payload as unknown as Json,
    });
  }
}
