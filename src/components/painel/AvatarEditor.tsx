"use client";

import { useRef, useState, useTransition } from "react";

import { Avatar, type AvatarSize } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { removeAvatar, uploadAvatar } from "@/lib/profile/actions";
import { toast } from "@/lib/toast/store";

// Avatar clicável que abre um modal de edição (upload/remover foto).
// Substitui o card "Foto de perfil" das configurações — a ação fica
// onde a foto está, no painel principal.
//
// O wrapper externo é um <button> que dispara o dialog; um pequeno
// emblema com lápis no canto sinaliza editabilidade.
export function AvatarEditor({
  initialSrc,
  fullName,
  email,
  size = "lg",
}: {
  initialSrc: string | null;
  fullName: string | null;
  email: string;
  size?: AvatarSize;
}) {
  const [src, setSrc] = useState<string | null>(initialSrc);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function pickFile() {
    fileRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview imediato (objectURL) enquanto o upload está em andamento.
    const previewUrl = URL.createObjectURL(file);
    setSrc(previewUrl);
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await uploadAvatar(fd);
      if (res.ok) {
        setSrc(res.url);
        toast.success({
          title: "Foto atualizada",
          description: "Sua nova imagem de perfil já está visível.",
        });
        setOpen(false);
      } else {
        // Reverte para o estado anterior.
        setSrc(initialSrc);
        toast.danger({
          title: "Não consegui salvar a foto",
          description: res.error ?? "Tente novamente.",
        });
      }
      URL.revokeObjectURL(previewUrl);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function handleRemove() {
    if (pending) return;
    startTransition(async () => {
      const res = await removeAvatar();
      if (res.ok) {
        setSrc(null);
        toast.success({ title: "Foto removida" });
        setOpen(false);
      } else {
        toast.danger({
          title: "Não consegui remover a foto",
          description: res.error ?? undefined,
        });
      }
    });
  }

  return (
    <>
      {/* Wrapper clicável — sem emblema visível; o cursor-pointer +
          hover scale é o que sinaliza editabilidade. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar foto de perfil"
        title="Editar foto de perfil"
        className="inline-flex shrink-0 cursor-pointer rounded-full outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-fg-primary"
      >
        <Avatar src={src} fullName={fullName} email={email} size={size} />
      </button>

      <Dialog
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        title="Foto de perfil"
        description="Envie uma foto de perfil ou remova a atual."
      >
        <div className="flex flex-col items-center gap-4">
          <Avatar src={src} fullName={fullName} email={email} size="xl" />
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={pickFile}
              loading={pending}
              disabled={pending}
            >
              {src ? "Trocar foto" : "Enviar foto"}
            </Button>
            {src && (
              <Button
                type="button"
                variant="danger"
                onClick={handleRemove}
                disabled={pending}
              >
                Remover
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleChange}
          className="hidden"
        />
      </Dialog>
    </>
  );
}
