"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Switch } from "@/components/ui/Switch";
import { updateLesson } from "@/lib/admin/actions";

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-tertiary";

// Dialog controlado para renomear lição e alternar publicação.
export function EditLessonDialog({
  open,
  onClose,
  lessonId,
  courseId,
  currentTitle,
  currentDescription,
  isPublished,
}: {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  courseId: string;
  currentTitle: string;
  currentDescription: string | null;
  isPublished: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      await updateLesson(formData);
      onClose();
    });
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      title="Editar lição"
    >
      <form action={handleAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={lessonId} />
        <input type="hidden" name="course_id" value={courseId} />
        <input
          name="title"
          defaultValue={currentTitle}
          required
          autoFocus
          className={inputCls}
        />
        <input
          name="description"
          defaultValue={currentDescription ?? ""}
          placeholder="Descrição curta (opcional)"
          className={inputCls}
        />
        <Switch
          name="is_published"
          defaultChecked={isPublished}
          label="Publicada"
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
