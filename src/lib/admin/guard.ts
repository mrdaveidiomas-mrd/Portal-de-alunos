import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getCurrentRole, getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export interface AdminContext {
  supabase: SupabaseClient<Database>;
  userId: string;
}

// Garante que o usuário atual é admin. Caso contrário, redireciona. Usado no
// layout do /admin (gate) e pode ser reusado nas Server Actions.
//
// user/role vêm de helpers com cache() (dedupados por render: layout + página
// + ações compartilham a MESMA chamada a /auth/v1/user e /profiles) e retry
// transitório.
export async function requireAdmin(): Promise<AdminContext> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role !== "admin") redirect("/painel");

  const supabase = await createClient();
  return { supabase, userId: user.id };
}
