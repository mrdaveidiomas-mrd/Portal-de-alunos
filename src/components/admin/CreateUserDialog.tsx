"use client";

import { useActionState, useState } from "react";

import { PlusIcon } from "@/components/icons/PlusIcon";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { createUser } from "@/lib/admin/actions";
import { initialCreateUserState } from "@/lib/admin/types";

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-tertiary";

// Botão "+ Novo aluno|professor" que abre Dialog com o form de criação.
// Reaproveita a Server Action `createUser` (passando o role como
// argumento via .bind). Mostra credenciais geradas após sucesso, em
// caixa destacada para o admin copiar.
export function CreateUserDialog({
  role,
}: {
  role: "student" | "teacher";
}) {
  const [open, setOpen] = useState(false);
  const action = createUser.bind(null, role);
  const [state, formAction, pending] = useActionState(
    action,
    initialCreateUserState,
  );

  const label = role === "teacher" ? "professor" : "aluno";
  const Label = role === "teacher" ? "Professor" : "Aluno";

  function close() {
    if (pending) return;
    setOpen(false);
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        Novo {label}
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title={`Novo ${label}`}
        description="Crie uma senha temporária ou use uma senha aleatória do sistema."
      >
        <form action={formAction} className="flex flex-col gap-3">
          <input
            name="full_name"
            required
            autoFocus
            placeholder="Nome completo"
            autoComplete="off"
            className={inputCls}
          />
          <input
            name="email"
            type="email"
            required
            placeholder="E-mail"
            autoComplete="off"
            className={inputCls}
          />
          <PasswordInput
            name="password"
            placeholder="Senha (opcional)"
            autoComplete="off"
            minLength={8}
            showStrength
          />

          {state.error && (
            <p className="text-sm text-danger">{state.error}</p>
          )}

          {state.credentials && (
            <div className="flex flex-col gap-2 rounded-md border border-success/40 bg-success-bg/40 p-3 text-sm">
              <p className="font-medium text-success">{state.notice}</p>
              <div className="flex flex-col gap-1 text-fg-secondary">
                <span>
                  E-mail:{" "}
                  <code className="rounded bg-bg-tertiary px-1 py-0.5 text-fg-primary">
                    {state.credentials.email}
                  </code>
                </span>
                <span>
                  Senha:{" "}
                  <code className="rounded bg-bg-tertiary px-1 py-0.5 text-fg-primary">
                    {state.credentials.password}
                  </code>
                </span>
              </div>
              <p className="text-xs text-fg-tertiary">
                Anote agora — a senha não será exibida de novo.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={close}
              disabled={pending}
            >
              {state.credentials ? "Fechar" : "Cancelar"}
            </Button>
            {!state.credentials && (
              <Button type="submit" size="sm" loading={pending}>
                Criar {Label.toLowerCase()}
              </Button>
            )}
          </div>
        </form>
      </Dialog>
    </>
  );
}
