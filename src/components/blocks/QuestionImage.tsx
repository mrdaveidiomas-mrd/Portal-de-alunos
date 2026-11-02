// Imagem opcional que acompanha o enunciado de uma pergunta. Altura limitada
// para que a imagem não empurre as alternativas para fora da tela. Alt ausente
// vira "" (imagem decorativa), como no ImageBlock.
export function QuestionImage({ url, alt }: { url?: string; alt?: string }) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt ?? ""}
      className="h-auto max-h-80 w-auto max-w-full rounded-md border border-border-primary object-contain"
    />
  );
}
