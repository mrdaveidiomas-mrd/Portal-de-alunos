"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  isValidVoiceId,
  MAX_RATE,
  MIN_RATE,
} from "@/lib/tts/voices";
import { createClient } from "@/lib/supabase/server";

export interface SavePreferencesResult {
  ok: boolean;
  error: string | null;
}

const schema = z.object({
  voiceEn: z.string().refine(isValidVoiceId, "Voz de inglês inválida."),
  voiceEs: z.string().refine(isValidVoiceId, "Voz de espanhol inválida."),
  rate: z.number().min(MIN_RATE).max(MAX_RATE),
});

// Salva as preferências de TTS do aluno. Recebe valores tipados (ao invés
// de FormData) porque o consumidor agora chama diretamente em handlers
// de onChange / debounce — não via <form action>.
export async function savePreferences(input: {
  voiceEn: string;
  voiceEs: string;
  rate: number;
}): Promise<SavePreferencesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Entrada inválida.",
    };
  }

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      tts_voice_en: parsed.data.voiceEn,
      tts_voice_es: parsed.data.voiceEs,
      tts_rate: parsed.data.rate,
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/painel/configuracoes");
  // Invalida páginas que usam TTS com base nas prefs.
  revalidatePath("/partes", "layout");
  return { ok: true, error: null };
}
