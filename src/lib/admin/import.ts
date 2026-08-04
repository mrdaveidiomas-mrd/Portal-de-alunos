"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin/guard";
import { draftLesson } from "@/lib/blocks/schemas";

// Recebe o JSON do draft (já editado pelo admin no preview), valida e SUBSTITUI
// as partes da lição-alvo. Cascade: ao deletar as partes existentes, blocos e
// exercise_solutions caem junto (FK on delete cascade).
export async function commitImportedDraft(formData: FormData) {
  const { supabase } = await requireAdmin();
  const lessonId = String(formData.get("lesson_id") ?? "");
  const draftJson = String(formData.get("draft") ?? "");
  if (!lessonId || !draftJson) return;

  let draft: ReturnType<typeof parseDraft>;
  try {
    draft = parseDraft(draftJson);
  } catch {
    return;
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("course_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return;
  const courseId = lesson.course_id;

  // Atualiza título da lição se o admin manteve o sugerido.
  const newTitle = String(formData.get("lesson_title") ?? "").trim();
  if (newTitle) {
    await supabase.from("lessons").update({ title: newTitle }).eq("id", lessonId);
  }

  // Substitui: apaga partes existentes; cascade limpa blocos/solutions.
  await supabase.from("parts").delete().eq("lesson_id", lessonId);

  for (const [pi, part] of draft.parts.entries()) {
    const { data: createdPart } = await supabase
      .from("parts")
      .insert({
        lesson_id: lessonId,
        course_id: courseId,
        title: part.title,
        kind: part.kind,
        position: pi,
      })
      .select("id")
      .single();
    if (!createdPart) continue;

    for (const [bi, block] of part.blocks.entries()) {
      const { data: created } = await supabase
        .from("blocks")
        .insert({
          part_id: createdPart.id,
          lesson_id: lessonId,
          course_id: courseId,
          type: block.type,
          data: block.data as never,
          position: bi,
        })
        .select("id")
        .single();
      if (!created) continue;

      if (block.type === "multiple_choice" || block.type === "fill_blank") {
        await supabase.from("exercise_solutions").upsert({
          block_id: created.id,
          course_id: courseId,
          solution: block.solution as never,
        });
      }
    }
  }

  revalidatePath(`/admin/licoes/${lessonId}`);
  revalidatePath(`/admin/cursos/${courseId}/modulos`);
  redirect(`/admin/licoes/${lessonId}`);
}

function parseDraft(raw: string) {
  return draftLesson.parse(JSON.parse(raw));
}
