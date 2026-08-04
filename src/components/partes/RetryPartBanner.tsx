"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { retryPartExercises } from "@/lib/parts/actions";
import { toast } from "@/lib/toast/store";

// Banner exibido SOMENTE quando:
//   - a parte está concluída (completed)
//   - tem menos de 3 estrelas (0, 1 ou 2)
//
// Aperta o botão → zera tentativas + part_progress vai para in_progress.
// A página recarrega via revalidatePath e o aluno encontra os exercícios
// "limpos" novamente, como na primeira vez.
export function RetryPartBanner({
  partId,
  stars,
}: {
  partId: string;
  stars: number;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (pending) return;
    startTransition(async () => {
      const res = await retryPartExercises(partId);
      if (res.ok) {
        toast.success({
          title: "Exercícios reiniciados",
          description:
            "Refaça tudo acertando de primeira para subir as estrelas.",
        });
      } else if (res.error) {
        toast.danger({ title: res.error });
      }
    });
  }

  return (
    <Card
      padded
      className="flex flex-wrap items-center justify-between gap-3 border-warning/40"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-fg-primary">
          {stars === 0
            ? "Que tal tentar de novo?"
            : stars === 1
              ? "Quer melhorar essa estrela?"
              : "Quase 3 estrelas!"}
        </span>
        <span className="text-xs text-fg-secondary">
          Refaça os exercícios sem errar para chegar nas 3 estrelas.
        </span>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={handleClick}
      >
        Tentar de novo
      </Button>
    </Card>
  );
}
