import { BackLink } from "@/components/shared/BackLink";
import { notFound } from "next/navigation";

import { ImportLessonClient } from "@/components/admin/ImportLessonClient";
import { requireAdmin } from "@/lib/admin/guard";

export default async function ImportarLicaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, course:courses(id, title, language)")
    .eq("id", id)
    .maybeSingle();
  if (!lesson || !lesson.course) notFound();

  const { count: existingParts } = await supabase
    .from("parts")
    .select("id", { head: true, count: "exact" })
    .eq("lesson_id", id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <BackLink href={`/admin/licoes/${id}`} label="Voltar para a lição" />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-fg-primary">
          Importar PDF para a lição
        </h1>
        <p className="text-sm text-fg-secondary">
          {lesson.course.title} · {lesson.title}
        </p>
      </div>
      <ImportLessonClient
        lessonId={lesson.id}
        courseLanguage={lesson.course.language as "en" | "es"}
        existingPartsCount={existingParts ?? 0}
      />
    </main>
  );
}
