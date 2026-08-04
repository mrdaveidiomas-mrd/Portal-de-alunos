import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  // Dias com atividade — Set de strings YYYY-MM-DD para lookup rápido.
  activeDates: Set<string>;
  // Total de dias com atividade no período carregado.
  activeDaysInPeriod: number;
}

// Fuso usado para resolver "que dia foi essa atividade?". Precisa
// bater com o usado em supabase/migrations/.../apply_xp_event(), senão
// o calendário renderizado dessincroniza dos agregados de streak.
const STREAK_TZ = "America/Sao_Paulo";

function toISODateInTz(iso: string, tz: string): string {
  // Intl com en-CA produz exatamente "YYYY-MM-DD" — formato estável
  // para chave de Set e comparação.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return parts;
}

// Mesma resolução de "hoje" usada pelo trigger SQL (BRT). Comparar como
// string YYYY-MM-DD é seguro porque o formato é monotonamente ordenável.
function todayInTz(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function previousDay(iso: string): string {
  // iso = "YYYY-MM-DD". Resolvido como UTC midnight para evitar drift,
  // depois subtrai 1 dia e devolve no mesmo formato. Não usa o TZ porque
  // a aritmética de "ontem" é puramente de dias do calendário.
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// O streak ARMAZENADO em user_gamification.current_streak só é atualizado
// quando o trigger dispara (i.e., quando o aluno ganha XP). Se ele passou
// dias sem praticar, o número continua "preso" no antigo. Para exibir,
// resolvemos com base em last_activity_date:
//   - sem atividade nenhuma → 0
//   - última atividade = hoje ou ontem (BRT) → mantém o valor armazenado
//   - última atividade > 1 dia atrás → streak QUEBRADO → 0
// Reset igual ao Duolingo: prática no dia seguinte ao "buraco" começa em 1
// (o próprio trigger já trata esse caso no else final).
export function resolveCurrentStreak(
  storedStreak: number | null | undefined,
  lastActivityDate: string | null | undefined,
  tz: string = STREAK_TZ,
): number {
  if (!lastActivityDate || !storedStreak) return 0;
  const today = todayInTz(tz);
  const yesterday = previousDay(today);
  if (lastActivityDate === today || lastActivityDate === yesterday) {
    return storedStreak;
  }
  return 0;
}

// Carrega os números agregados de gamificação + o conjunto de dias com
// pelo menos um xp_event nos últimos `days` dias. "Atividade" = qualquer
// XP recebido naquele dia.
export async function getStreakData(
  supabase: Client,
  userId: string,
  days = 90,
): Promise<StreakData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const [{ data: gam }, { data: events }] = await Promise.all([
    supabase
      .from("user_gamification")
      .select("current_streak, longest_streak, last_activity_date")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("xp_events")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", start.toISOString()),
  ]);

  const activeDates = new Set<string>();
  for (const e of events ?? []) {
    activeDates.add(toISODateInTz(e.created_at, STREAK_TZ));
  }

  return {
    currentStreak: resolveCurrentStreak(
      gam?.current_streak,
      gam?.last_activity_date,
    ),
    longestStreak: gam?.longest_streak ?? 0,
    lastActivityDate: gam?.last_activity_date ?? null,
    activeDates,
    activeDaysInPeriod: activeDates.size,
  };
}
