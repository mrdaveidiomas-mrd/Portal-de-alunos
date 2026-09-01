import type { PdfData } from "@/lib/blocks/schemas";

// Bloco de PDF: arquivo hospedado no bucket `lesson-pdfs` do Storage.
// Mostra um preview inline (o visualizador nativo do navegador via <iframe>)
// e ações de abrir em nova aba e baixar.
//
// Download com nome amigável: o Storage do Supabase aceita `?download=<nome>`
// na URL pública, o que força Content-Disposition: attachment com esse nome.
// Sem isso, o browser abriria o PDF em vez de baixar, e o arquivo salvo
// herdaria o nome aleatório do path no bucket.
//
// Nunca usamos <img>/next/image aqui — é um documento, não imagem. O
// <iframe> é suficiente e não exige biblioteca extra (pdfjs) para o preview.
export function PdfBlock({ data }: { data: PdfData }) {
  const name = data.filename?.trim() || "documento.pdf";
  const downloadUrl = `${data.url}${data.url.includes("?") ? "&" : "?"}download=${encodeURIComponent(name)}`;

  return (
    <figure className="flex flex-col gap-3">
      {data.title && (
        <h4 className="font-medium text-fg-primary">{data.title}</h4>
      )}

      <div className="overflow-hidden rounded-md border border-border-primary bg-bg-secondary">
        {/* Preview inline. Alguns navegadores/mobile não renderizam PDF em
            iframe — as ações abaixo garantem acesso em qualquer caso. */}
        <iframe
          src={data.url}
          title={data.title ?? name}
          className="h-[70vh] max-h-[600px] w-full"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-primary px-3 py-2">
          <span className="truncate text-sm text-fg-secondary" title={name}>
            <FileIcon className="mr-1.5 inline h-4 w-4 align-text-bottom" />
            {name}
          </span>
          <span className="flex items-center gap-2">
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-fg-secondary transition-colors hover:bg-bg-tertiary hover:text-fg-primary"
            >
              <OpenIcon className="h-4 w-4" />
              Abrir
            </a>
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-brand px-2.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-brand-hover"
            >
              <DownloadIcon className="h-4 w-4" />
              Baixar
            </a>
          </span>
        </div>
      </div>

      {data.caption && (
        <figcaption className="text-sm text-fg-secondary">
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}

function iconProps(className?: string) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className,
  };
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

function OpenIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}
