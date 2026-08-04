"use client";

import { useState } from "react";

import { EditLessonDialog } from "@/components/admin/EditLessonDialog";
import { PencilIcon } from "@/components/icons/PencilIcon";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";

// Menu na header da página de lição. Por enquanto só "Editar" (renomear +
// publicação), mas fica preparado para crescer (excluir, duplicar, etc.).
export function LessonHeaderMenu({
  lessonId,
  courseId,
  currentTitle,
  currentDescription,
  isPublished,
}: {
  lessonId: string;
  courseId: string;
  currentTitle: string;
  currentDescription: string | null;
  isPublished: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu label="Ações da lição">
        <DropdownMenuItem
          icon={<PencilIcon className="h-4 w-4" />}
          onClick={() => setEditOpen(true)}
        >
          Editar
        </DropdownMenuItem>
      </DropdownMenu>

      <EditLessonDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        lessonId={lessonId}
        courseId={courseId}
        currentTitle={currentTitle}
        currentDescription={currentDescription}
        isPublished={isPublished}
      />
    </>
  );
}
