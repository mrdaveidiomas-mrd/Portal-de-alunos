import type { ImageData } from "@/lib/blocks/schemas";
import { cn } from "@/lib/utils/cn";

// Larguras máximas — o admin escolhe por bloco. Default "full" (a imagem
// ocupa a largura do card, sem esticar além do tamanho natural).
const WIDTH_CLS: Record<NonNullable<ImageData["width"]>, string> = {
  small: "max-w-xs",
  medium: "max-w-md",
  full: "max-w-full",
};

// Imagem hospedada no bucket `lesson-images` do Storage. `alt` ausente vira
// "" — que é o marcador HTML de imagem decorativa, tratamento correto para
// leitor de tela quando o admin não descreveu a imagem.
// Usamos <img> nativo em vez de next/image porque o domínio do Supabase
// exigiria configurar remotePatterns, e aqui o ganho do optimizer é baixo.
export function ImageBlock({ data }: { data: ImageData }) {
  return (
    <figure className="flex flex-col gap-2">
      {data.title && (
        <h4 className="font-medium text-fg-primary">{data.title}</h4>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data.url}
        alt={data.alt ?? ""}
        className={cn(
          "h-auto w-full rounded-md border border-border-primary",
          WIDTH_CLS[data.width ?? "full"],
        )}
      />
      {data.caption && (
        <figcaption className="text-sm text-fg-secondary">
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}
