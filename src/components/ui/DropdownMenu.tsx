"use client";

import { useEffect, useRef, useState } from "react";

import { DotsIcon } from "@/components/icons/DotsIcon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

// Menu de ações estilo "3 pontinhos". Implementação compacta sem dependência:
//   - Trigger: botão ghost com DotsIcon.
//   - Popover: position absolute, alinhado à direita do trigger.
//   - Fecha em pointerdown fora do container e em ESC.
//   - Click em qualquer item fecha o menu (handler no container do menu).
//   - Animação respeita prefers-reduced-motion (.animate-fade-slide-in).

export function DropdownMenu({
  label = "Mais ações",
  children,
  align = "end",
}: {
  label?: string;
  children: React.ReactNode;
  // Alinhamento horizontal do menu em relação ao trigger.
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((o) => !o)}
      >
        <DotsIcon className="h-4 w-4" />
      </Button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-20 mt-1 min-w-44 overflow-hidden rounded-md border border-border-primary bg-bg-secondary shadow-[var(--shadow-2)] animate-fade-slide-in",
            align === "end" ? "right-0" : "left-0",
          )}
          // Fecha o menu após qualquer click dentro (afinal item clicado já
          // executou seu onClick). Isso simplifica o callsite — não precisa
          // chamar setOpen(false) em cada item.
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  icon,
  onClick,
  variant = "default",
  disabled = false,
  children,
}: {
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
        variant === "danger"
          ? "text-danger hover:bg-danger-bg"
          : "text-fg-primary hover:bg-bg-tertiary",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {icon && (
        <span
          className={cn(
            "inline-flex h-4 w-4 shrink-0 items-center justify-center",
            variant === "danger" ? "text-danger" : "text-fg-secondary",
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export function DropdownMenuSeparator() {
  return (
    <div role="separator" className="my-1 h-px bg-border-primary" />
  );
}
