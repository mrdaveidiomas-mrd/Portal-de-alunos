import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error = false, id, ...props }, ref) => {
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
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error || undefined}
          aria-describedby={helperId}
          className={cn(
            "h-10 w-full rounded-md border bg-bg-primary px-3 text-sm text-fg-primary transition-colors",
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
  },
);

Input.displayName = "Input";
