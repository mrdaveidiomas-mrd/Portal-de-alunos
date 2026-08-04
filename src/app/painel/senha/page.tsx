import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { BackLink } from "@/components/shared/BackLink";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";

// Aceita ?from=admin|professor para customizar o link de volta —
// admin/professor caem aqui via "Trocar senha" das próprias
// configurações, e o "Voltar" deve levar pra essa origem (não pra
// /painel do aluno).
export default async function TrocarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { from } = await searchParams;
  const backLabel = "Voltar às configurações";
  let backHref = "/painel/configuracoes";
  if (from === "admin") {
    backHref = "/admin/configuracoes";
  } else if (from === "professor") {
    backHref = "/professor/configuracoes";
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <BackLink href={backHref} label={backLabel} />
        <h1 className="text-2xl font-semibold text-fg-primary">Trocar senha</h1>
        <p className="text-sm text-fg-secondary">
          Defina uma nova senha para <strong>{user.email}</strong>.
        </p>
      </div>

      <Card padded>
        <ResetPasswordForm />
      </Card>
    </main>
  );
}
