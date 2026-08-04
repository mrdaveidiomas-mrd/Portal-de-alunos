"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { PlusIcon } from "@/components/icons/PlusIcon";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { enrollStudent } from "@/lib/admin/actions";
import { initialEnrollState } from "@/lib/admin/types";
import { toast } from "@/lib/toast/store";

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary focus:outline-none focus:ring-2 focus:ring-fg-tertiary";

// Botão "+ Matricular aluno" que abre Dialog com o form de matrícula.
// Em sucesso o modal fecha sozinho + toast confirma; em erro fica aberto
// pra correção e mostra a mensagem inline.
//
// Em vez de useActionState (que dificulta o "fechar em sucesso" sem
// disparar o lint react-hooks/set-state-in-effect), chamamos a Server
// Action diretamente dentro de startTransition.
export function EnrollDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await enrollStudent(initialEnrollState, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setOpen(false);
      toast.success({
        title: "Aluno matriculado",
        description: result.notice ?? undefined,
      });
    });
  }

  function close() {
    if (pending) return;
    setError(null);
    setOpen(false);
  }

  function openDialog() {
    setError(null);
    setOpen(true);
  }

  return (
    <>
      <Button type="button" onClick={openDialog}>
        <PlusIcon className="h-4 w-4" />
        Matricular aluno
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title="Matricular aluno"
        description="Informe o e-mail do aluno já cadastrado para liberar acesso ao curso."
      >
        <form action={handleAction} className="flex flex-col gap-3">
          <input type="hidden" name="course_id" value={courseId} />
          <input
            name="email"
            type="email"
            required
            autoFocus
            placeholder="E-mail do aluno"
            autoComplete="off"
            className={inputCls}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <p className="text-xs text-fg-tertiary">
            O aluno precisa já ter conta no portal. Se não tem,{" "}
            <Link
              href="/admin/alunos"
              className="font-medium text-primary-brand transition-colors hover:text-primary-brand-hover"
            >
              crie a conta em Alunos
            </Link>{" "}
            e volte aqui para matricular.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={close}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              Matricular
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
