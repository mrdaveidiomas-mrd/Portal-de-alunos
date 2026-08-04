"use client";

import { useState, useTransition } from "react";

import { EditUserDialog } from "@/components/admin/EditUserDialog";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { deleteUser } from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";

// Menu de ações por linha de usuário (aluno ou professor).
// Editar abre dialog; excluir abre ConfirmDialog antes.
export function UserRowMenu({
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
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const label = role === "teacher" ? "professor" : "aluno";

  function callDelete() {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteUser(fd);
      setDeleteOpen(false);
      toast.success({
        title: `${role === "teacher" ? "Professor" : "Aluno"} excluído`,
        description: `${fullName || email} foi removido.`,
      });
    });
  }

  return (
    <>
      <DropdownMenu label={`Ações de ${label}`}>
        <DropdownMenuItem
          icon={<PencilIcon className="h-4 w-4" />}
          onClick={() => setEditOpen(true)}
        >
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={<TrashIcon className="h-4 w-4" />}
          onClick={() => setDeleteOpen(true)}
          variant="danger"
        >
          Excluir
        </DropdownMenuItem>
      </DropdownMenu>

      <EditUserDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        id={id}
        initialFullName={fullName}
        initialEmail={email}
        role={role}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={callDelete}
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
