"use client";

import { useRef, useState } from "react";

import { TrashIcon } from "@/components/icons/TrashIcon";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/browser";
import { toast } from "@/lib/toast/store";

// Campo do bloco de imagem: upload para o bucket `lesson-images`, preview,
// alt (obrigatório), legenda (opcional) e largura máxima.
//
// O upload vai DIRETO do browser para o Storage — não passa por Server
// Action. Motivo: Server Actions têm limite de corpo (1 MB por padrão no
// Next, e teto de ~4,5 MB na Vercel que não dá para elevar), o que
// derrubava imagens comuns de material didático. Indo direto, o arquivo
// nunca trafega pelo servidor Next.
//
// Autorização continua no banco (ADR 0002): a policy
// `lesson_images_admin_insert` exige private.is_admin(), e o bucket impõe
// tamanho (5 MB) e mime permitidos. O cliente anon não consegue burlar.
//
// alt/caption/width são inputs COM `name` — o `onChange` do <form> do
// BlockForm já dispara o autosave neles. A URL vem do upload (não é
// digitada), então vai num hidden input sincronizado por ref + flush
// imediato: upload é ação deliberada e o admin costuma sair logo depois.

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary";

const MAX_BYTES = 5 * 1024 * 1024; // espelha o file_size_limit do bucket

// Também serve de whitelist: mime fora deste mapa é rejeitado antes de
// subir. A extensão vem daqui — nunca do nome do arquivo enviado.
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const WIDTH_OPTIONS: { value: string; label: string }[] = [
  { value: "full", label: "Grande" },
  { value: "medium", label: "Média" },
  { value: "small", label: "Pequena" },
];

interface Props {
  courseId: string;
  initialUrl?: string;
  initialAlt?: string;
  initialCaption?: string;
  initialWidth?: string;
  onUpdate?: () => void;
  onFlush?: () => void;
}

export function ImageUploadField({
  courseId,
  initialUrl = "",
  initialAlt = "",
  initialCaption = "",
  initialWidth = "full",
  onUpdate,
  onFlush,
}: Props) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [pending, setPending] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || pending) return;

    const ext = EXT_BY_TYPE[file.type];
    if (!ext) {
      toast.danger({
        title: "Formato não suportado",
        description: "Use PNG, JPG, WEBP ou GIF.",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.danger({
        title: "Imagem muito grande",
        description: "O limite é 5 MB.",
      });
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      // Path agrupado por curso + nome único: trocar a imagem de um bloco
      // nunca sobrescreve a de outro, e não precisa de cache-busting.
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const path = `${courseId}/${unique}.${ext}`;

      const { error } = await supabase.storage
        .from("lesson-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (error) {
        toast.danger({
          title: "Não consegui enviar a imagem",
          description: error.message,
        });
        return;
      }

      const { data } = supabase.storage
        .from("lesson-images")
        .getPublicUrl(path);
      setUrl(data.publicUrl);
      if (hiddenRef.current) hiddenRef.current.value = data.publicUrl;
      toast.success({ title: "Imagem enviada" });
      // Salva na hora — a URL não passa pelo onChange do form.
      onFlush?.();
    } finally {
      setPending(false);
    }
  }

  function removeImage() {
    setUrl("");
    if (hiddenRef.current) hiddenRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
    onFlush?.();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* URL da imagem — preenchida pelo upload, nunca digitada.
          CONTROLADO pelo state (não `defaultValue`): <input type="hidden">
          não tem "dirty value flag", então um `defaultValue` gerenciado pelo
          React sobrescreveria o valor escrito imperativamente no upload. */}
      <input ref={hiddenRef} type="hidden" name="url" value={url} readOnly />

      {/* Input de arquivo fica escondido; o botão abaixo o aciona. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {url ? (
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="max-h-64 w-auto max-w-full rounded-md border border-border-primary object-contain"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={pending}
              onClick={() => fileRef.current?.click()}
            >
              Trocar imagem
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-danger"
              onClick={removeImage}
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
            Enviar imagem
          </Button>
          <p className="text-xs text-fg-tertiary">
            Até 5 MB.
          </p>
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs text-fg-secondary">
          Texto alternativo
        </span>
        <input
          name="alt"
          defaultValue={initialAlt}
          required
          placeholder="Descreva a imagem para quem não pode vê-la"
          className={inputCls}
          onChange={() => onUpdate?.()}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-fg-secondary">Legenda</span>
        <input
          name="caption"
          defaultValue={initialCaption}
          placeholder="Aparece abaixo da imagem"
          className={inputCls}
          onChange={() => onUpdate?.()}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-fg-secondary">Largura máxima</span>
        <select
          name="width"
          defaultValue={initialWidth}
          className={inputCls}
          onChange={() => onUpdate?.()}
        >
          {WIDTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
