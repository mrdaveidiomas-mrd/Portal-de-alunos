"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { signOut } from "@/lib/auth/actions";

// Botão de sair com ConfirmDialog amigável. A Server Action `signOut`
// recebe FormData mas não a inspeciona — passamos um FormData vazio.
export function SignOutButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await signOut();
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={() => setOpen(true)}
      >
        Sair
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Sair da sua conta?"
        message="Você será levado de volta para a tela de login. Pode entrar novamente quando quiser."
        confirmLabel="Sair"
        cancelLabel="Continuar logado"
        pending={pending}
      />
    </>
  );
}
