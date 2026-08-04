import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export interface AdminContext {
  supabase: SupabaseClient<Database>;
  userId: string;
}

// Garante que o usuário atual é admin. Caso contrário, redireciona. Usado no
// layout do /admin (gate) e pode ser reusado nas Server Actions.
export async function requireAdmin(): Promise<AdminContext> {
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

  if (profile?.role !== "admin") redirect("/painel");

  return { supabase, userId: user.id };
}
