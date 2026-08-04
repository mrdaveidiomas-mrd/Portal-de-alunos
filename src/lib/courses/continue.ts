import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

// Para cada curso, identifica onde o aluno parou: a próxima parte ainda
// não concluída, a lição que a contém, e os contadores agregados (parte
// na lição, parte no curso). Alimenta o card "continuar de onde parou"
// no painel.
//
// Estratégia: 1 query por tabela (modules, lessons, parts, part_progress),
// tudo cobrindo o conjunto de courseIds em uma vez só. A ordem canônica
// (module.position → lesson.position → part.position) é aplicada
// in-memory após o fetch — assim mesmo que o aluno tenha vários cursos,
// só batemos no banco 4× no total.

export interface CourseContinueInfo {
  // Onde o aluno deve clicar para retomar. null = curso 100% concluído
  // ou sem parts publicadas.
  nextPartId: string | null;
  nextLessonTitle: string | null;
  // Posição da lição corrente entre o total (ex: "Lição 3 de 12").
  lessonIndex: number; // 1-based
  totalLessons: number;
  // Partes da lição corrente: feitas/total.
  partsDoneInLesson: number;
  partsTotalInLesson: number;
  // Curso inteiro: feitas/total.
  partsDoneInCourse: number;
  partsTotalInCourse: number;
}

export async function getContinueInfoForCourses(
  supabase: Client,
  userId: string,
  courseIds: string[],
): Promise<Map<string, CourseContinueInfo>> {
  const result = new Map<string, CourseContinueInfo>();
  if (courseIds.length === 0) return result;

  const [modulesRes, lessonsRes, partsRes, progressRes] = await Promise.all([
    supabase
      .from("modules")
      .select("id, course_id, position")
      .in("course_id", courseIds),
    supabase
      .from("lessons")
      .select("id, course_id, module_id, position, title, is_published")
      .in("course_id", courseIds),
    supabase
      .from("parts")
      .select("id, course_id, lesson_id, position")
      .in("course_id", courseIds),
    supabase
      .from("part_progress")
      .select("part_id, status")
      .eq("user_id", userId)
      .in("course_id", courseIds),
  ]);

  const modulePosById = new Map<string, number>();
  const moduleCourseById = new Map<string, string>();
  for (const m of modulesRes.data ?? []) {
    modulePosById.set(m.id, m.position);
    moduleCourseById.set(m.id, m.course_id);
  }

  // Lições só "is_published" devem contar — alunos não veem rascunhos.
  const lessons = (lessonsRes.data ?? []).filter((l) => l.is_published);
  const partsByLesson = new Map<string, { id: string; position: number }[]>();
  for (const p of partsRes.data ?? []) {
    const list = partsByLesson.get(p.lesson_id) ?? [];
    list.push({ id: p.id, position: p.position });
    partsByLesson.set(p.lesson_id, list);
  }
  for (const list of partsByLesson.values()) {
    list.sort((a, b) => a.position - b.position);
  }

  const completedSet = new Set<string>(
    (progressRes.data ?? [])
      .filter((p) => p.status === "completed")
      .map((p) => p.part_id),
  );

  // Agrupa lições por curso, ordenadas pela posição global do curso
  // (module.position, lesson.position).
  type LessonRow = {
    id: string;
    title: string;
    coursePos: number; // chave de ordenação canônica
  };
  const lessonsByCourse = new Map<string, LessonRow[]>();
  for (const l of lessons) {
    const modPos = modulePosById.get(l.module_id) ?? 0;
    // module.position é stride muito maior que lesson.position; aqui
    // basta uma ordenação composta.
    const coursePos = modPos * 10_000 + l.position;
    const list = lessonsByCourse.get(l.course_id) ?? [];
    list.push({ id: l.id, title: l.title, coursePos });
    lessonsByCourse.set(l.course_id, list);
  }
  for (const list of lessonsByCourse.values()) {
    list.sort((a, b) => a.coursePos - b.coursePos);
  }

  for (const courseId of courseIds) {
    const lessonList = lessonsByCourse.get(courseId) ?? [];
    const totalLessons = lessonList.length;

    let partsDoneInCourse = 0;
    let partsTotalInCourse = 0;
    for (const l of lessonList) {
      const parts = partsByLesson.get(l.id) ?? [];
      partsTotalInCourse += parts.length;
      for (const p of parts) {
        if (completedSet.has(p.id)) partsDoneInCourse++;
      }
    }

    // A "lição corrente" é a primeira lição que tem alguma parte não
    // concluída. Se todas estiverem completas, fica no última lição.
    let currentLessonIdx = -1;
    for (let i = 0; i < lessonList.length; i++) {
      const parts = partsByLesson.get(lessonList[i]!.id) ?? [];
      const allDone =
        parts.length > 0 && parts.every((p) => completedSet.has(p.id));
      if (!allDone) {
        currentLessonIdx = i;
        break;
      }
    }
    if (currentLessonIdx === -1 && lessonList.length > 0) {
      // 100% concluído: marca como a última lição.
      currentLessonIdx = lessonList.length - 1;
    }

    if (currentLessonIdx === -1) {
      // Curso sem lições publicadas com partes.
      result.set(courseId, {
        nextPartId: null,
        nextLessonTitle: null,
        lessonIndex: 0,
        totalLessons,
        partsDoneInLesson: 0,
        partsTotalInLesson: 0,
        partsDoneInCourse,
        partsTotalInCourse,
      });
      continue;
    }

    const currentLesson = lessonList[currentLessonIdx]!;
    const lessonParts = partsByLesson.get(currentLesson.id) ?? [];
    const partsDoneInLesson = lessonParts.filter((p) =>
      completedSet.has(p.id),
    ).length;
    const partsTotalInLesson = lessonParts.length;

    // Próxima parte = primeira não-concluída da lição corrente. Se a
    // lição já está toda concluída (caso de curso 100%), aponta para a
    // primeira parte da lição (revisar).
    const nextPart =
      lessonParts.find((p) => !completedSet.has(p.id)) ?? lessonParts[0];

    result.set(courseId, {
      nextPartId: nextPart?.id ?? null,
      nextLessonTitle: currentLesson.title,
      lessonIndex: currentLessonIdx + 1,
      totalLessons,
      partsDoneInLesson,
      partsTotalInLesson,
      partsDoneInCourse,
      partsTotalInCourse,
    });
  }

  return result;
}
