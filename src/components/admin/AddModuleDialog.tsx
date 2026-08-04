"use client";

import { useState, useTransition } from "react";

import { PlusIcon } from "@/components/icons/PlusIcon";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { createModule } from "@/lib/admin/actions";

// Botão "+ Novo módulo" que abre Dialog para criar o módulo do curso.
export function AddModuleDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      await createModule(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        Novo módulo
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Novo módulo"
        description="Dê um nome para o módulo. Você pode adicionar lições depois."
      >
        <form action={handleAction} className="flex flex-col gap-3">
          <input type="hidden" name="course_id" value={courseId} />
          <input
            name="title"
            placeholder="Nome do módulo"
            required
            autoFocus
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
