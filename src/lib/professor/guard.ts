import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getCurrentRole, getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export interface TeacherContext {
  supabase: SupabaseClient<Database>;
  userId: string;
  isAdmin: boolean;
}

// Garante que o usuário atual é professor (ou admin). Senão, redireciona.
// Usado no layout do /professor e nas Server Actions futuras.
//
// user/role vêm de helpers com cache() (dedupados por render) e retry
// transitório — ver requireAdmin.
export async function requireTeacher(): Promise<TeacherContext> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role !== "teacher" && role !== "admin") {
    redirect("/painel");
  }

  const supabase = await createClient();
  return { supabase, userId: user.id, isAdmin: role === "admin" };
}
