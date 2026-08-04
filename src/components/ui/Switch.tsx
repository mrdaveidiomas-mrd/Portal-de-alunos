"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils/cn";

// Toggle (switch) acessível. Mantém um <input type="checkbox"> escondido
// para preservar a semântica de FormData (form action pega "on" quando
// marcado, undefined quando não — mesmo contrato do checkbox nativo).
// Visual: trilha + thumb com transição, cores via tokens.
export function Switch({
  name,
  defaultChecked = false,
  disabled = false,
  label,
  description,
  id: idProp,
}: {
  name: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  label: string;
  description?: string;
  id?: string;
}) {
  const reactId = useId();
  const id = idProp ?? reactId;
  // Estado controlado só para refletir o visual; o input ainda usa
  // defaultChecked pra integrar com FormData sem precisar de Server-side
  // state. Mantemos sincronizado no onChange.
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 select-none",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          checked
            ? "border-primary-brand bg-primary-brand"
            : "border-border-primary bg-bg-tertiary",
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-bg-primary shadow-sm transition-transform",
            checked ? "translate-x-[1.125rem]" : "translate-x-[0.1875rem]",
          )}
        />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-fg-primary">{label}</span>
        {description && (
          <span className="text-xs text-fg-tertiary">{description}</span>
        )}
      </span>
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(e) => setChecked(e.currentTarget.checked)}
        // sr-only mantém o input no DOM e focável por teclado, mas
        // invisível — o label inteiro é o hit-area.
        className="sr-only"
      />
    </label>
  );
}
