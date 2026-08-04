"use client";

import { useState, useTransition } from "react";

import { PlusIcon } from "@/components/icons/PlusIcon";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { createPart } from "@/lib/admin/actions";

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-tertiary";

// Dialog para criar uma nova parte dentro da lição.
export function AddPartDialog({
  lessonId,
  courseId,
}: {
  lessonId: string;
  courseId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      await createPart(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        Nova parte
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nova parte"
        description="Dê um nome para a parte e escolha se é regular ou dourada (de revisão)."
      >
        <form action={handleAction} className="flex flex-col gap-3">
          <input type="hidden" name="lesson_id" value={lessonId} />
          <input type="hidden" name="course_id" value={courseId} />
          <input
            name="title"
            placeholder="Nome da parte"
            required
            autoFocus
            className={inputCls}
          />
          <input
            name="description"
            placeholder="Descrição curta (opcional)"
            className={inputCls}
          />
          <select name="kind" defaultValue="regular" className={inputCls}>
            <option value="regular">Regular</option>
            <option value="golden">Dourada</option>
          </select>
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
