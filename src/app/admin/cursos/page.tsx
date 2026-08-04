import Link from "next/link";

import { CreateCourseDialog } from "@/components/admin/CreateCourseDialog";
import { Card } from "@/components/ui/Card";
import { requireAdmin } from "@/lib/admin/guard";

export default async function AdminCoursesPage() {
  const { supabase } = await requireAdmin();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, language, level, is_published")
    .order("created_at");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg-primary">Cursos</h1>
          <p className="text-sm text-fg-secondary">
            Liste, crie e gerencie os cursos do portal.
          </p>
        </div>
        <CreateCourseDialog />
      </div>

      <section className="flex flex-col gap-3">
        {(courses ?? []).length === 0 ? (
          <Card padded>
            <p className="text-sm text-fg-secondary">Nenhum curso ainda.</p>
          </Card>
        ) : (
          (courses ?? []).map((course) => (
            <Link key={course.id} href={`/admin/cursos/${course.id}/modulos`}>
              <Card
                padded
                interactive
                className="flex items-center justify-between gap-4"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-fg-primary">{course.title}</span>
                  <span className="text-xs text-fg-tertiary">
                    {course.language.toUpperCase()} · {course.level.toUpperCase()} ·
                    /{course.slug}
                  </span>
                </div>
                <span
                  className={
                    course.is_published
                      ? "rounded-full bg-success-bg px-2.5 py-1 text-xs text-success"
                      : "rounded-full border border-border-primary px-2.5 py-1 text-xs text-fg-tertiary"
                  }
                >
                  {course.is_published ? "Publicado" : "Rascunho"}
                </span>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
