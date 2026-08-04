"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { updatePassword } from "@/lib/auth/password";
import { initialAuthState } from "@/lib/auth/types";

// Formulário de definição de nova senha. Usado em /redefinir-senha (após o
// link do e-mail) e em /painel/senha (troca consciente). `redirectTo` opcional:
// quando definido, redireciona após sucesso (caso típico: pós-reset → painel).
export function ResetPasswordForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialAuthState,
  );

  useEffect(() => {
    if (state.notice && redirectTo) {
      const timer = setTimeout(() => router.push(redirectTo), 1200);
      return () => clearTimeout(timer);
    }
  }, [state.notice, redirectTo, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <PasswordInput
        label="Nova senha"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Ao menos 8 caracteres"
        showStrength
      />
      <PasswordInput
        label="Confirmar nova senha"
        name="confirm"
        autoComplete="new-password"
        required
        minLength={8}
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
        Salvar nova senha
      </Button>
    </form>
  );
}
