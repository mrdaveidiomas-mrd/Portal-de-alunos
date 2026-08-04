import type {
  ErrorCorrectionSolution,
  FillBlankSolution,
  MultipleChoiceSolution,
  TranslationSolution,
} from "@/lib/blocks/schemas";
import { levenshtein } from "@/lib/grading/levenshtein";

// Três estados de feedback (ADR 0006):
//  - perfect: resposta correta -> XP cheio.
//  - close:   typo dentro da tolerância -> XP parcial.
//  - incorrect: erro -> XP zero + resposta correta exibida.
export type GradeState = "perfect" | "close" | "incorrect";

export const XP_BY_STATE: Record<GradeState, number> = {
  perfect: 10,
  close: 5,
  incorrect: 0,
};

// Normaliza para comparação tolerante: minúsculas, sem acento, espaços
// colapsados, sem pontuação no fim.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]+$/g, "");
}

export function gradeMultipleChoice(
  selectedIndex: number,
  solution: MultipleChoiceSolution,
): GradeState {
  return selectedIndex === solution.answerIndex ? "perfect" : "incorrect";
}

// Correção de speaking. O target é a frase canônica; o input é a transcrição
// (Web Speech API ou texto digitado no fallback).
// Tolerância MAIOR que fill_blank: STT erra pontuação, "to" vs "two",
// "their" vs "there" — frases inteiras toleram ~30% de edits.
// `viaText=true` aplica a mesma tolerância (a pessoa não testou pronúncia,
// só o reconhecimento textual, então não vale recompensar mais).
export function gradeSpeaking(
  transcript: string,
  target: string,
): GradeState {
  const guess = normalize(transcript);
  const goal = normalize(target);
  if (guess.length === 0) return "incorrect";
  if (guess === goal) return "perfect";
  const tolerance = Math.max(2, Math.floor(goal.length * 0.3));
  return levenshtein(guess, goal) <= tolerance ? "close" : "incorrect";
}

export function gradeFillBlank(
  text: string,
  solution: FillBlankSolution,
): GradeState {
  const candidates = [solution.answer, ...(solution.alternatives ?? [])].map(
    normalize,
  );
  const guess = normalize(text);

  if (candidates.includes(guess)) return "perfect";

  // Tolerância proporcional ao tamanho do alvo (mín. 1 edição).
  const closeEnough = candidates.some((candidate) => {
    const tolerance = Math.max(1, Math.floor(candidate.length * 0.2));
    return levenshtein(guess, candidate) <= tolerance;
  });

  return closeEnough ? "close" : "incorrect";
}

// Tradução e correção de erro usam a mesma lógica do fill_blank — resposta
// canônica + alternativas + tolerância. Frases tendem a ser mais longas, mas
// a regra proporcional (20% do tamanho) já se adapta.
export function gradeTranslation(
  text: string,
  solution: TranslationSolution,
): GradeState {
  return gradeFillBlank(text, solution);
}

export function gradeErrorCorrection(
  text: string,
  solution: ErrorCorrectionSolution,
): GradeState {
  return gradeFillBlank(text, solution);
}

// Reordenar palavras: aluno envia array de índices originais na ordem em que
// montou a frase. Ordem canônica = identidade [0,1,...,n-1] (admin escreve
// os tokens já na ordem certa; o cliente embaralha para exibir).
// Sem "close": ou montou certo, ou não.
export function gradeReorderWords(
  selectedIndices: number[],
  tokenCount: number,
): GradeState {
  if (selectedIndices.length !== tokenCount) return "incorrect";
  for (let i = 0; i < tokenCount; i++) {
    if (selectedIndices[i] !== i) return "incorrect";
  }
  return "perfect";
}
