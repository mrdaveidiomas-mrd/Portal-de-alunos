"use client";

import type { ExerciseResult } from "@/lib/exercises/actions";
import { toast } from "@/lib/toast/store";

// Helper para padronizar os toasts de resultado de exercício.
// Cada renderer chama isso com o resultado da Server Action.
//
// Estados:
//  - perfect   -> toast success ("Perfeito!" + XP)
//  - close     -> toast warning ("Quase lá" + XP + dica)
//  - incorrect -> toast danger  ("Não foi dessa vez" + resposta certa)
//  - !ok       -> toast danger  (erro técnico/validação)
export function notifyExerciseResult(
  result: ExerciseResult,
  opts?: {
    // Texto opcional para customizar como a resposta certa é apresentada
    // (ex.: "Tradução" em translation, "Versão correta" em error_correction).
    answerLabel?: string;
  },
): void {
  if (!result.ok) {
    if (result.error) {
      toast.danger({ title: result.error });
    }
    return;
  }
  const xp =
    result.xpAwarded > 0 ? ` (+${result.xpAwarded} XP)` : "";
  const label = opts?.answerLabel ?? "Resposta";
  switch (result.state) {
    case "perfect":
      toast.success({ title: `Perfeito!${xp}` });
      return;
    case "close":
      toast.warning({
        title: `Quase lá${xp}`,
        description: "Typo dentro da tolerância. Releia com calma.",
      });
      return;
    case "incorrect":
      toast.danger({
        title: "Não foi dessa vez",
        description: result.correctAnswer
          ? `${label} certa: ${result.correctAnswer}`
          : undefined,
      });
      return;
  }
}
