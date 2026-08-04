"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface ClaimResult {
  ok: boolean;
  xpAwarded: number;
  error: string | null;
}

// Server Action: o aluno aperta "Coletar recompensa" na página de
// conquistas. Validamos:
//   1. Está autenticado.
//   2. Tem essa conquista em user_achievements (RLS já filtra; checamos
//      pelo achievement_id passado).
//   3. claimed_at ainda é null (idempotência: dois cliques rápidos não
//      duplicam o XP).
//
// Em sucesso: seta claimed_at = now() e insere xp_event com o valor da
// achievements.xp_reward. O trigger apply_xp_event() atualiza o agregado
// (total_xp, streak) automaticamente.
export async function claimAchievement(
  achievementId: string,
): Promise<ClaimResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, xpAwarded: 0, error: "Não autenticado." };
  }
  if (!achievementId) {
    return { ok: false, xpAwarded: 0, error: "Conquista inválida." };
  }

  // Usamos service_role para conseguir inserir em xp_events (RLS bloqueia
  // escrita do aluno por design — só o servidor credita XP).
  const admin = createAdminClient();

  // 1. Encontra a conquista do usuário, ainda não coletada.
  const { data: ua } = await admin
    .from("user_achievements")
    .select("id, claimed_at, achievement_id")
    .eq("user_id", user.id)
    .eq("achievement_id", achievementId)
    .maybeSingle();

  if (!ua) {
    return {
      ok: false,
      xpAwarded: 0,
      error: "Você ainda não atingiu essa conquista.",
    };
  }
  if (ua.claimed_at) {
    return {
      ok: false,
      xpAwarded: 0,
      error: "Recompensa já foi coletada.",
    };
  }

  // 2. Busca o xp_reward do catálogo.
  const { data: ach } = await admin
    .from("achievements")
    .select("code, xp_reward")
    .eq("id", achievementId)
    .maybeSingle();

  if (!ach) {
    return { ok: false, xpAwarded: 0, error: "Conquista não existe." };
  }

  // 3. Atualização condicional (claimed_at is null) — defesa extra
  // contra duplo clique vencendo a checagem anterior.
  const { data: updated } = await admin
    .from("user_achievements")
    .update({ claimed_at: new Date().toISOString() })
    .eq("id", ua.id)
    .is("claimed_at", null)
    .select("id")
    .maybeSingle();

  if (!updated) {
    return {
      ok: false,
      xpAwarded: 0,
      error: "Recompensa já foi coletada.",
    };
  }

  // 4. Insere o xp_event — o trigger apply_xp_event() atualiza o
  // agregado (total_xp, streak, last_activity_date).
  if (ach.xp_reward > 0) {
    await admin.from("xp_events").insert({
      user_id: user.id,
      amount: ach.xp_reward,
      source: `achievement:${ach.code}`,
    });
  }

  revalidatePath("/painel/conquistas");
  revalidatePath("/painel");

  return { ok: true, xpAwarded: ach.xp_reward, error: null };
}
