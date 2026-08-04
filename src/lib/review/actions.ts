"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// Alterna a marcação "para revisar" da parte indicada para o usuário atual.
// Idempotente: se já existe, remove; se não existe, cria.
export async function toggleReviewMark(formData: FormData) {
  const partId = String(formData.get("part_id") ?? "");
  const courseId = String(formData.get("course_id") ?? "");
  if (!partId || !courseId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("review_marks")
    .select("id")
    .eq("user_id", user.id)
    .eq("part_id", partId)
    .maybeSingle();

  if (existing) {
    await supabase.from("review_marks").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("review_marks")
      .insert({ user_id: user.id, part_id: partId, course_id: courseId });

    // Primeira marcação pode disparar a conquista "first_bookmark".
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const { awardAchievements } = await import("@/lib/achievements/award");
      await awardAchievements(createAdminClient(), { userId: user.id });
    } catch {
      // Não-bloqueante.
    }
  }

  revalidatePath(`/partes/${partId}`);
  revalidatePath("/painel/revisar");
}
