"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface AvatarUploadResult {
  ok: boolean;
  url: string | null;
  error: string | null;
}

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

// Faz upload da foto de perfil para o bucket `avatars` (path:
// avatars/<user_id>/<filename>) e atualiza profiles.avatar_url com a URL
// pública. Cache-busting via timestamp no nome do arquivo.
export async function uploadAvatar(
  formData: FormData,
): Promise<AvatarUploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, url: null, error: "Selecione uma imagem." };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      url: null,
      error: "Imagem muito grande. O limite é 3 MB.",
    };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      url: null,
      error: "Formato não suportado. Use PNG, JPG, WEBP ou GIF.",
    };
  }

  // Extensão a partir do mime para evitar usar nome do upload original.
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  // Cache-busting via timestamp. Como `upsert: true` substitui sempre o
  // mesmo arquivo "avatar.<ext>", o timestamp na URL final força o browser
  // a buscar a versão nova.
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
  if (uploadErr) {
    return {
      ok: false,
      url: null,
      error: `Falha no upload: ${uploadErr.message}`,
    };
  }

  const { data: publicData } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);
  const url = `${publicData.publicUrl}?v=${Date.now()}`;

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (updateErr) {
    return {
      ok: false,
      url: null,
      error: `Falha ao salvar perfil: ${updateErr.message}`,
    };
  }

  revalidatePath("/painel");
  revalidatePath("/painel/configuracoes");
  return { ok: true, url, error: null };
}

// Remove a foto, voltando para as iniciais. Apaga o arquivo do Storage
// (best-effort — se falhar, ainda zera o avatar_url no profile).
export async function removeAvatar(): Promise<AvatarUploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Tenta apagar qualquer arquivo no diretório do usuário.
  const { data: list } = await supabase.storage
    .from("avatars")
    .list(user.id);
  if (list && list.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(list.map((f) => `${user.id}/${f.name}`));
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (updateErr) {
    return { ok: false, url: null, error: updateErr.message };
  }

  revalidatePath("/painel");
  revalidatePath("/painel/configuracoes");
  return { ok: true, url: null, error: null };
}
