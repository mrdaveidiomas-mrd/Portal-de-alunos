import Link from "next/link";

import { cn } from "@/lib/utils/cn";

// Link de "voltar" padronizado para topo de páginas internas. Chip arredondado
// pequeno, com hover que muda fundo e desloca a seta levemente para a esquerda
// — micro-interação que reforça a direção.
export function BackLink({
  href,
  label = "Voltar",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm text-fg-secondary transition-all duration-150 hover:bg-bg-secondary hover:text-fg-primary",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="transition-transform duration-150 group-hover:-translate-x-0.5"
      >
        ←
      </span>
      {label}
    </Link>
  );
}
