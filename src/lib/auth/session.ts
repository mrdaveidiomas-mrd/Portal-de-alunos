import { cache } from "react";

import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { withTransientRetry } from "@/lib/utils/retry";

// Sessão do usuário para Server Components / Server Actions. Duas melhorias
// sobre chamar supabase.auth.getUser() direto em cada lugar:
//
//   1) cache() do React → DEDUPA por render. getUser() é uma ida à rede ao
//      GoTrue e era chamado várias vezes no MESMO request (proxy, guard,
//      página). Com cache(), colapsa numa chamada só por render — corta boa
//      parte do volume em /auth/v1/user, que era o endpoint mais chamado.
//
//   2) withTransientRetry → um 504/timeout momentâneo do gateway não derruba
//      mais a página; refaz uma vez. Em falha PERSISTENTE, retorna null —
//      mesma semântica de antes (sem usuário → o chamador redireciona p/ login).

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  try {
    return await withTransientRetry(async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    });
  } catch {
    return null;
  }
});

// Papel (student/teacher/admin) do usuário atual — também dedupado + com retry.
export const getCurrentRole = cache(async (): Promise<string | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  try {
    return await withTransientRetry(async () => {
      const { data, error, status } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      // O PostgREST devolve o status na resposta, não no objeto de erro.
      if (error) throw Object.assign(error, { status });
      return (data?.role as string | undefined) ?? null;
    });
  } catch {
    return null;
  }
});
