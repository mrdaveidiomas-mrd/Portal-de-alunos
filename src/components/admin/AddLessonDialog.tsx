"use client";

import { useState, useTransition } from "react";

import { PlusIcon } from "@/components/icons/PlusIcon";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { createLesson } from "@/lib/admin/actions";

// Botão "+" que abre um Dialog para adicionar uma nova lição ao módulo.
// O form usa a Server Action existente createLesson; o startTransition
// fecha o dialog após a action retornar.
export function AddLessonDialog({
  moduleId,
  courseId,
}: {
  moduleId: string;
  courseId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      await createLesson(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Adicionar lição"
        title="Adicionar lição"
      >
        <PlusIcon className="h-4 w-4" />
        Adicionar lição
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nova lição"
        description="Dê um nome para a lição. Você pode editar partes e blocos depois."
      >
        <form action={handleAction} className="flex flex-col gap-3">
          <input type="hidden" name="module_id" value={moduleId} />
          <input type="hidden" name="course_id" value={courseId} />
          <input
            name="title"
            placeholder="Nome da lição"
            required
            autoFocus
            className="h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-tertiary"
          />
          <input
            name="description"
            placeholder="Descrição curta (opcional)"
            className="h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-tertiary"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              Adicionar
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
