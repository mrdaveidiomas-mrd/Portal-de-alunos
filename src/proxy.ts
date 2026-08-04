import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// Convenção "proxy" do Next 16 (substitui o antigo middleware.ts).
// Renova a sessão do Supabase a cada request e protege rotas.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Roda em todas as rotas, exceto estáticos e imagens. Necessário para o
  // refresh de sessão funcionar de forma consistente.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
