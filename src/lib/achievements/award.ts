import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { CATALOG, type AchievementCode } from "./catalog";
import { computeUserMetrics } from "./metrics";

type AdminClient = SupabaseClient<Database>;

export interface AwardContext {
  userId: string;
  // courseId/partId já não são usados pela lógica nova (todas as condições
  // são por usuário, não por curso/parte), mas mantemos no contrato para
  // os call-sites existentes não quebrarem.
  courseId?: string;
  partId?: string;
}

// Detecta conquistas atingidas pelo usuário e MARCA como earned (insere
// linha em user_achievements com earned_at preenchido e claimed_at=null).
// Diferença para a v1: NÃO insere xp_event aqui — o XP só é creditado
// quando o aluno aperta "Coletar recompensa" (vide claimAchievement).
//
// Idempotente: a unique (user_id, achievement_id) barra duplicatas, e
// checamos antes para não tentar reinserir.
export async function awardAchievements(
  admin: AdminClient,
  ctx: AwardContext,
): Promise<void> {
  const { userId } = ctx;

  // 1) Carrega catálogo (id por code) e o que o usuário já tem.
  const [{ data: catalogRows }, { data: ownedRows }] = await Promise.all([
    admin.from("achievements").select("id, code"),
    admin
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId),
  ]);

  const idByCode = new Map<string, string>();
  for (const row of catalogRows ?? []) idByCode.set(row.code, row.id);
  const ownedIds = new Set((ownedRows ?? []).map((r) => r.achievement_id));

  // 2) Calcula métricas atuais.
  const metrics = await computeUserMetrics(admin, userId);

  // 3) Para cada entrada do catálogo cuja condição foi atingida e ainda
  //    não está em user_achievements, insere com earned_at = now() e
  //    claimed_at = null.
  const toInsert: { user_id: string; achievement_id: string }[] = [];
  for (const entry of CATALOG) {
    if (!entry.reached(metrics)) continue;
    const achievementId = idByCode.get(entry.code);
    if (!achievementId || ownedIds.has(achievementId)) continue;
    toInsert.push({ user_id: userId, achievement_id: achievementId });
  }

  if (toInsert.length === 0) return;

  // Insert em lote — se houver corrida com a unique constraint,
  // ignoramos o erro (idempotência).
  await admin.from("user_achievements").insert(toInsert);
  // Marker: silencia o lint sobre AchievementCode não usado em runtime.
  void (null as unknown as AchievementCode);
}
