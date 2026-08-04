"use client";

import { useState, useTransition } from "react";

import { EditPartDialog } from "@/components/admin/EditPartDialog";
import { ArrowDownIcon } from "@/components/icons/ArrowDownIcon";
import { ArrowUpIcon } from "@/components/icons/ArrowUpIcon";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { deletePart, movePart } from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";

// Menu de ações de uma linha de parte.
export function PartRowMenu({
  partId,
  lessonId,
  partTitle,
  partDescription,
  partKind,
}: {
  partId: string;
  lessonId: string;
  partTitle: string;
  partDescription: string | null;
  partKind: "regular" | "golden";
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function callMove(dir: "up" | "down") {
    const fd = new FormData();
    fd.set("id", partId);
    fd.set("lesson_id", lessonId);
    fd.set("dir", dir);
    startTransition(async () => {
      await movePart(fd);
      toast.info({
        title: dir === "up" ? "↑ Parte reordenada" : "↓ Parte reordenada",
      });
    });
  }

  function callDelete() {
    const fd = new FormData();
    fd.set("id", partId);
    fd.set("lesson_id", lessonId);
    startTransition(async () => {
      await deletePart(fd);
      setDeleteOpen(false);
      toast.success({
        title: "Parte excluída",
        description: `"${partTitle}" foi removida junto com seus blocos.`,
      });
    });
  }

  return (
    <>
      <DropdownMenu label="Ações da parte">
        <DropdownMenuItem
          icon={<PencilIcon className="h-4 w-4" />}
          onClick={() => setEditOpen(true)}
        >
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<ArrowUpIcon className="h-4 w-4" />}
          onClick={() => callMove("up")}
        >
          Subir
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={<ArrowDownIcon className="h-4 w-4" />}
          onClick={() => callMove("down")}
        >
          Descer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={<TrashIcon className="h-4 w-4" />}
          variant="danger"
          onClick={() => setDeleteOpen(true)}
        >
          Excluir
        </DropdownMenuItem>
      </DropdownMenu>

      <EditPartDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        partId={partId}
        lessonId={lessonId}
        currentTitle={partTitle}
        currentDescription={partDescription}
        currentKind={partKind}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={callDelete}
        title="Excluir parte"
        message={`Tem certeza que deseja excluir a parte "${partTitle}"? Todos os blocos dentro dela serão removidos. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        pending={pending}
      />
    </>
  );
}
