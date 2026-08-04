"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils/cn";

// Dialog acessível baseado no elemento <dialog> nativo:
//   - ESC fecha (comportamento nativo do browser).
//   - Click no backdrop fecha (o evento de click acontece NO próprio <dialog>
//     porque o ::backdrop não tem children).
//   - showModal() faz o foco ficar trapped dentro do conteúdo.
//   - Sincronização aberta/fechada via useEffect olhando `open`.
//
// Estilizamos:
//   - bg do conteúdo (Card-like).
//   - ::backdrop com tint usando bg-color do tema (via inline style + var).
//   - animação de entrada respeita prefers-reduced-motion (mesma class do
//     resto do app, animate-fade-slide-in).

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  // Para casos em que o dialog precisa ser maior; default ~28rem.
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // Sincroniza prop `open` com o estado real do <dialog>.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Quando o usuário fecha pelo ESC (ou qualquer outro caminho nativo),
  // propaga para o pai para sincronizar o estado.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      // O click no backdrop tem o próprio <dialog> como target — clicks
      // dentro do conteúdo são interceptados pela div interna.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        // Reset do padding/border padrão do <dialog>.
        "m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border-primary bg-bg-secondary p-0 text-fg-primary shadow-[var(--shadow-3)] backdrop:bg-black/40",
        // Animação ao abrir.
        "open:animate-fade-slide-in",
        className,
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-4 p-5"
      >
        <header className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-fg-primary">{title}</h2>
          {description && (
            <p className="text-sm text-fg-secondary">{description}</p>
          )}
        </header>
        {children}
      </div>
    </dialog>
  );
}
