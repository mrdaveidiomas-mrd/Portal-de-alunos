import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveCurrentStreak } from "@/lib/streak/queries";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

// Resumo de um aluno acompanhado pelo professor — agregado em todos os
// cursos em que ele está matriculado.
//
// Progresso medido em LIÇÕES, não em partes. Uma lição é considerada
// concluída quando TODAS as suas partes regulares (kind != "golden") têm
// progresso `completed`. Partes douradas são bônus e não gateiam a
// conclusão da lição.
export interface MyStudentRow {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  // Matrículas ativas — usado para listar "está em N curso(s)".
  enrolledCourses: number;
  lessonsCompleted: number;
  totalLessons: number;
  // Última atividade em part_progress (qualquer curso).
  lastActivity: string | null;
}

// Lista os alunos acompanhados pelo professor + métricas agregadas em
// todos os cursos em que cada aluno está matriculado. O conjunto de
// alunos vem de teacher_students; a partir daí cruzamos com enrollments
// (cursos ativos) e parts/part_progress (progresso) para o total/done
// de lições.
export async function getMyStudents(
  supabase: Client,
  teacherId: string,
): Promise<MyStudentRow[]> {
  // 1. IDs dos alunos vinculados a este professor.
  const { data: links } = await supabase
    .from("teacher_students")
    .select("student_id")
    .eq("teacher_id", teacherId);
  const studentIds = (links ?? []).map((l) => l.student_id);
  if (studentIds.length === 0) return [];

  // 2. Profile dos alunos.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .in("id", studentIds);

  // 3. Enrollments ativos dos alunos.
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("user_id, course_id")
    .in("user_id", studentIds)
    .eq("status", "active");

  const courseIds = Array.from(
    new Set((enrollments ?? []).map((e) => e.course_id)),
  );

  // 4. Universo de partes nesses cursos. Para cada lição,
  //    listamos o conjunto de partes REGULARES (golden é bônus
  //    e não gateia conclusão). E mapeamos course_id -> lessons.
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

  // 5. Progress por aluno (concluídos + última atividade).
  const { data: progress } = await supabase
    .from("part_progress")
    .select("user_id, part_id, status, updated_at")
    .in("user_id", studentIds);

  // Conjunto de partes concluídas POR aluno + última atividade.
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

  // Cursos por aluno.
  const coursesByStudent = new Map<string, Set<string>>();
  for (const e of enrollments ?? []) {
    const set = coursesByStudent.get(e.user_id) ?? new Set<string>();
    set.add(e.course_id);
    coursesByStudent.set(e.user_id, set);
  }

  return (profiles ?? []).map((p) => {
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
}

// Detalhe de UM aluno: cursos onde está matriculado + progresso em cada.
// Mesma régua do resumo: progresso em LIÇÕES, partes douradas fora do
// denominador.
export interface StudentLessonProgress {
  lessonId: string;
  lessonTitle: string;
  totalParts: number;
  partsCompleted: number;
}

export interface StudentCourseProgress {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  language: string;
  level: string;
  lessonsCompleted: number;
  totalLessons: number;
  lastActivity: string | null;
  // Quebra por lição (na ordem de position). Cada item permite ao
  // admin/professor enxergar QUAIS partes o aluno fez dentro daquela
  // lição (com SegmentedProgressBar de N segmentos).
  lessons: StudentLessonProgress[];
}

export interface MyStudentDetail {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  courses: StudentCourseProgress[];
}

// Detalha o progresso do aluno em todos os cursos ativos dele. Usada
// pela página /professor/alunos/[studentId].
export async function getStudentDetail(
  supabase: Client,
  studentId: string,
): Promise<MyStudentDetail | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", studentId)
    .maybeSingle();
  if (!profile) return null;

  const [gamRes, enrRes, progRes] = await Promise.all([
    supabase
      .from("user_gamification")
      .select("total_xp, current_streak, longest_streak, last_activity_date")
      .eq("user_id", studentId)
      .maybeSingle(),
    supabase
      .from("enrollments")
      .select("course:courses(id, title, slug, language, level)")
      .eq("user_id", studentId)
      .eq("status", "active"),
    supabase
      .from("part_progress")
      .select("part_id, course_id, status, updated_at")
      .eq("user_id", studentId),
  ]);

  // Universo de partes/lições por curso. Ordena tudo por position pra
  // que a quebra por lição apareça na ordem natural do curso e cada
  // segmento da SegmentedProgressBar corresponda a uma parte concreta.
  const courseIds = (enrRes.data ?? [])
    .map((row) => row.course?.id)
    .filter((id): id is string => !!id);
  const regularPartsByLesson = new Map<string, string[]>();
  const lessonsByCourse = new Map<
    string,
    { id: string; title: string }[]
  >();
  if (courseIds.length > 0) {
    const [partsRes, lessonsRes] = await Promise.all([
      supabase
        .from("parts")
        .select("id, course_id, lesson_id, kind, position")
        .in("course_id", courseIds)
        .order("position"),
      supabase
        .from("lessons")
        .select("id, course_id, title, position")
        .in("course_id", courseIds)
        .order("position"),
    ]);
    // Mapa rápido pra título.
    const lessonTitleById = new Map<string, string>();
    for (const l of lessonsRes.data ?? []) {
      lessonTitleById.set(l.id, l.title);
    }
    // Set de lessonIds que já apareceram por curso (preserva ordem
    // por position das lições).
    const seenLessonByCourse = new Map<string, Set<string>>();
    for (const l of lessonsRes.data ?? []) {
      const arr = lessonsByCourse.get(l.course_id) ?? [];
      const seen = seenLessonByCourse.get(l.course_id) ?? new Set<string>();
      if (!seen.has(l.id)) {
        arr.push({ id: l.id, title: l.title });
        seen.add(l.id);
        lessonsByCourse.set(l.course_id, arr);
        seenLessonByCourse.set(l.course_id, seen);
      }
    }
    // Partes regulares por lição, em ordem de position.
    for (const p of partsRes.data ?? []) {
      if (p.kind === "golden") continue;
      const arr = regularPartsByLesson.get(p.lesson_id) ?? [];
      arr.push(p.id);
      regularPartsByLesson.set(p.lesson_id, arr);
    }
    // Falha-segura: se algum part referencia um lessonId que nao apareceu
    // em lessons (raro — FK garante), pelo menos nao quebra. Adicionamos
    // como "Lição sem título" no fim.
    void lessonTitleById;
  }

  // Conjunto de partes concluídas + última atividade por curso.
  const completedParts = new Set<string>();
  const lastActivityByCourse = new Map<string, string>();
  for (const row of progRes.data ?? []) {
    if (row.status === "completed") completedParts.add(row.part_id);
    const prev = lastActivityByCourse.get(row.course_id);
    if (!prev || row.updated_at > prev) {
      lastActivityByCourse.set(row.course_id, row.updated_at);
    }
  }

  const courses: StudentCourseProgress[] = (enrRes.data ?? [])
    .map((row) => row.course)
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .map((c) => {
      const lessons = lessonsByCourse.get(c.id) ?? [];
      const lessonBreakdown: StudentLessonProgress[] = [];
      let totalLessons = 0;
      let lessonsCompleted = 0;
      for (const lesson of lessons) {
        const regularParts = regularPartsByLesson.get(lesson.id) ?? [];
        if (regularParts.length === 0) continue;
        totalLessons += 1;
        const partsCompleted = regularParts.filter((pid) =>
          completedParts.has(pid),
        ).length;
        if (partsCompleted === regularParts.length) lessonsCompleted += 1;
        lessonBreakdown.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          totalParts: regularParts.length,
          partsCompleted,
        });
      }
      return {
        courseId: c.id,
        courseTitle: c.title,
        courseSlug: c.slug,
        language: c.language,
        level: c.level,
        lessonsCompleted,
        totalLessons,
        lastActivity: lastActivityByCourse.get(c.id) ?? null,
        lessons: lessonBreakdown,
      };
    })
    // Filtra cursos sem qualquer engajamento — matrículas "frias" (aluno
    // foi vinculado mas nunca tocou) poluíam o perfil. lastActivity vira
    // null quando não existe nenhum part_progress, que é o sinal canônico
    // de "começou a estudar". Cursos novos aparecem assim que o aluno
    // resolve o primeiro bloco.
    .filter((c) => c.lastActivity !== null);

  return {
    userId: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    totalXp: gamRes.data?.total_xp ?? 0,
    currentStreak: resolveCurrentStreak(
      gamRes.data?.current_streak,
      gamRes.data?.last_activity_date,
    ),
    longestStreak: gamRes.data?.longest_streak ?? 0,
    courses,
  };
}
