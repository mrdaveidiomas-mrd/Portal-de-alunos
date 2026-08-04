import { cn } from "@/lib/utils/cn";

// Barra de progresso fina e neutra. Cor sólida (foreground primary) com
// fundo terciário, transição suave para parecer "preenchendo" quando
// recarrega após a parte ser concluída.
export function ProgressBar({
  value,
  max,
  className,
  ariaLabel,
}: {
  value: number;
  max: number;
  className?: string;
  ariaLabel?: string;
}) {
  const safeMax = Math.max(1, max);
  const safeValue = Math.max(0, Math.min(value, safeMax));
  const pct = (safeValue / safeMax) * 100;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={safeValue}
      aria-label={ariaLabel}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-primary-brand transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
