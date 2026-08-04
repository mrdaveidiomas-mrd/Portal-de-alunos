"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { TrashIcon } from "@/components/icons/TrashIcon";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteUser } from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";

// Botão "Excluir" no rodapé do perfil de aluno/professor no admin.
// Mesmo fluxo do UserRowMenu da listagem (ConfirmDialog + deleteUser),
// mas com redirect explícito pra lista — a página detalhe deixa de
// existir após o delete.
export function DeleteUserButton({
  id,
  fullName,
  email,
  role,
}: {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "teacher";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const label = role === "teacher" ? "professor" : "aluno";
  const Label = role === "teacher" ? "Professor" : "Aluno";
  const listHref = role === "teacher" ? "/admin/professores" : "/admin/alunos";

  function handleConfirm() {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteUser(fd);
      toast.success({
        title: `${Label} excluído`,
        description: `${fullName || email} foi removido.`,
      });
      router.push(listHref);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <TrashIcon className="h-4 w-4" />
        Excluir {label}
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={`Excluir ${label}?`}
        message={`A conta de ${fullName || email} será apagada definitivamente, junto com matrículas e histórico. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        pending={pending}
        variant="danger"
      />
    </>
  );
}
