import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

// O usuário chega aqui após clicar no link do e-mail, que passou por
// /auth/callback e estabeleceu a sessão. Se não houver sessão, o link foi
// inválido/expirado — orientamos a pedir outro.
export default async function RedefinirSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
        <Card padded className="flex flex-col gap-3 text-center">
          <h1 className="text-xl font-semibold text-fg-primary">
            Link inválido ou expirado
          </h1>
          <p className="text-sm text-fg-secondary">
            Peça um novo link de redefinição. Os links têm validade limitada.
          </p>
          <Link href="/recuperar-senha" className="self-center">
            <Button type="button" size="sm">
              Pedir novo link
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-fg-primary">Nova senha</h1>
        <p className="text-sm text-fg-secondary">
          Defina uma nova senha para <strong>{user.email}</strong>.
        </p>
      </div>

      <Card padded>
        <ResetPasswordForm redirectTo="/painel" />
      </Card>
    </main>
  );
}

export const dynamic = "force-dynamic";
