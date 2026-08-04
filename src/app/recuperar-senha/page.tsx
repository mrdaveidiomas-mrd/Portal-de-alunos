"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { requestPasswordReset } from "@/lib/auth/password";
import { initialAuthState } from "@/lib/auth/types";

export default function RecuperarSenhaPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialAuthState,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-fg-primary">
          Recuperar senha
        </h1>
        <p className="text-sm text-fg-secondary">
          Digite seu e-mail e enviaremos um link para você redefinir a senha.
        </p>
      </div>

      <Card padded>
        <form action={formAction} className="flex flex-col gap-4">
          <Input
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@exemplo.com"
          />

          {state.error && (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
          {state.notice && (
            <p role="status" className="text-sm text-success">
              {state.notice}
            </p>
          )}

          <Button type="submit" loading={isPending} className="w-full">
            Enviar link de redefinição
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-fg-secondary">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-medium text-fg-primary underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
