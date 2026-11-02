import { z } from "zod";

import { QuestionImage } from "@/components/blocks/QuestionImage";

// Campos de enunciado de todos os tipos de exercício. Só dados públicos: o
// gabarito não chega aqui.
const solvedView = z
  .object({
    question: z.string(),
    prompt: z.string(),
    instruction: z.string(),
    source: z.string(),
    sentence: z.string(),
    tokens: z.array(z.string()),
    imageUrl: z.string(),
    imageAlt: z.string(),
  })
  .partial();

// Exercício que o aluno acertou em outra visita: mostra o enunciado para dar
// contexto, sem pedir resposta de novo.
export function SolvedExercise({ data }: { data: unknown }) {
  const view = solvedView.safeParse(data).data ?? {};
  const statement =
    view.question ?? view.prompt ?? view.source ?? view.sentence ?? view.tokens?.join(" ");

  return (
    <div className="flex flex-col gap-3">
      <QuestionImage url={view.imageUrl} alt={view.imageAlt} />
      {view.instruction && (
        <p className="text-sm font-medium text-fg-secondary">
          {view.instruction}
        </p>
      )}
      {statement && (
        <p className="font-medium text-fg-primary">{statement}</p>
      )}
      <p className="text-sm font-medium text-success">
        ✓ Você já acertou esta pergunta
      </p>
    </div>
  );
}
