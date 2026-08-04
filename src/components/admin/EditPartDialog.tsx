"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { updatePart } from "@/lib/admin/actions";

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-tertiary";

// Dialog controlado para renomear parte e alternar tipo (regular/dourada).
export function EditPartDialog({
  open,
  onClose,
  partId,
  lessonId,
  currentTitle,
  currentDescription,
  currentKind,
}: {
  open: boolean;
  onClose: () => void;
  partId: string;
  lessonId: string;
  currentTitle: string;
  currentDescription: string | null;
  currentKind: "regular" | "golden";
}) {
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      await updatePart(formData);
      onClose();
    });
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      title="Editar parte"
    >
      <form action={handleAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={partId} />
        <input type="hidden" name="lesson_id" value={lessonId} />
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
        <select name="kind" defaultValue={currentKind} className={inputCls}>
          <option value="regular">Regular</option>
          <option value="golden">Dourada</option>
        </select>
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
