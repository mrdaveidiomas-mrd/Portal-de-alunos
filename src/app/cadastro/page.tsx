"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { signUp } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/types";

export default function CadastroPage() {
  const [state, formAction, isPending] = useActionState(
    signUp,
    initialAuthState,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-fg-primary">Criar conta</h1>
        <p className="text-sm text-fg-secondary">
          Cadastre-se para acessar o portal.
        </p>
      </div>

      <Card padded>
        <form action={formAction} className="flex flex-col gap-4">
          <Input
            label="Nome completo"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            placeholder="Seu nome"
          />
          <Input
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@exemplo.com"
          />
          <PasswordInput
            label="Senha"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Ao menos 8 caracteres"
            helperText="A senha precisa ter ao menos 8 caracteres."
            showStrength
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
            Criar conta
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-fg-secondary">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-fg-primary underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
