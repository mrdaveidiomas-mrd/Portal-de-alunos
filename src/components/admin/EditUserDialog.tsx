"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { updateUser } from "@/lib/admin/actions";

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-tertiary";

// Dialog controlado por RowMenu. Edita nome e e-mail do profile.
// A mudança de role não está aqui (deletar e recriar com o role certo,
// ou adicionar uma ação dedicada no futuro).
export function EditUserDialog({
  open,
  onClose,
  id,
  initialFullName,
  initialEmail,
  role,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  initialFullName: string;
  initialEmail: string;
  role: "student" | "teacher";
}) {
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      await updateUser(formData);
      onClose();
    });
  }

  const label = role === "teacher" ? "professor" : "aluno";

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      title={`Editar ${label}`}
      description="Atualize o nome e o e-mail do aluno."
    >
      <form action={handleAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={id} />
        <input
          name="full_name"
          required
          autoFocus
          defaultValue={initialFullName}
          placeholder="Nome completo"
          autoComplete="off"
          className={inputCls}
        />
        <input
          name="email"
          type="email"
          required
          defaultValue={initialEmail}
          placeholder="E-mail"
          autoComplete="off"
          className={inputCls}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            Salvar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
