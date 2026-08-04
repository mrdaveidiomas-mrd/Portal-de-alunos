import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getContinueInfoForCourses,
  type CourseContinueInfo,
} from "@/lib/courses/continue";
import type { Database } from "@/types/database";
import type { Course } from "@/types/content";
import type { UserGamification } from "@/types/gamification";

type Client = SupabaseClient<Database>;

export interface StudentDashboard {
  gamification: UserGamification | null;
  courses: Course[];
  // Por courseId, onde o aluno parou (próxima parte + progresso).
  continueByCourseId: Map<string, CourseContinueInfo>;
  // Total de conquistas já coletadas (XP creditado).
  achievementsCount: number;
  // Conquistas atingidas mas ainda não coletadas pelo aluno —
  // alimenta o badge "X para coletar" no card de conquistas.
  claimableCount: number;
}

// Busca os dados do dashboard do aluno (gamificação + cursos matriculados).
// A RLS garante que só vêm dados do próprio usuário / cursos acessíveis.
export async function getStudentDashboard(
  supabase: Client,
  userId: string,
): Promise<StudentDashboard> {
  const [
    gamificationResult,
    enrollmentsResult,
    claimedResult,
    pendingResult,
  ] = await Promise.all([
    supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("enrollments")
      .select("course:courses(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("user_achievements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("claimed_at", "is", null),
    supabase
      .from("user_achievements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("claimed_at", null),
  ]);

  const courses = (enrollmentsResult.data ?? [])
    .map((row) => row.course)
    .filter((course): course is Course => course !== null);

  const continueByCourseId = await getContinueInfoForCourses(
    supabase,
    userId,
    courses.map((c) => c.id),
  );

  return {
    gamification: gamificationResult.data,
    courses,
    continueByCourseId,
    achievementsCount: claimedResult.count ?? 0,
    claimableCount: pendingResult.count ?? 0,
  };
}
