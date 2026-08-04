import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// Raiz do app. O MVP tinha uma landing institucional aqui; com o produto
// já em uso real, manda direto para o destino certo:
//   - logado: respeita o papel (admin → /admin, professor → /professor,
//     aluno → /painel)
//   - deslogado: /login
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "teacher") redirect("/professor");
  redirect("/painel");
}
