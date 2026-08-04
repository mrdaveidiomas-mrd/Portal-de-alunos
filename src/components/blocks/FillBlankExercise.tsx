"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitExercise, type ExerciseResult } from "@/lib/exercises/actions";
import type { FillBlankData } from "@/lib/blocks/schemas";
import { notifyExerciseResult } from "@/lib/toast/notify-result";

export function FillBlankExercise({
  blockId,
  data,
  onSolved,
  onPartCompleted,
  previewMode = false,
}: {
  blockId: string;
  data: FillBlankData;
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
    notifyExerciseResult(res);
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
      <p className="font-medium text-fg-primary">{data.prompt}</p>

      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={solved}
        placeholder="Sua resposta"
        aria-label="Sua resposta"
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
