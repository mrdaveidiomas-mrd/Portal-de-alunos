import { z } from "zod";

// Formatos do campo `data` (JSONB) de cada tipo de bloco. O DB guarda `type`
// (text) + `data` (jsonb); aqui validamos/pareamos por tipo. Conteúdo
// malformado é tratado como inválido pelo renderizador (não quebra a página).
//
// IMPORTANTE: nos exercícios, o gabarito (answerIndex/answer) vive aqui e é
// lido APENAS no servidor (correção). Ao renderizar, só os campos públicos
// vão para o cliente — ver toPublicExercise abaixo.

// --- Blocos de conteúdo ---
// Todos os blocos de conteúdo aceitam `title` opcional — o admin usa pra
// dar contexto ao bloco e o renderer mostra como <h4> no topo.
export const richTextData = z.object({
  title: z.string().optional(),
  text: z.string(),
});

export const vocabularyData = z.object({
  title: z.string().optional(),
  items: z
    .array(
      z.object({
        term: z.string(),
        translation: z.string(),
        example: z.string().optional(),
      }),
    )
    .min(1),
});

export const readingData = z.object({
  title: z.string().optional(),
  text: z.string(),
});

export const dialogueData = z.object({
  title: z.string().optional(),
  lines: z
    .array(z.object({ speaker: z.string(), text: z.string() }))
    .min(1),
});

// Prática de pronúncia: lista de frases, cada uma com seu próprio áudio.
export const pronunciationData = z.object({
  title: z.string().optional(),
  items: z.array(z.string()).min(1),
});

// Tabela: grade de texto simples. A PRIMEIRA linha é o cabeçalho (<th>);
// `rows` é o corpo. Montada no admin por um editor visual (escolhe
// linhas × colunas e preenche célula a célula), não por texto delimitado.
export const tableData = z.object({
  title: z.string().optional(),
  header: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())),
});

// Imagem: arquivo no bucket `lesson-images` do Storage (upload pelo admin).
// `caption` aparece abaixo da imagem; `width` limita a largura máxima.
//
// `alt` é OPCIONAL no schema de propósito: alt="" é HTML válido (marca a
// imagem como decorativa para leitores de tela). Exigir alt aqui fazia o
// bloco inteiro virar "inválido" e sumir para o aluno quando o admin só
// subia a imagem — punir o aluno por um metadado ausente é pior do que uma
// imagem sem descrição. O admin é incentivado a preencher no formulário.
export const imageData = z.object({
  title: z.string().optional(),
  url: z.string().min(1),
  alt: z.string().optional(),
  caption: z.string().optional(),
  width: z.enum(["small", "medium", "full"]).optional(),
});

// Exemplos: frases de exemplo (frequentemente atreladas a um vocabulário
// ou tópico gramatical), cada uma com tradução opcional e botão de áudio.
// Diferente de pronunciation, aqui o foco é entender o significado — a
// tradução aparece embaixo de cada frase quando preenchida.
export const examplesData = z.object({
  title: z.string().optional(),
  items: z
    .array(
      z.object({
        sentence: z.string(),
        translation: z.string().optional(),
      }),
    )
    .min(1),
});

// Prática de speaking: lista de frases que o aluno deve falar. Web Speech API
// no navegador transcreve, e o servidor compara com Levenshtein (3 estados).
// Não conta para conclusão da parte (modo híbrido).
export const speakingData = z.object({
  title: z.string().optional(),
  items: z.array(z.string()).min(1),
});

// --- Blocos de exercício (dados PÚBLICOS — sem gabarito) ---
// O gabarito vive em exercise_solutions (fora do alcance do aluno).
export const multipleChoiceData = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2),
});

export const fillBlankData = z.object({
  prompt: z.string(),
});

// Tradução: aluno traduz `source` para o idioma esperado. `instruction`
// indica a direção quando não está óbvia ("Traduza para o inglês:").
export const translationData = z.object({
  instruction: z.string().optional(),
  source: z.string(),
});

// Reordenar palavras: tokens já vêm na ordem CORRETA. O cliente embaralha
// (com seed determinístico do blockId, para não bagunçar a cada render) e
// o aluno envia o array de índices originais na ordem em que escolheu.
export const reorderWordsData = z.object({
  instruction: z.string().optional(),
  tokens: z.array(z.string().min(1)).min(2),
});

// Correção de erro: aluno reescreve `sentence` (frase com erro) corrigida.
// `instruction` opcional ("Corrija a frase abaixo:").
export const errorCorrectionData = z.object({
  instruction: z.string().optional(),
  sentence: z.string(),
});

// --- Gabaritos (lidos só no servidor, via service_role) ---
export const multipleChoiceSolution = z.object({
  answerIndex: z.number().int().nonnegative(),
});

export const fillBlankSolution = z.object({
  // Resposta canônica + variações aceitas. Typos toleráveis via Levenshtein
  // na correção (ADR 0006).
  answer: z.string().min(1),
  alternatives: z.array(z.string()).optional(),
});

// Translation e ErrorCorrection seguem o mesmo formato de fill_blank:
// resposta canônica + variações aceitas + tolerância Levenshtein.
export const translationSolution = fillBlankSolution;
export const errorCorrectionSolution = fillBlankSolution;

export type MultipleChoiceSolution = z.infer<typeof multipleChoiceSolution>;
export type FillBlankSolution = z.infer<typeof fillBlankSolution>;
export type TranslationSolution = z.infer<typeof translationSolution>;
export type ErrorCorrectionSolution = z.infer<typeof errorCorrectionSolution>;

// --- Draft retornado pela Edge Function import_lesson ---
// Cada bloco vem com `type` + `data` (uso o schema certo na validação de UI)
// e, para exercícios, `solution`. Mantemos como discriminated union para o
// preview/edição pelo admin.
const draftBlock = z.discriminatedUnion("type", [
  z.object({ type: z.literal("rich_text"), data: richTextData }),
  z.object({ type: z.literal("vocabulary"), data: vocabularyData }),
  z.object({ type: z.literal("reading_tts"), data: readingData }),
  z.object({ type: z.literal("dialogue_tts"), data: dialogueData }),
  z.object({ type: z.literal("pronunciation"), data: pronunciationData }),
  z.object({ type: z.literal("examples"), data: examplesData }),
  z.object({ type: z.literal("speaking"), data: speakingData }),
  z.object({
    type: z.literal("multiple_choice"),
    data: multipleChoiceData,
    solution: multipleChoiceSolution,
  }),
  z.object({
    type: z.literal("fill_blank"),
    data: fillBlankData,
    solution: fillBlankSolution,
  }),
  z.object({
    type: z.literal("translation"),
    data: translationData,
    solution: translationSolution,
  }),
  z.object({
    type: z.literal("reorder_words"),
    data: reorderWordsData,
  }),
  z.object({
    type: z.literal("error_correction"),
    data: errorCorrectionData,
    solution: errorCorrectionSolution,
  }),
]);

export const draftPart = z.object({
  title: z.string().min(1),
  kind: z.enum(["regular", "golden"]).default("regular"),
  blocks: z.array(draftBlock),
});

export const draftLesson = z.object({
  lesson_title: z.string().optional(),
  parts: z.array(draftPart).min(1),
});

export type DraftBlock = z.infer<typeof draftBlock>;
export type DraftPart = z.infer<typeof draftPart>;
export type DraftLesson = z.infer<typeof draftLesson>;

export type RichTextData = z.infer<typeof richTextData>;
export type VocabularyData = z.infer<typeof vocabularyData>;
export type ReadingData = z.infer<typeof readingData>;
export type DialogueData = z.infer<typeof dialogueData>;
export type PronunciationData = z.infer<typeof pronunciationData>;
export type ExamplesData = z.infer<typeof examplesData>;
export type TableData = z.infer<typeof tableData>;
export type ImageData = z.infer<typeof imageData>;
export type SpeakingData = z.infer<typeof speakingData>;
export type MultipleChoiceData = z.infer<typeof multipleChoiceData>;
export type FillBlankData = z.infer<typeof fillBlankData>;
export type TranslationData = z.infer<typeof translationData>;
export type ReorderWordsData = z.infer<typeof reorderWordsData>;
export type ErrorCorrectionData = z.infer<typeof errorCorrectionData>;

export const BLOCK_SCHEMAS = {
  rich_text: richTextData,
  vocabulary: vocabularyData,
  reading_tts: readingData,
  dialogue_tts: dialogueData,
  pronunciation: pronunciationData,
  examples: examplesData,
  table: tableData,
  image: imageData,
  speaking: speakingData,
  multiple_choice: multipleChoiceData,
  fill_blank: fillBlankData,
  translation: translationData,
  reorder_words: reorderWordsData,
  error_correction: errorCorrectionData,
} as const;

export type BlockType = keyof typeof BLOCK_SCHEMAS;

// Exercícios que CONTAM para conclusão da parte (recomputePartProgress).
// Speaking fica de fora por design (modo híbrido).
export const EXERCISE_TYPES: BlockType[] = [
  "multiple_choice",
  "fill_blank",
  "translation",
  "reorder_words",
  "error_correction",
];

export function isExerciseType(type: string): boolean {
  return (EXERCISE_TYPES as string[]).includes(type);
}
