import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export interface DailyXp {
  // ISO date (YYYY-MM-DD), em UTC simples — sem timezones por enquanto.
  date: string;
  xp: number;
}

export interface XpHistory {
  daily: DailyXp[];
  totalXp: number;
  // Soma de XP nas últimas 24h e nos últimos 7 dias para destaques rápidos.
  todayXp: number;
  weekXp: number;
}

// Helper: zera horário e formata em YYYY-MM-DD.
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Devolve N+1 dias (N anteriores + hoje), na ORDEM cronológica, mesmo
// quando o aluno não pontuou em algum deles (preenchido com xp=0). Dessa
// forma a UI desenha um eixo contínuo sem buracos.
export async function getXpHistory(
  supabase: Client,
  userId: string,
  days = 30,
): Promise<XpHistory> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const { data } = await supabase
    .from("xp_events")
    .select("amount, created_at")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: true });

  // Bucket por dia.
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(toISODate(d), 0);
  }
  let todayXp = 0;
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  let weekXp = 0;
  const todayKey = toISODate(today);

  for (const row of data ?? []) {
    const eventDate = new Date(row.created_at);
    const key = toISODate(eventDate);
    buckets.set(key, (buckets.get(key) ?? 0) + row.amount);
    if (key === todayKey) todayXp += row.amount;
    if (eventDate >= weekStart) weekXp += row.amount;
  }

  const daily: DailyXp[] = Array.from(buckets.entries()).map(([date, xp]) => ({
    date,
    xp,
  }));

  // total_xp do usuário também vem do gamification para consistência com
  // o card do painel, mas devolvemos a soma como fallback.
  const { data: gam } = await supabase
    .from("user_gamification")
    .select("total_xp")
    .eq("user_id", userId)
    .maybeSingle();
  const totalXp =
    gam?.total_xp ??
    daily.reduce((acc, d) => acc + d.xp, 0); // fallback

  return { daily, totalXp, todayXp, weekXp };
}

export interface XpBySource {
  // Identificador bruto do evento (ex.: "exercise:multiple_choice",
  // "achievement:first_lesson_completed").
  source: string;
  // Label amigável já resolvido para exibir.
  label: string;
  xp: number;
}

// Soma XP por `source` ao longo de todo o histórico do aluno. Útil para
// um breakdown ("onde meu XP veio de?"). Limita a 6 categorias top +
// agrupa o resto em "outros". Resolve títulos amigáveis para sources do
// tipo "achievement:<code>" consultando a tabela achievements.
export async function getXpBySource(
  supabase: Client,
  userId: string,
): Promise<XpBySource[]> {
  const { data } = await supabase
    .from("xp_events")
    .select("amount, source")
    .eq("user_id", userId);

  const buckets = new Map<string, number>();
  for (const row of data ?? []) {
    buckets.set(row.source, (buckets.get(row.source) ?? 0) + row.amount);
  }

  // Junta com a tabela de achievements para extrair títulos amigáveis.
  // Codes vêm do prefixo "achievement:<code>".
  const achievementCodes = [...buckets.keys()]
    .filter((s) => s.startsWith("achievement:"))
    .map((s) => s.slice("achievement:".length));
  const titles = new Map<string, string>();
  if (achievementCodes.length > 0) {
    const { data: rows } = await supabase
      .from("achievements")
      .select("code, title")
      .in("code", achievementCodes);
    for (const r of rows ?? []) titles.set(r.code, r.title);
  }

  function labelFor(source: string): string {
    if (source.startsWith("achievement:")) {
      const code = source.slice("achievement:".length);
      return titles.get(code) ?? humanizeCode(code);
    }
    return source;
  }

  const sorted = [...buckets.entries()]
    .map(([source, xp]) => ({ source, label: labelFor(source), xp }))
    .sort((a, b) => b.xp - a.xp);

  if (sorted.length <= 6) return sorted;
  const top = sorted.slice(0, 5);
  const others = sorted.slice(5).reduce((acc, s) => acc + s.xp, 0);
  return [...top, { source: "outros", label: "Outros", xp: others }];
}

// "first_lesson_completed" -> "First lesson completed" — fallback usado só
// quando o achievement não está catalogado na tabela `achievements`.
function humanizeCode(code: string): string {
  const text = code.replace(/_/g, " ").trim();
  if (text.length === 0) return "Conquista";
  return text[0]!.toUpperCase() + text.slice(1);
}
