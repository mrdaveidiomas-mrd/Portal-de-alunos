"use client";

import { useState, useTransition } from "react";

import { EditModuleDialog } from "@/components/admin/EditModuleDialog";
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
import { deleteModule, moveModule } from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";

// Agrupa todas as ações de um módulo (editar, subir, descer, excluir)
// dentro de um menu de 3 pontos. Os dialogs ficam montados aqui — o trigger
// vem dos itens do menu.
export function ModuleRowMenu({
  moduleId,
  courseId,
  moduleTitle,
}: {
  moduleId: string;
  courseId: string;
  moduleTitle: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function callMove(dir: "up" | "down") {
    const fd = new FormData();
    fd.set("id", moduleId);
    fd.set("course_id", courseId);
    fd.set("dir", dir);
    startTransition(async () => {
      await moveModule(fd);
      toast.info({
        title: dir === "up" ? "↑ Módulo reordenado" : "↓ Módulo reordenado",
      });
    });
  }

  function callDelete() {
    const fd = new FormData();
    fd.set("id", moduleId);
    fd.set("course_id", courseId);
    startTransition(async () => {
      await deleteModule(fd);
      setDeleteOpen(false);
      toast.success({
        title: "Módulo excluído",
        description: `"${moduleTitle}" foi removido junto com seu conteúdo.`,
      });
    });
  }

  return (
    <>
      <DropdownMenu label="Ações do módulo">
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

      <EditModuleDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        moduleId={moduleId}
        courseId={courseId}
        currentTitle={moduleTitle}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={callDelete}
        title="Excluir módulo"
        message={`Tem certeza que deseja excluir o módulo "${moduleTitle}"? Todas as lições, partes e blocos dentro dele serão removidos. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        pending={pending}
      />
    </>
  );
}
