"use client";

import { useState } from "react";

import { MeetUrlEditDialog } from "@/components/professor/MeetUrlEditDialog";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { Button } from "@/components/ui/Button";

// Botão "Editar link" — abre o MeetUrlEditDialog. Wrapper client mínimo
// pra não precisar passar useState pra cada card no servidor.
export function EditMeetUrlButton({
  sessionId,
  initialMeetUrl,
}: {
  sessionId: string;
  initialMeetUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Editar link da aula"
        title="Editar link"
      >
        <PencilIcon className="h-4 w-4" />
        Editar link
      </Button>
      <MeetUrlEditDialog
        open={open}
        onClose={() => setOpen(false)}
        sessionId={sessionId}
        initialMeetUrl={initialMeetUrl}
      />
    </>
  );
}
