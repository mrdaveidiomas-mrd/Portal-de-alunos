// Payloads serializados no campo srs_items.payload. Tipados aqui para que
// a UI de revisão e os upserts compartilhem o mesmo formato.

export interface SrsExercisePayload {
  type: "exercise";
  kind: "multiple_choice" | "fill_blank";
  question: string;
  answer: string;
  partTitle?: string;
  courseTitle?: string;
}

export interface SrsVocabPayload {
  type: "vocab";
  term: string;
  translation: string;
  example?: string;
  partTitle?: string;
  courseTitle?: string;
}

// Speaking: a "pergunta" da revisão é o que o aluno deve FALAR. Como o
// erro original foi de pronúncia, a revisão também é por voz (Web Speech
// API) — a frase já vem escrita na tela, digitar não faria sentido.
// `lang` guarda o idioma do curso (en/es) para o reconhecedor de fala e o
// TTS "ouvir" — itens antigos sem lang caem em "en".
export interface SrsSpeakingPayload {
  type: "speaking";
  phrase: string;
  lang?: "en" | "es";
  partTitle?: string;
  courseTitle?: string;
}

export type SrsPayload =
  | SrsExercisePayload
  | SrsVocabPayload
  | SrsSpeakingPayload;
