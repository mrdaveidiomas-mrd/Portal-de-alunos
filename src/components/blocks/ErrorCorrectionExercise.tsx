"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ErrorCorrectionData } from "@/lib/blocks/schemas";
import { submitExercise, type ExerciseResult } from "@/lib/exercises/actions";
import { notifyExerciseResult } from "@/lib/toast/notify-result";

// Renderer de correção de erro. Mostra a frase errada (data.sentence) e pede
// a versão corrigida. Feedback por toast.
export function ErrorCorrectionExercise({
  blockId,
  data,
  onSolved,
  onPartCompleted,
  previewMode = false,
}: {
  blockId: string;
  data: ErrorCorrectionData;
  onSolved?: () => void;
  onPartCompleted?: (info: { stars: number | null; xpAwarded: number; lessonJustCompleted?: boolean }) => void;
  previewMode?: boolean;
}) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [pending, setPending] = useState(false);

  const solved = result?.state === "perfect" || result?.state === "close";

  async function handleSubmit() {
    if (text.trim().length === 0 || pending || solved) return;
    setPending(true);
    const res = await submitExercise({ blockId, text, previewMode });
    setPending(false);
    setResult(res);
    notifyExerciseResult(res, { answerLabel: "Versão correta" });
    if (res.ok) onSolved?.();
    if (res.ok && res.partJustCompleted) {
      onPartCompleted?.({
        stars: res.partStars ?? null,
        xpAwarded: res.xpAwarded,
        lessonJustCompleted: res.lessonJustCompleted ?? false,
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {data.instruction && (
        <p className="text-sm font-medium text-fg-secondary">
          {data.instruction}
        </p>
      )}
      <p className="rounded-md border border-dashed border-border-primary px-3 py-2 text-fg-primary">
        {data.sentence}
      </p>

      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={solved}
        placeholder="Reescreva a frase corrigida"
        aria-label="Frase corrigida"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      />

      {!solved && (
        <div>
          <Button
            type="button"
            size="sm"
            loading={pending}
            disabled={text.trim().length === 0}
            onClick={handleSubmit}
          >
            {result?.state === "incorrect" ? "Tentar de novo" : "Responder"}
          </Button>
        </div>
      )}
    </div>
  );
}
