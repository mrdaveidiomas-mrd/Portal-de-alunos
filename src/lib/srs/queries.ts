import type { SupabaseClient } from "@supabase/supabase-js";

import type { SrsPayload } from "@/lib/srs/payload";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export interface SrsDueItem {
  id: string;
  sourceType: "exercise" | "vocab";
  payload: SrsPayload;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

// Quantos itens estão prontos para revisar AGORA (next_review_at <= now).
// Usado para o card do dashboard.
export async function countDueItems(
  supabase: Client,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from("srs_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("next_review_at", new Date().toISOString());
  return count ?? 0;
}

// Lista os itens vencidos, ordenados pelo mais atrasado primeiro. Limite
// padrão protege contra sessões enormes.
export async function listDueItems(
  supabase: Client,
  userId: string,
  limit = 20,
): Promise<SrsDueItem[]> {
  const { data } = await supabase
    .from("srs_items")
    .select(
      "id, source_type, payload, ease_factor, interval_days, repetitions",
    )
    .eq("user_id", userId)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    sourceType: row.source_type as "exercise" | "vocab",
    payload: row.payload as unknown as SrsPayload,
    easeFactor: Number(row.ease_factor),
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
  }));
}
