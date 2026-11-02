import { redirect } from "next/navigation";

import { getCurrentRole, getCurrentUser } from "@/lib/auth/session";

// Raiz do app. O MVP tinha uma landing institucional aqui; com o produto
// já em uso real, manda direto para o destino certo:
//   - logado: respeita o papel (admin → /admin, professor → /professor,
//     aluno → /painel)
//   - deslogado: /login
//
// user/role via helpers com cache() + retry transitório (ver lib/auth/session).
export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role === "admin") redirect("/admin");
  if (role === "teacher") redirect("/professor");
  redirect("/painel");
}
