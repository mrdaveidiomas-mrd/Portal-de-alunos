"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { ArrowDownIcon } from "@/components/icons/ArrowDownIcon";
import { ArrowUpIcon } from "@/components/icons/ArrowUpIcon";
import { CopyIcon } from "@/components/icons/CopyIcon";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import {
  deleteLesson,
  duplicateLesson,
  moveLesson,
} from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";

// Menu de ações de uma linha de lição: abrir editor (link), duplicar,
// subir/descer, excluir. "Editar lição" abre /admin/licoes/[id] em vez
// de um dialog porque a lição tem muito mais para configurar lá
// (publicação, partes, importar PDF, etc.) — ela tem seu próprio dialog
// de renomear na header daquela página.
export function LessonRowMenu({
  lessonId,
  moduleId,
  courseId,
  lessonTitle,
}: {
  lessonId: string;
  moduleId: string;
  courseId: string;
  lessonTitle: string;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function callDuplicate() {
    const fd = new FormData();
    fd.set("id", lessonId);
    fd.set("course_id", courseId);
    startTransition(async () => {
      await duplicateLesson(fd);
      toast.success({
        title: "Lição duplicada",
        description: `Uma cópia de "${lessonTitle}" foi adicionada ao módulo.`,
      });
    });
  }

  function callMove(dir: "up" | "down") {
    const fd = new FormData();
    fd.set("id", lessonId);
    fd.set("module_id", moduleId);
    fd.set("course_id", courseId);
    fd.set("dir", dir);
    startTransition(async () => {
      await moveLesson(fd);
      toast.info({
        title: dir === "up" ? "↑ Lição reordenada" : "↓ Lição reordenada",
      });
    });
  }

  function callDelete() {
    const fd = new FormData();
    fd.set("id", lessonId);
    fd.set("course_id", courseId);
    startTransition(async () => {
      await deleteLesson(fd);
      setDeleteOpen(false);
      toast.success({
        title: "Lição excluída",
        description: `"${lessonTitle}" foi removida junto com suas partes.`,
      });
    });
  }

  return (
    <>
      <DropdownMenu label="Ações da lição">
        <Link href={`/admin/licoes/${lessonId}`}>
          <DropdownMenuItem
            icon={<PencilIcon className="h-4 w-4" />}
            onClick={() => {
              /* navegação vem do <Link> envoltório */
            }}
          >
            Editar
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem
          icon={<CopyIcon className="h-4 w-4" />}
          onClick={callDuplicate}
        >
          Duplicar
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

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={callDelete}
        title="Excluir lição"
        message={`Tem certeza que deseja excluir a lição "${lessonTitle}"? Todas as partes e blocos dentro dela serão removidos. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        pending={pending}
      />
    </>
  );
}
