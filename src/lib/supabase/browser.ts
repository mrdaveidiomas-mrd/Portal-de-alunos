import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

// Cliente Supabase para Client Components ('use client'). Usa a chave pública
// (anon), então toda autorização depende das políticas RLS no banco.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias. Confira o .env.",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
