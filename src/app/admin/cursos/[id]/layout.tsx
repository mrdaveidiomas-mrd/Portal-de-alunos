import { notFound } from "next/navigation";

import { CourseTabs } from "@/components/admin/CourseTabs";
import { BackLink } from "@/components/shared/BackLink";
import { requireAdmin } from "@/lib/admin/guard";

export default async function AdminCourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, is_published")
    .eq("id", id)
    .maybeSingle();
  if (!course) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/admin/cursos" label="Cursos" />
        <h1 className="text-2xl font-semibold text-fg-primary">{course.title}</h1>
        {!course.is_published && (
          <span className="self-start rounded-full border border-border-primary px-2.5 py-1 text-xs text-fg-tertiary">
            Rascunho
          </span>
        )}
      </div>

      <CourseTabs courseId={course.id} />

      <div>{children}</div>
    </div>
  );
}
