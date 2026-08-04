import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  // Micro-interação: cor + leve press (scale 0.98) on :active. transition-all
  // cobre cor, sombra e transform; duration curta para sensação responsiva.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium rounded-md transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
  {
    variants: {
      variant: {
        // Primary: cor da marca (azul) — destaque previsível em qualquer
        // tela. Hover usa a variante "-hover" da paleta (tom acima),
        // active usa "-active" (tom abaixo) ao invés de opacidade.
        primary:
          "bg-primary-brand text-white hover:bg-primary-brand-hover active:bg-primary-brand-active",
        secondary:
          "bg-bg-tertiary text-fg-primary border border-border-primary hover:bg-bg-secondary",
        ghost: "bg-transparent text-fg-primary hover:bg-bg-secondary",
        danger:
          "bg-danger text-white hover:bg-danger-hover",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Spinner = () => (
  <svg
    className="h-4 w-4 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading = false, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
