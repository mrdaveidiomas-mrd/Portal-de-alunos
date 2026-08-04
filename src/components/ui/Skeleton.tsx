import { cn } from "@/lib/utils/cn";

// Skeleton de loading. Cinza-claro com leve "shimmer" via animação CSS.
// Usar como placeholder de blocos enquanto o servidor renderiza dados.
//
// Composição: ponha vários Skeleton com larguras/alturas distintas para
// imitar o layout final ("h-6 w-40", "h-4 w-full", etc.).
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-skeleton-shimmer rounded-md bg-bg-tertiary",
        className,
      )}
    />
  );
}
