import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_RATE, DEFAULT_VOICE, isValidVoiceId } from "@/lib/tts/voices";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export interface UserPreferences {
  ttsVoiceEn: string;
  ttsVoiceEs: string;
  ttsRate: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  ttsVoiceEn: DEFAULT_VOICE.en,
  ttsVoiceEs: DEFAULT_VOICE.es,
  ttsRate: DEFAULT_RATE,
};

// Carrega as preferências do usuário, caindo nos defaults quando ausente ou
// inválido. Sempre retorna um objeto totalmente preenchido — facilita o uso
// downstream sem checagem de `null`.
export async function getUserPreferences(
  supabase: Client,
  userId: string,
): Promise<UserPreferences> {
  const { data } = await supabase
    .from("user_preferences")
    .select("tts_voice_en, tts_voice_es, tts_rate")
    .eq("user_id", userId)
    .maybeSingle();

  const voiceEn =
    data?.tts_voice_en && isValidVoiceId(data.tts_voice_en)
      ? data.tts_voice_en
      : DEFAULT_VOICE.en;
  const voiceEs =
    data?.tts_voice_es && isValidVoiceId(data.tts_voice_es)
      ? data.tts_voice_es
      : DEFAULT_VOICE.es;
  const rate =
    typeof data?.tts_rate === "number" || typeof data?.tts_rate === "string"
      ? Number(data.tts_rate)
      : DEFAULT_RATE;

  return { ttsVoiceEn: voiceEn, ttsVoiceEs: voiceEs, ttsRate: rate };
}

export function voiceForLang(
  prefs: UserPreferences,
  lang: "en" | "es",
): string {
  return lang === "es" ? prefs.ttsVoiceEs : prefs.ttsVoiceEn;
}
