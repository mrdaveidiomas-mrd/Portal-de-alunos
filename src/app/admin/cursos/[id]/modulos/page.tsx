import Link from "next/link";

import { AddLessonDialog } from "@/components/admin/AddLessonDialog";
import { AddModuleDialog } from "@/components/admin/AddModuleDialog";
import { LessonRowMenu } from "@/components/admin/LessonRowMenu";
import { ModuleRowMenu } from "@/components/admin/ModuleRowMenu";
import { ModuleTitle } from "@/components/admin/ModuleTitle";
import { SortableLessonsList } from "@/components/admin/SortableLessonsList";
import { SortableModulesList } from "@/components/admin/SortableModulesList";
import { Card } from "@/components/ui/Card";
import { requireAdmin } from "@/lib/admin/guard";

export default async function AdminCourseModulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, title, position")
      .eq("course_id", courseId)
      .order("position"),
    supabase
      .from("lessons")
      .select("id, module_id, title, description, position, is_published")
      .eq("course_id", courseId)
      .order("position"),
  ]);

  const lessonsByModule = new Map<string, typeof lessons>();
  for (const lesson of lessons ?? []) {
    const arr = lessonsByModule.get(lesson.module_id) ?? [];
    arr.push(lesson);
    lessonsByModule.set(lesson.module_id, arr);
  }

  // Pré-renderiza cada item como ReactNode para o SortableList client.
  const moduleItems = (modules ?? []).map((module) => {
    const moduleLessons = lessonsByModule.get(module.id) ?? [];
    return {
      id: module.id,
      content: (
        <Card padded className="flex flex-col gap-0 p-0">
          {/* Header do módulo */}
          <div className="flex items-center gap-2 border-b border-border-primary px-5 py-4">
            <ModuleTitle
              moduleId={module.id}
              courseId={courseId}
              title={module.title}
            />
            <ModuleRowMenu
              moduleId={module.id}
              courseId={courseId}
              moduleTitle={module.title}
            />
          </div>

          {/* Lista de lições (sortable interna) */}
          {moduleLessons.length > 0 ? (
            <div className="bg-bg-primary/40 py-1">
              <SortableLessonsList
                moduleId={module.id}
                courseId={courseId}
                items={moduleLessons.map((lesson) => ({
                  id: lesson.id,
                  content: (
                    <div className="group flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-primary-brand-surface">
                      <Link
                        href={`/admin/licoes/${lesson.id}`}
                        className="flex min-w-0 flex-1 flex-col transition-colors"
                        title="Abrir editor da lição"
                      >
                        <span className="truncate text-sm text-fg-primary group-hover:text-primary-brand">
                          {lesson.title}
                        </span>
                        {lesson.description && (
                          <span className="truncate text-xs text-fg-secondary">
                            {lesson.description}
                          </span>
                        )}
                      </Link>
                      {!lesson.is_published && (
                        // Badge "Rascunho" — chip arredondado com tinte
                        // warning. No light: surface âmbar com texto warning
                        // forte. No dark: warning-surface ja e rgba
                        // translucido + light variant clarinha — contrasta
                        // com surface-card sem virar amarelo gritante.
                        <span className="shrink-0 rounded-full bg-warning-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                          Rascunho
                        </span>
                      )}
                      <LessonRowMenu
                        lessonId={lesson.id}
                        moduleId={module.id}
                        courseId={courseId}
                        lessonTitle={lesson.title}
                      />
                    </div>
                  ),
                }))}
              />
            </div>
          ) : null}

          {/* Rodapé do card: adicionar nova lição */}
          <div className="flex items-center justify-end border-t border-border-primary px-5 py-3">
            <AddLessonDialog moduleId={module.id} courseId={courseId} />
          </div>
        </Card>
      ),
    };
  });

  return (
    <section className="flex flex-col gap-4">
      <SortableModulesList courseId={courseId} items={moduleItems} />

      <div className="flex justify-end">
        <AddModuleDialog courseId={courseId} />
      </div>
    </section>
  );
}
