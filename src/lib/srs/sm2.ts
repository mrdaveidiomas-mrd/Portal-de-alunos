// Algoritmo SM-2 (SuperMemo 2), o mesmo usado por Anki como base.
// Referência: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
//
// Entrada: estado atual do item + qualidade da resposta (0..5).
// Saída: novo estado (ease, intervalo, repetições, próxima revisão).
//
// Convenções da UI:
//   - "Errei"    -> qualidade 2 (esqueci, mas reconheço; reinicia o ciclo)
//   - "Quase"    -> qualidade 3 (lembrei com dificuldade; preserva ciclo)
//   - "Acertei"  -> qualidade 5 (lembrei sem esforço; intervalo grande)
//
// SM-2 clássico considera <3 como "errado" (reinicia repetitions/interval),
// e >=3 como "certo" (avança).

export interface Sm2State {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  nextReviewAt: Date;
}

export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

export function applySm2(
  state: Sm2State,
  quality: number,
  now: Date = new Date(),
): Sm2Result {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let { easeFactor, intervalDays, repetitions } = state;

  // Atualização do ease factor (SM-2 padrão). Floor em 1.30 para não travar.
  easeFactor = Math.max(
    MIN_EASE,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  if (q < 3) {
    // Errou: reinicia o ciclo, intervalo curto.
    repetitions = 0;
    intervalDays = 1;
  } else {
    // Acertou: avança a sequência.
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
  }

  const next = new Date(now);
  next.setDate(next.getDate() + intervalDays);

  return {
    easeFactor: Number(easeFactor.toFixed(2)),
    intervalDays,
    repetitions,
    nextReviewAt: next,
  };
}

// Mapeia o botão da UI ("again" / "hard" / "good") para qualidade SM-2.
export type ReviewRating = "again" | "hard" | "good";

export const RATING_QUALITY: Record<ReviewRating, number> = {
  again: 2,
  hard: 3,
  good: 5,
};
