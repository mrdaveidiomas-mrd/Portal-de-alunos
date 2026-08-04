"use client";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

// Dialog reutilizável para qualquer ação que precisa de confirmação:
//   - exclusão (variant=danger),
//   - sair da conta (variant=danger),
//   - operações destrutivas em geral.
//
// O dialog é controlado pelo pai (open/onClose); ao confirmar dispara
// onConfirm. Suporta estado `pending` para mostrar loading no botão de
// confirmação.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  pending = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  pending?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      title={title}
      description={message}
    >
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={pending}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={variant}
          size="sm"
          onClick={onConfirm}
          loading={pending}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
