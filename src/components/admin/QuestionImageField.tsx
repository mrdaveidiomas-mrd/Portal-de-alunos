"use client";

import { useRef, useState } from "react";

import { TrashIcon } from "@/components/icons/TrashIcon";
import { Button } from "@/components/ui/Button";
import {
  LESSON_IMAGE_ACCEPT,
  uploadLessonImage,
} from "@/lib/storage/lesson-images";
import { toast } from "@/lib/toast/store";

const inputCls =
  "h-10 w-full rounded-md border border-border-primary bg-bg-primary px-3 text-sm text-fg-primary";

// Imagem OPCIONAL de uma pergunta (ou de um texto base). Mesmo fluxo do
// ImageUploadField, em versão compacta. A URL vem do upload, então vai num
// hidden input CONTROLADO + flush imediato: o `onChange` do <form> não a vê.
export function QuestionImageField({
  courseId,
  initialUrl = "",
  initialAlt = "",
  onFlush,
}: {
  courseId: string;
  initialUrl?: string;
  initialAlt?: string;
  onFlush?: () => void;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [pending, setPending] = useState(false);

  function applyUrl(next: string) {
    setUrl(next);
    // Write imperativo: o flush lê o FormData antes do re-render.
    if (hiddenRef.current) hiddenRef.current.value = next;
    onFlush?.();
  }

  async function handleFile(file: File | undefined) {
    if (!file || pending) return;
    setPending(true);
    try {
      const res = await uploadLessonImage(courseId, file);
      if (res.ok) {
        applyUrl(res.url);
        toast.success({ title: "Imagem enviada" });
      } else {
        toast.danger({ title: res.title, description: res.description });
      }
    } finally {
      setPending(false);
    }
  }

  function removeImage() {
    if (fileRef.current) fileRef.current.value = "";
    applyUrl("");
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={hiddenRef}
        type="hidden"
        name="image_url"
        value={url}
        readOnly
      />
      <input
        ref={fileRef}
        type="file"
        accept={LESSON_IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="max-h-48 w-auto max-w-full rounded-md border border-border-primary object-contain"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={pending}
          onClick={() => fileRef.current?.click()}
        >
          {url ? "Trocar imagem" : "Adicionar imagem"}
        </Button>
        {url ? (
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
        ) : (
          <span className="text-xs text-fg-tertiary">Opcional, até 5 MB.</span>
        )}
      </div>

      {/* Fica no DOM mesmo sem imagem: o autosave relê o form inteiro. */}
      <input
        name="image_alt"
        defaultValue={initialAlt}
        hidden={!url}
        placeholder="Descreva a imagem para quem não pode vê-la"
        className={inputCls}
      />
    </div>
  );
}
