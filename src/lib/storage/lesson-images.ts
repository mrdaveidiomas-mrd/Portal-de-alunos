import { createClient } from "@/lib/supabase/browser";

// Upload para o bucket `lesson-images`, compartilhado pelo bloco de imagem e
// pela imagem das perguntas. Vai DIRETO do browser para o Storage: Server
// Actions têm limite de corpo (~4,5 MB na Vercel). Autorização e limites reais
// moram na RLS e no bucket; a validação aqui só dá um erro amigável antes.

const MAX_BYTES = 5 * 1024 * 1024; // espelha o file_size_limit do bucket

// Também serve de whitelist: a extensão vem daqui, nunca do nome do arquivo.
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const LESSON_IMAGE_ACCEPT = Object.keys(EXT_BY_TYPE).join(",");

export type LessonImageUpload =
  | { ok: true; url: string }
  | { ok: false; title: string; description: string };

export async function uploadLessonImage(
  courseId: string,
  file: File,
): Promise<LessonImageUpload> {
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return {
      ok: false,
      title: "Formato não suportado",
      description: "Use PNG, JPG, WEBP ou GIF.",
    };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      title: "Imagem muito grande",
      description: "O limite é 5 MB.",
    };
  }

  const supabase = createClient();
  // Path agrupado por curso + nome único: trocar a imagem de um bloco nunca
  // sobrescreve a de outro, e não precisa de cache-busting.
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
    return {
      ok: false,
      title: "Não consegui enviar a imagem",
      description: error.message,
    };
  }

  const { data } = supabase.storage.from("lesson-images").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
