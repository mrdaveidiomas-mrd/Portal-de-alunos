"use client";

import { useRef, useState } from "react";

import { TrashIcon } from "@/components/icons/TrashIcon";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/browser";
import { toast } from "@/lib/toast/store";

// Campo do bloco de PDF: upload para o bucket `lesson-pdfs`, preview e
// legenda. Mesmo modelo do ImageUploadField (ver lá para o "porquê" do
// upload direto browser → Storage e da autorização morar no banco/bucket).
//
// A URL e o nome original do arquivo vêm do upload (não são digitados),
// então vão em hidden inputs sincronizados por ref + flush imediato.

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary";

const MAX_BYTES = 20 * 1024 * 1024; // espelha o file_size_limit do bucket

interface Props {
  courseId: string;
  initialUrl?: string;
  initialFilename?: string;
  initialCaption?: string;
  onUpdate?: () => void;
  onFlush?: () => void;
}

export function PdfUploadField({
  courseId,
  initialUrl = "",
  initialFilename = "",
  initialCaption = "",
  onUpdate,
  onFlush,
}: Props) {
  const urlRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [filename, setFilename] = useState(initialFilename);
  const [pending, setPending] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || pending) return;

    if (file.type !== "application/pdf") {
      toast.danger({
        title: "Formato não suportado",
        description: "Envie um arquivo PDF.",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.danger({
        title: "Arquivo muito grande",
        description: "O limite é 20 MB.",
      });
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      // Path agrupado por curso + nome único: trocar o PDF de um bloco
      // nunca sobrescreve o de outro, e não precisa de cache-busting.
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const path = `${courseId}/${unique}.pdf`;

      const { error } = await supabase.storage
        .from("lesson-pdfs")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf",
        });
      if (error) {
        toast.danger({
          title: "Não consegui enviar o PDF",
          description: error.message,
        });
        return;
      }

      const { data } = supabase.storage.from("lesson-pdfs").getPublicUrl(path);
      setUrl(data.publicUrl);
      setFilename(file.name);
      if (urlRef.current) urlRef.current.value = data.publicUrl;
      if (nameRef.current) nameRef.current.value = file.name;
      toast.success({ title: "PDF enviado" });
      // Salva na hora — url/filename não passam pelo onChange do form.
      onFlush?.();
    } finally {
      setPending(false);
    }
  }

  function removePdf() {
    setUrl("");
    setFilename("");
    if (urlRef.current) urlRef.current.value = "";
    if (nameRef.current) nameRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
    onFlush?.();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* url/filename — preenchidos pelo upload, nunca digitados. CONTROLADOS
          pelo state (não `defaultValue`): <input type="hidden"> não tem
          "dirty value flag", então um defaultValue gerenciado pelo React
          sobrescreveria o valor escrito imperativamente no upload. */}
      <input ref={urlRef} type="hidden" name="url" value={url} readOnly />
      <input
        ref={nameRef}
        type="hidden"
        name="filename"
        value={filename}
        readOnly
      />

      {/* Input de arquivo escondido; o botão abaixo o aciona. */}
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {url ? (
        <div className="flex flex-col gap-2">
          <iframe
            src={url}
            title={filename || "PDF"}
            className="h-80 w-full rounded-md border border-border-primary bg-bg-secondary"
          />
          <div className="flex flex-wrap items-center gap-2">
            {filename && (
              <span
                className="mr-auto truncate text-sm text-fg-secondary"
                title={filename}
              >
                {filename}
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={pending}
              onClick={() => fileRef.current?.click()}
            >
              Trocar PDF
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-danger"
              onClick={removePdf}
              disabled={pending}
            >
              <TrashIcon className="h-4 w-4" /> Remover
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-border-primary p-4">
          <Button
            type="button"
            size="sm"
            loading={pending}
            onClick={() => fileRef.current?.click()}
          >
            Enviar PDF
          </Button>
          <p className="text-xs text-fg-tertiary">Até 20 MB.</p>
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs text-fg-secondary">Legenda</span>
        <input
          name="caption"
          defaultValue={initialCaption}
          placeholder="Aparece abaixo do PDF"
          className={inputCls}
          onChange={() => onUpdate?.()}
        />
      </label>
    </div>
  );
}
