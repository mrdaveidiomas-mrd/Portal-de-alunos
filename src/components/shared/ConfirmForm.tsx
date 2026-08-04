"use client";

import { useRef, useState, useTransition, type ComponentProps } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// Wrapper de <form action={serverAction}> que substitui window.confirm()
// por um ConfirmDialog estilizado. O fluxo é:
//   1. Usuário clica no submit dentro do form → onSubmit intercepta e
//      abre o dialog (a Server Action ainda não foi chamada).
//   2. Cancelar → fecha dialog, nada acontece.
//   3. Confirmar → extrai FormData do form e chama a Server Action
//      diretamente via startTransition.
//
// Como children já incluem <input type="hidden" />, a FormData carrega
// todos os campos necessários — não precisamos refazer markup.

type FormProps = ComponentProps<"form">;
type FormAction = NonNullable<FormProps["action"]>;

export function ConfirmForm({
  action,
  title = "Tem certeza?",
  message,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  className,
  children,
}: {
  action: FormAction;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOpen(true);
  }

  function handleConfirm() {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    startTransition(async () => {
      // Server Actions são funções async chamáveis com FormData. Quando
      // `action` foi passado como string (raro neste app), o type acima
      // ainda passa — mas a chamada falharia. Aceitamos esse risco aqui
      // porque na prática só usamos com Server Actions.
      if (typeof action === "function") {
        await action(formData);
      }
      setOpen(false);
    });
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={className}
      >
        {children}
      </form>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant="danger"
        pending={pending}
      />
    </>
  );
}
