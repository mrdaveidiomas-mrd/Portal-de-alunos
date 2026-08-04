import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Callback do fluxo PKCE do Supabase Auth. Recebe `?code=...&next=/destino`
// (vindo do link enviado no e-mail de redefinição), troca o código pela sessão
// e redireciona para o destino. Sem essa rota, o link do e-mail não autentica
// o usuário no app.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/painel";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
