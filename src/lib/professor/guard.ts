import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export interface TeacherContext {
  supabase: SupabaseClient<Database>;
  userId: string;
  isAdmin: boolean;
}

// Garante que o usuário atual é professor (ou admin). Senão, redireciona.
// Usado no layout do /professor e nas Server Actions futuras.
export async function requireTeacher(): Promise<TeacherContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    redirect("/painel");
  }

  return { supabase, userId: user.id, isAdmin: profile.role === "admin" };
}
