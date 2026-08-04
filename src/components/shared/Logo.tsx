import { cn } from "@/lib/utils/cn";

// Logo oficial da escola — referencia /public/logo.png (drop do PNG
// oficial fornecido pela escola).
//
// Por que <img> e não <Image/>:
//   1. Está no /public, então o caminho é estável (sem optimizer).
//   2. Para tamanhos pequenos/médios típicos (32-160px) a otimização
//      do Next agrega pouco e exige width/height fixos.
export function Logo({
  className,
  alt = "Mr. Dave Idiomas",
  priority,
}: {
  className?: string;
  alt?: string;
  // No <img> nativo o Next 16 mapeia `priority` para fetchpriority.
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt={alt}
      fetchPriority={priority ? "high" : undefined}
      className={cn("select-none object-contain", className)}
      draggable={false}
    />
  );
}
