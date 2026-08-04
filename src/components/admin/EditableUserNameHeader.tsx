"use client";

import { useState } from "react";

import { EditUserDialog } from "@/components/admin/EditUserDialog";

// Wrapper client-side só para o NOME do header (aluno ou professor):
// clicar abre o EditUserDialog. O resto do header (avatar + e-mail)
// continua sendo renderizado no Server Component pai — só o nome é
// "interativo", evitando custo de hidratar elementos estáticos à toa.
export function EditableUserNameHeader({
  id,
  fullName,
  email,
  role,
  fallback = "—",
}: {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "teacher";
  fallback?: string;
}) {
  const [open, setOpen] = useState(false);
  const label = role === "teacher" ? "professor" : "aluno";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Editar nome e e-mail do ${label}`}
        // Botão "invisível" — herda o estilo do h1, mas ganha hover para
        // a cor da marca pra deixar claro que é clicável.
        className="group cursor-pointer self-start rounded-md text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-brand/40"
      >
        <h1 className="text-2xl font-semibold text-fg-primary transition-colors group-hover:text-primary-brand">
          {fullName || fallback}
        </h1>
      </button>

      <EditUserDialog
        open={open}
        onClose={() => setOpen(false)}
        id={id}
        initialFullName={fullName}
        initialEmail={email}
        role={role}
      />
    </>
  );
}
