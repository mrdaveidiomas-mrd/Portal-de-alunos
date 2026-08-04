"use client";

import { useState, useTransition } from "react";

import { ArrowDownIcon } from "@/components/icons/ArrowDownIcon";
import { ArrowUpIcon } from "@/components/icons/ArrowUpIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { deleteBlock, moveBlock } from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";

// Menu de ações de uma linha de bloco (subir, descer, excluir). A edição
// de bloco é feita pelo BlockForm logo abaixo, em modo inline.
export function BlockRowMenu({
  blockId,
  partId,
}: {
  blockId: string;
  partId: string;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function callMove(dir: "up" | "down") {
    const fd = new FormData();
    fd.set("id", blockId);
    fd.set("part_id", partId);
    fd.set("dir", dir);
    startTransition(async () => {
      await moveBlock(fd);
      toast.info({
        title: dir === "up" ? "↑ Bloco reordenado" : "↓ Bloco reordenado",
      });
    });
  }

  function callDelete() {
    const fd = new FormData();
    fd.set("id", blockId);
    fd.set("part_id", partId);
    startTransition(async () => {
      await deleteBlock(fd);
      setDeleteOpen(false);
      toast.success({ title: "Bloco excluído" });
    });
  }

  return (
    <>
      <DropdownMenu label="Ações do bloco">
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

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={callDelete}
        title="Excluir bloco"
        message="Tem certeza que deseja excluir este bloco? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        pending={pending}
      />
    </>
  );
}
