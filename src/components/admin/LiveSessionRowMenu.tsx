"use client";

import { useState, useTransition } from "react";

import {
  LiveSessionDialog,
  type LiveSessionInitial,
  type TeacherOption,
} from "@/components/admin/LiveSessionDialog";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { deleteLiveSession } from "@/lib/live-sessions/actions";
import { toast } from "@/lib/toast/store";

// Menu de 3 pontinhos para uma linha de aula síncrona — abre edição
// ou exclusão (com confirm).
export function LiveSessionRowMenu({
  studentId,
  teachers,
  session,
}: {
  studentId: string;
  teachers: TeacherOption[];
  session: LiveSessionInitial;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function callDelete() {
    const fd = new FormData();
    fd.set("id", session.id);
    fd.set("student_id", studentId);
    startTransition(async () => {
      const res = await deleteLiveSession(fd);
      setDeleteOpen(false);
      if (res.ok) toast.success({ title: "Aula removida" });
      else if (res.error) toast.danger({ title: res.error });
    });
  }

  return (
    <>
      <DropdownMenu label="Ações da aula">
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

      <LiveSessionDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        studentId={studentId}
        teachers={teachers}
        initial={session}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={callDelete}
        title="Excluir aula?"
        message="A aula será removida do calendário do aluno. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        pending={pending}
        variant="danger"
      />
    </>
  );
}
