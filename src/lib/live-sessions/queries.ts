import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

// Dias da semana: 0=domingo, 1=segunda, ..., 6=sábado.
// Compatível com Date.getDay() em JS — sem conversão no front.
export const DAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

export const DAY_LABELS_SHORT: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

export interface LiveSession {
  id: string;
  dayOfWeek: number;
  startTime: string; // "HH:MM:SS" como vindo do Postgres `time`
  meetUrl: string;
  teacherId: string;
  teacherName: string | null;
  teacherAvatarUrl: string | null;
}

// Lista todas as aulas síncronas de um aluno (ordenadas por dia/hora).
// Inclui dados do professor via join. Usada na visão admin do aluno e
// no card de "próxima aula" do painel.
export async function listStudentLiveSessions(
  supabase: Client,
  studentId: string,
): Promise<LiveSession[]> {
  const { data } = await supabase
    .from("student_live_sessions")
    .select(
      "id, day_of_week, start_time, meet_url, teacher_id, teacher:profiles!student_live_sessions_teacher_id_fkey(full_name, avatar_url)",
    )
    .eq("student_id", studentId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    meetUrl: row.meet_url,
    teacherId: row.teacher_id,
    teacherName: row.teacher?.full_name ?? null,
    teacherAvatarUrl: row.teacher?.avatar_url ?? null,
  }));
}

// Resolve a PRÓXIMA ocorrência de uma aula recorrente a partir de "agora"
// em America/Sao_Paulo. Retorna um Date em UTC (ISO).
export function nextOccurrenceBRT(
  dayOfWeek: number,
  startTime: string,
  now: Date = new Date(),
): Date {
  // "Agora" em componentes BRT (sem libs externas).
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  // Day-of-week como número (0-6).
  const WEEKDAY_INDEX: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const currentDow =
    parts.weekday !== undefined ? (WEEKDAY_INDEX[parts.weekday] ?? 0) : 0;
  const segs = startTime.split(":").map((s) => Number.parseInt(s, 10));
  const hh = segs[0] ?? 0;
  const mm = segs[1] ?? 0;
  const ss = segs[2] ?? 0;

  // Dias até a próxima ocorrência. Se for HOJE e o horário ainda não passou,
  // é 0. Senão, soma 7.
  let daysAhead = (dayOfWeek - currentDow + 7) % 7;
  if (daysAhead === 0) {
    const curHH = Number.parseInt(parts.hour ?? "0", 10);
    const curMM = Number.parseInt(parts.minute ?? "0", 10);
    const passed =
      curHH > hh ||
      (curHH === hh && curMM >= mm);
    if (passed) daysAhead = 7;
  }

  // Constrói a data alvo em BRT. America/Sao_Paulo = UTC-3 (sem DST hoje).
  // Para evitar bugs em mudanças futuras de fuso, fazemos manualmente:
  // pegamos a data BRT do dia alvo e convertemos via Date(string + offset).
  const targetYear = Number.parseInt(parts.year ?? "1970", 10);
  const targetMonth = Number.parseInt(parts.month ?? "1", 10); // 1-12
  const targetDay = Number.parseInt(parts.day ?? "1", 10) + daysAhead;
  // Data BRT como string ISO sem fuso; junta o offset -03:00 para virar UTC.
  const iso = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(
    targetDay,
  ).padStart(2, "0")}T${String(hh).padStart(2, "0")}:${String(mm).padStart(
    2,
    "0",
  )}:${String(ss).padStart(2, "0")}-03:00`;
  return new Date(iso);
}

// Hora HH:MM "amigável" pra UI (ex.: "19:30").
export function formatStartTime(startTime: string): string {
  const [hh, mm] = startTime.split(":");
  return `${hh}:${mm}`;
}
