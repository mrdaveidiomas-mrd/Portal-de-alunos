"use client";

import { useState } from "react";

import { EditModuleDialog } from "@/components/admin/EditModuleDialog";

// Título do módulo clicável que abre o dialog de renomear.
// O módulo não tem página própria de edição — o "atalho direto" para
// editar é abrir o dialog, equivalente ao item "Editar" no menu.
export function ModuleTitle({
  moduleId,
  courseId,
  title,
}: {
  moduleId: string;
  courseId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-1 truncate text-left text-base font-semibold text-fg-primary transition-colors hover:text-fg-secondary"
        title="Renomear módulo"
      >
        {title}
      </button>
      <EditModuleDialog
        open={open}
        onClose={() => setOpen(false)}
        moduleId={moduleId}
        courseId={courseId}
        currentTitle={title}
      />
    </>
  );
}
