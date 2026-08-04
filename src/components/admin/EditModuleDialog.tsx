"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { updateModule } from "@/lib/admin/actions";

// Dialog controlado para renomear módulo. O trigger fica por conta do pai
// (tipicamente um item de DropdownMenu). Fecha após updateModule retornar.
export function EditModuleDialog({
  open,
  onClose,
  moduleId,
  courseId,
  currentTitle,
}: {
  open: boolean;
  onClose: () => void;
  moduleId: string;
  courseId: string;
  currentTitle: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      await updateModule(formData);
      onClose();
    });
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      title="Renomear módulo"
    >
      <form action={handleAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={moduleId} />
        <input type="hidden" name="course_id" value={courseId} />
        <input
          name="title"
          defaultValue={currentTitle}
          required
          autoFocus
          className="h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-tertiary"
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            Salvar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
