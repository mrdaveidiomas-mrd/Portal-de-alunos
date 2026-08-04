import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { UserMetrics } from "./catalog";

type Client = SupabaseClient<Database>;

// Calcula as métricas de gamificação usadas pelas condições de conquistas.
// Usado tanto server-side (awardAchievements) quanto pela página
// /painel/conquistas (que mostra barra de progresso). Para evitar N+1,
// faz tudo em queries agregadas.
//
// Métricas:
//   - hasFirstDay      → existe ao menos 1 xp_event
//   - lessonsCompleted → lições com TODAS as partes em status=completed
//   - lessonsFlawless  → lições completed cujas tentativas não tiveram
//                        nenhum solved_first_try=false
//   - srsReviews       → contador em user_gamification.total_srs_reviews
//   - longestStreak    → user_gamification.longest_streak
//   - totalXp          → user_gamification.total_xp
//   - totalStars       → soma de part_progress.stars do usuário
//   - hasBookmark      → existe ao menos 1 review_marks
export async function computeUserMetrics(
  supabase: Client,
  userId: string,
): Promise<UserMetrics> {
  const [
    gamRes,
    xpRes,
    bookmarkRes,
    progRes,
    partsRes,
    attemptsRes,
  ] = await Promise.all([
    supabase
      .from("user_gamification")
      .select("total_xp, longest_streak, total_srs_reviews")
      .eq("user_id", userId)
      .maybeSingle(),
    // Existe pelo menos 1 xp_event? (head=true + count exato é mais barato
    // do que trazer linhas)
    supabase
      .from("xp_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("review_marks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    // Progresso por parte — precisamos saber por lição quais partes estão
    // completed. Trazemos só as completed.
    supabase
      .from("part_progress")
      .select("part_id, stars, status")
      .eq("user_id", userId)
      .eq("status", "completed"),
    // Todas as partes (precisamos saber o universo de partes por lição —
    // independente de o aluno ter feito ou não).
    supabase.from("parts").select("id, lesson_id"),
    // Tentativas erradas: solved_first_try=false. Vamos usar isso pra
    // descartar lições que tiveram qualquer erro.
    supabase
      .from("exercise_attempts")
      .select("part_id, solved_first_try")
      .eq("user_id", userId)
      .eq("solved_first_try", false),
  ]);

  const totalXp = gamRes.data?.total_xp ?? 0;
  const longestStreak = gamRes.data?.longest_streak ?? 0;
  const srsReviews = gamRes.data?.total_srs_reviews ?? 0;
  const hasFirstDay = (xpRes.count ?? 0) > 0;
  const hasBookmark = (bookmarkRes.count ?? 0) > 0;

  const completedParts = progRes.data ?? [];
  const allParts = partsRes.data ?? [];

  // Soma de estrelas
  const totalStars = completedParts.reduce(
    (acc, p) => acc + (p.stars ?? 0),
    0,
  );

  // Lições completadas: lessonId tem TODAS as partes com status=completed.
  // Construímos: partsPerLesson (total) e completedPerLesson (do aluno).
  const partsByLesson = new Map<string, Set<string>>();
  const lessonByPart = new Map<string, string>();
  for (const p of allParts) {
    lessonByPart.set(p.id, p.lesson_id);
    const set = partsByLesson.get(p.lesson_id) ?? new Set<string>();
    set.add(p.id);
    partsByLesson.set(p.lesson_id, set);
  }
  const completedPartsByLesson = new Map<string, Set<string>>();
  for (const pp of completedParts) {
    const lessonId = lessonByPart.get(pp.part_id);
    if (!lessonId) continue;
    const set = completedPartsByLesson.get(lessonId) ?? new Set<string>();
    set.add(pp.part_id);
    completedPartsByLesson.set(lessonId, set);
  }
  let lessonsCompleted = 0;
  const fullyCompleteLessons = new Set<string>();
  for (const [lessonId, total] of partsByLesson) {
    const done = completedPartsByLesson.get(lessonId);
    if (done && done.size === total.size && total.size > 0) {
      lessonsCompleted++;
      fullyCompleteLessons.add(lessonId);
    }
  }

  // Lições "flawless": lição completed E sem nenhum exercise_attempt com
  // solved_first_try=false. Speaking_attempts não tem esse conceito hoje;
  // tratamos só exercise_attempts (que cobre os 5 tipos de exercício).
  const dirtyLessonIds = new Set<string>();
  for (const ea of attemptsRes.data ?? []) {
    const lessonId = lessonByPart.get(ea.part_id);
    if (lessonId) dirtyLessonIds.add(lessonId);
  }
  let lessonsFlawless = 0;
  for (const lessonId of fullyCompleteLessons) {
    if (!dirtyLessonIds.has(lessonId)) lessonsFlawless++;
  }

  return {
    hasFirstDay,
    lessonsCompleted,
    lessonsFlawless,
    srsReviews,
    longestStreak,
    totalXp,
    totalStars,
    hasBookmark,
  };
}
