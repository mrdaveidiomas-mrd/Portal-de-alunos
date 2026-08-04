import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

// Cliente Supabase com a chave service_role. IGNORA RLS e tem poder total sobre
// o banco — use APENAS em código server-only seguro (Edge Functions, rotas
// server-only). Nunca importar em Client Components.
//
// A chave não é NEXT_PUBLIC_, então o Next jamais a inclui no bundle do browser;
// a guarda abaixo é uma trava extra contra uso acidental no cliente.
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient é server-only e não pode rodar no browser.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias. Confira o .env.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
