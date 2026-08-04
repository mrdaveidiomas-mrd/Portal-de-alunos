"use client";

import { dismiss, useToasts, type ToastItem } from "@/lib/toast/store";
import { cn } from "@/lib/utils/cn";

// Viewport global de toasts. Renderizado UMA vez no root layout.
// Posicionamento: top-center em telas grandes, top-stretch no mobile.
export function ToastViewport() {
  const items = useToasts();
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:top-6"
    >
      {items.map((t) => (
        <Toast key={t.id} item={t} />
      ))}
    </div>
  );
}

const KIND_CLS: Record<ToastItem["kind"], string> = {
  success: "border-success/40 bg-success-bg text-fg-primary",
  warning: "border-warning/40 bg-warning-bg text-fg-primary",
  danger: "border-danger/40 bg-danger-bg text-fg-primary",
  info: "border-border-secondary bg-bg-secondary text-fg-primary",
};

const ICON_CLS: Record<ToastItem["kind"], string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-fg-secondary",
};

function Toast({ item }: { item: ToastItem }) {
  return (
    <button
      type="button"
      onClick={() => dismiss(item.id)}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-left shadow-[var(--shadow-2)] transition-shadow",
        "hover:shadow-[var(--shadow-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-tertiary",
        KIND_CLS[item.kind],
        item.leaving ? "animate-toast-out" : "animate-toast-in",
      )}
      aria-label={`${item.title} — clique para fechar`}
    >
      <KindIcon kind={item.kind} className={cn("mt-0.5 h-5 w-5 shrink-0", ICON_CLS[item.kind])} />
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium leading-tight">{item.title}</span>
        {item.description && (
          <span className="text-xs text-fg-secondary leading-snug">
            {item.description}
          </span>
        )}
      </div>
    </button>
  );
}

function KindIcon({
  kind,
  className,
}: {
  kind: ToastItem["kind"];
  className?: string;
}) {
  // Mesma família de ícones outline-stroke usada no resto do app.
  switch (kind) {
    case "success":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "warning":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "danger":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      );
    default:
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      );
  }
}
