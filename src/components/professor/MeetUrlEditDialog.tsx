"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { updateLiveSessionMeetUrl } from "@/lib/live-sessions/actions";
import { toast } from "@/lib/toast/store";

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary";

// Dialog mínimo: o professor edita SÓ o link do Meet da aula. Dia, hora
// e o próprio professor seguem reservados ao admin (decididos no momento
// do vínculo; trocar isso é mudança contratual e não operacional).
export function MeetUrlEditDialog({
  open,
  onClose,
  sessionId,
  initialMeetUrl,
}: {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  initialMeetUrl: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const res = await updateLiveSessionMeetUrl(formData);
      if (!res.ok) {
        toast.danger({
          title: "Não consegui salvar o link",
          description: res.error ?? "Tente de novo.",
        });
        return;
      }
      toast.success({ title: "Link atualizado" });
      onClose();
    });
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      title="Editar link da aula"
      description="Cole o link do Meet (ou outra plataforma) que o aluno usa pra entrar."
    >
      <form action={handleAction} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={sessionId} />
        <input
          name="meet_url"
          required
          autoFocus
          defaultValue={initialMeetUrl}
          placeholder="https://meet.google.com/abc-defg-hij"
          autoComplete="off"
          className={inputCls}
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
