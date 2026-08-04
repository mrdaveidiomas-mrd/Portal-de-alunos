"use client";

import { useId, useState } from "react";

import { EyeIcon } from "@/components/icons/EyeIcon";
import { EyeOffIcon } from "@/components/icons/EyeOffIcon";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { cn } from "@/lib/utils/cn";

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  helperText?: string;
  error?: boolean;
  showStrength?: boolean;
}

// Campo de senha com botão "mostrar/ocultar" e medidor visual opcional.
// Não-controlado: o valor segue saindo via FormData no submit; o componente
// só mantém o estado local para alimentar o medidor e alternar a visibilidade.
export function PasswordInput({
  className,
  label,
  helperText,
  error = false,
  showStrength = false,
  id,
  onChange,
  defaultValue,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState<string>(
    typeof defaultValue === "string" ? defaultValue : "",
  );
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-fg-secondary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={error || undefined}
          aria-describedby={helperId}
          defaultValue={defaultValue}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e);
          }}
          className={cn(
            "h-10 w-full rounded-md border bg-bg-primary px-3 pr-10 text-sm text-fg-primary transition-colors",
            "placeholder:text-fg-tertiary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-tertiary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-danger focus-visible:ring-danger"
              : "border-border-primary",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-fg-tertiary transition-colors hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-tertiary"
        >
          {visible ? (
            <EyeOffIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      {showStrength && <PasswordStrength value={value} />}
      {helperText && (
        <p
          id={helperId}
          className={cn(
            "text-xs",
            error ? "text-danger" : "text-fg-tertiary",
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
