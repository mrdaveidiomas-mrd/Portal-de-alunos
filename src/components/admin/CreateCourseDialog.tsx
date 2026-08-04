"use client";

import { useState, useTransition } from "react";

import { PlusIcon } from "@/components/icons/PlusIcon";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { createCourse } from "@/lib/admin/actions";

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-tertiary";

// Botão "+ Novo curso" que abre Dialog com o form de criação.
// Fecha após createCourse retornar via useTransition.
export function CreateCourseDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      await createCourse(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        Novo curso
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Novo curso"
        description="Crie um curso novo. Você pode publicar depois."
      >
        <form action={handleAction} className="flex flex-col gap-3">
          <input
            name="title"
            required
            autoFocus
            placeholder="Título"
            className={inputCls}
          />
          <input
            name="slug"
            placeholder="URL (opcional)"
            className={inputCls}
          />
          <div className="flex gap-3">
            <select name="language" className={inputCls} defaultValue="en">
              <option value="en">Inglês</option>
              <option value="es">Espanhol</option>
            </select>
            <select name="level" className={inputCls} defaultValue="a1">
              {["a1", "a2", "b1", "b2", "c1", "c2"].map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
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
              Criar curso
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
