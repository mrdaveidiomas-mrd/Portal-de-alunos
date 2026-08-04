import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

// Linha resumida de um aluno — mesma régua do dashboard do professor
// (progresso em LIÇÕES, partes douradas fora do denominador). Reutilizada
// pelo painel inicial do admin pra mostrar a atividade recente da escola.
export interface AdminStudentRow {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  enrolledCourses: number;
  lessonsCompleted: number;
  totalLessons: number;
  lastActivity: string | null;
}

export interface AdminOverview {
  // Alunos com pelo menos uma matrícula ativa em algum curso.
  enrolledStudents: number;
  // Alunos (role=student) que tiveram qualquer xp_event nos últimos
  // 7 dias — proxy razoável de "estudaram alguma coisa".
  activeStudents: number;
  // Total de profiles com role=teacher.
  teachers: number;
  // Total de cursos cadastrados (rascunho + publicado).
  courses: number;
  // Quebras complementares para evitar uma segunda viagem ao banco
  // quando o admin quiser entender melhor cada número.
  publishedCourses: number;
}

// Agrega os números do dashboard inicial do admin. Cada chamada faz 5
// counts em paralelo — barato e dentro do regime de RLS (admin tem
// SELECT em todas as tabelas via private.is_admin()).
export async function getAdminOverview(
  supabase: Client,
): Promise<AdminOverview> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1) Lista de IDs de alunos com matrícula ativa (distinct).
  //    Postgrest não tem distinct count direto numa única chamada,
  //    então puxamos os user_id e contamos no JS. Para escalas
  //    pequenas/médias é OK; se virar gargalo, dá pra criar uma view.
  const enrollmentsRes = await supabase
    .from("enrollments")
    .select("user_id")
    .eq("status", "active");

  // 2) IDs de quem teve xp_event nos últimos 7 dias.
  const recentXpRes = await supabase
    .from("xp_events")
    .select("user_id")
    .gte("created_at", sevenDaysAgo.toISOString());

  // 3, 4, 5) Counts simples em paralelo.
  const [teachersRes, coursesRes, publishedRes, studentIdsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "teacher"),
      supabase
        .from("courses")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      // Conjunto de IDs com role=student — usado para filtrar
      // o "alunos ativos" para não contar professor/admin que por
      // ventura tenham xp_event de teste.
      supabase.from("profiles").select("id").eq("role", "student"),
    ]);

  const enrolledStudents = new Set(
    (enrollmentsRes.data ?? []).map((r) => r.user_id),
  ).size;

  const studentIdSet = new Set(
    (studentIdsRes.data ?? []).map((r) => r.id),
  );
  const activeIds = new Set<string>();
  for (const ev of recentXpRes.data ?? []) {
    if (studentIdSet.has(ev.user_id)) activeIds.add(ev.user_id);
  }

  return {
    enrolledStudents,
    activeStudents: activeIds.size,
    teachers: teachersRes.count ?? 0,
    courses: coursesRes.count ?? 0,
    publishedCourses: publishedRes.count ?? 0,
  };
}

// Top-N alunos da escola ordenados por última atividade (DESC). Quem
// nunca teve atividade vai pro fim — admin ainda enxerga matriculados
// recentes se a escola for pequena. Mesma agregação do professor:
// progresso em LIÇÕES, partes douradas fora.
export async function getRecentlyActiveStudents(
  supabase: Client,
  limit = 5,
): Promise<AdminStudentRow[]> {
  // 1. Todos os alunos (role=student). Admin enxerga via RLS
  //    (private.is_admin()).
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("role", "student");
  const students = profiles ?? [];
  if (students.length === 0) return [];
  const studentIds = students.map((p) => p.id);

  // 2. Enrollments ativos — pra contar cursos e descobrir o universo
  //    de partes/lições.
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("user_id, course_id")
    .in("user_id", studentIds)
    .eq("status", "active");

  const courseIds = Array.from(
    new Set((enrollments ?? []).map((e) => e.course_id)),
  );

  // 3. Universo: por lição, conjunto de partes regulares (golden é bônus).
  const regularPartsByLesson = new Map<string, string[]>();
  const lessonsByCourse = new Map<string, Set<string>>();
  if (courseIds.length > 0) {
    const { data: parts } = await supabase
      .from("parts")
      .select("id, course_id, lesson_id, kind")
      .in("course_id", courseIds);
    for (const p of parts ?? []) {
      if (p.kind === "golden") continue;
      const arr = regularPartsByLesson.get(p.lesson_id) ?? [];
      arr.push(p.id);
      regularPartsByLesson.set(p.lesson_id, arr);
      const set = lessonsByCourse.get(p.course_id) ?? new Set<string>();
      set.add(p.lesson_id);
      lessonsByCourse.set(p.course_id, set);
    }
  }

  // 4. Progress por aluno — completed + max(updated_at) pra última atividade.
  const { data: progress } = await supabase
    .from("part_progress")
    .select("user_id, part_id, status, updated_at")
    .in("user_id", studentIds);

  const completedPartsByStudent = new Map<string, Set<string>>();
  const lastActivityByStudent = new Map<string, string>();
  for (const row of progress ?? []) {
    if (row.status === "completed") {
      const set = completedPartsByStudent.get(row.user_id) ?? new Set<string>();
      set.add(row.part_id);
      completedPartsByStudent.set(row.user_id, set);
    }
    const prev = lastActivityByStudent.get(row.user_id);
    if (!prev || row.updated_at > prev) {
      lastActivityByStudent.set(row.user_id, row.updated_at);
    }
  }

  // 5. Cursos por aluno.
  const coursesByStudent = new Map<string, Set<string>>();
  for (const e of enrollments ?? []) {
    const set = coursesByStudent.get(e.user_id) ?? new Set<string>();
    set.add(e.course_id);
    coursesByStudent.set(e.user_id, set);
  }

  // 6. Monta as linhas.
  const rows: AdminStudentRow[] = students.map((p) => {
    const courses = coursesByStudent.get(p.id) ?? new Set();
    const completed = completedPartsByStudent.get(p.id) ?? new Set<string>();

    let totalLessons = 0;
    let lessonsCompleted = 0;
    for (const cid of courses) {
      const lessons = lessonsByCourse.get(cid);
      if (!lessons) continue;
      for (const lessonId of lessons) {
        const regularParts = regularPartsByLesson.get(lessonId) ?? [];
        if (regularParts.length === 0) continue;
        totalLessons += 1;
        if (regularParts.every((pid) => completed.has(pid))) {
          lessonsCompleted += 1;
        }
      }
    }

    return {
      userId: p.id,
      email: p.email,
      fullName: p.full_name,
      avatarUrl: p.avatar_url,
      enrolledCourses: courses.size,
      lessonsCompleted,
      totalLessons,
      lastActivity: lastActivityByStudent.get(p.id) ?? null,
    };
  });

  // 7. Ordena por última atividade DESC, nulls por último; corta em N.
  rows.sort((a, b) => {
    if (a.lastActivity && b.lastActivity) {
      return a.lastActivity > b.lastActivity ? -1 : 1;
    }
    if (a.lastActivity) return -1;
    if (b.lastActivity) return 1;
    return 0;
  });
  return rows.slice(0, limit);
}
