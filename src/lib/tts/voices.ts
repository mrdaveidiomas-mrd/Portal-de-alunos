// Catálogo de vozes Chirp 3 HD do Google Cloud TTS disponíveis no portal.
// IMPORTANTE: a Edge Function `tts` precisa ter o MESMO catálogo (duplicado lá,
// pois o runtime é Deno e não pode importar daqui). Manter ambos em sincronia.

export interface VoiceOption {
  id: string; // ex.: "en-US-Chirp3-HD-Aoede"
  language: "en" | "es";
  languageCode: string; // ex.: "en-US", "en-GB", "en-IN"
  accent: string;
  gender: "female" | "male";
  label: string;
  example: string; // frase tocada no botão de "ouvir"
}

const EXAMPLE_EN = "Hello. How are you doing today? I'm studying english at Mr. Dave.";
const EXAMPLE_ES = "Hola, como estás hoy? Estoy estudiando español en el portal de Mr. Dave.";

// Chirp 3 HD usa nomes de corpos celestes; Aoede e Charon estão disponíveis
// em todos os locales que o portal usa.
const FEMALE = "Aoede";
const MALE = "Charon";

function v(
  languageCode: string,
  language: "en" | "es",
  accent: string,
  gender: "female" | "male",
  example: string,
): VoiceOption {
  const voice = gender === "female" ? FEMALE : MALE;
  return {
    id: `${languageCode}-Chirp3-HD-${voice}`,
    language,
    languageCode,
    accent,
    gender,
    label: `${language === "en" ? "Inglês" : "Espanhol"} — ${accent} · ${
      gender === "female" ? "Feminino" : "Masculino"
    }`,
    example,
  };
}

export const VOICES: VoiceOption[] = [
  // Inglês — 4 sotaques × 2 gêneros
  v("en-US", "en", "Americano (EUA)", "female", EXAMPLE_EN),
  v("en-US", "en", "Americano (EUA)", "male", EXAMPLE_EN),
  v("en-GB", "en", "Britânico (Reino Unido)", "female", EXAMPLE_EN),
  v("en-GB", "en", "Britânico (Reino Unido)", "male", EXAMPLE_EN),
  v("en-AU", "en", "Australiano", "female", EXAMPLE_EN),
  v("en-AU", "en", "Australiano", "male", EXAMPLE_EN),
  v("en-IN", "en", "Indiano", "female", EXAMPLE_EN),
  v("en-IN", "en", "Indiano", "male", EXAMPLE_EN),
  // Espanhol — 2 sotaques × 2 gêneros
  v("es-US", "es", "Latino-americano", "female", EXAMPLE_ES),
  v("es-US", "es", "Latino-americano", "male", EXAMPLE_ES),
  v("es-ES", "es", "Europeu (Espanha)", "female", EXAMPLE_ES),
  v("es-ES", "es", "Europeu (Espanha)", "male", EXAMPLE_ES),
];

export const VOICES_BY_LANG = {
  en: VOICES.filter((x) => x.language === "en"),
  es: VOICES.filter((x) => x.language === "es"),
};

export const DEFAULT_VOICE: Record<"en" | "es", string> = {
  en: `en-US-Chirp3-HD-${FEMALE}`,
  es: `es-US-Chirp3-HD-${FEMALE}`,
};

// Velocidade de fala (Google TTS clampa a 0.25–4.0, mas o range do app é
// pedagógico — A1 confortável entre 0.5x e 1.5x).
export const DEFAULT_RATE = 1.0;
export const MIN_RATE = 0.5;
export const MAX_RATE = 1.5;
export const RATE_STEP = 0.05;

const IDS = new Set(VOICES.map((x) => x.id));
export function isValidVoiceId(id: string): boolean {
  return IDS.has(id);
}

// Resolve o código BCP-47 (en-US, en-IN, es-ES, ...) a partir do id da voz.
// Usado pelo reconhecedor de voz (Web Speech API) para casar com o sotaque
// que o aluno escolheu nas configurações.
export function languageCodeForVoice(voiceId: string): string {
  const found = VOICES.find((v) => v.id === voiceId);
  return found?.languageCode ?? "en-US";
}
