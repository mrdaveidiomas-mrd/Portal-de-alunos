import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const cardVariants = cva(
  // Default: superfície de CARTÃO (degrau acima da página) + sombra de
  // pouso. Em dark, o token `shadow-card` é um filete inset de luz
  // (sem sombra escura visível) — ver tokens.css §5.
  // Border transparente preserva o slot de borda para variants que
  // queiram pintar (accent, ring de destaque etc.).
  "rounded-lg border border-transparent bg-surface-card text-fg-primary shadow-card transition-all duration-200",
  {
    variants: {
      padded: {
        true: "p-6",
        false: "p-4",
      },
      interactive: {
        // Hover: levanta 1px e sobe a elevação (shadow-card -> shadow-elevated).
        // No light isso aumenta a sombra; no dark o filete inset fica um
        // pouco mais brilhante. Active: volta + leve scale.
        true: "cursor-pointer hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0 active:scale-[0.99]",
        false: "",
      },
      surface: {
        card: "",
        // Card-herói (ação primária). Mais claro/elevado que o default.
        elevated: "bg-surface-elevated shadow-elevated",
      },
      accent: {
        // Acento de cor para chamar atenção (ex.: SRS com itens prontos).
        true: "border-fg-primary/40 ring-2 ring-fg-primary/10",
        false: "",
      },
    },
    defaultVariants: {
      padded: false,
      interactive: false,
      surface: "card",
      accent: false,
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { className, padded, interactive, surface, accent, children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ padded, interactive, surface, accent }),
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
