import { StarIcon } from "@/components/icons/StarIcon";
import { cn } from "@/lib/utils/cn";

interface StarsProps {
  // Quantidade de estrelas preenchidas (0 a max).
  value: number;
  max?: number;
  className?: string;
}

// Exibe `value` de `max` estrelas (preenchidas x vazias). Puramente visual.
export function Stars({ value, max = 3, className }: StarsProps) {
  const filled = Math.max(0, Math.min(value, max));
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${filled} de ${max} estrelas`}
      role="img"
    >
      {Array.from({ length: max }).map((_, i) => (
        <StarIcon
          key={i}
          filled={i < filled}
          className={cn("h-4 w-4", i < filled ? "text-warning" : "text-fg-tertiary")}
        />
      ))}
    </span>
  );
}
