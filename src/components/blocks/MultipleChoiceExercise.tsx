"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { submitExercise, type ExerciseResult } from "@/lib/exercises/actions";
import type { MultipleChoiceData } from "@/lib/blocks/schemas";
import { notifyExerciseResult } from "@/lib/toast/notify-result";
import { cn } from "@/lib/utils/cn";

export function MultipleChoiceExercise({
  blockId,
  data,
  onSolved,
  onPartCompleted,
  previewMode = false,
}: {
  blockId: string;
  data: MultipleChoiceData;
  onSolved?: () => void;
  onPartCompleted?: (info: { stars: number | null; xpAwarded: number; lessonJustCompleted?: boolean }) => void;
  previewMode?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [pending, setPending] = useState(false);

  const solved = result?.state === "perfect";

  async function handleSubmit() {
    if (selected === null || pending || solved) return;
    setPending(true);
    const res = await submitExercise({
      blockId,
      selectedIndex: selected,
      previewMode,
    });
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
      <p className="font-medium text-fg-primary">{data.question}</p>

      <div className="flex flex-col gap-2">
        {data.options.map((option, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              type="button"
              disabled={solved}
              onClick={() => setSelected(i)}
              className={cn(
                "rounded-md border px-3 py-2 text-left text-sm transition-all duration-150 active:scale-[0.99]",
                "disabled:cursor-not-allowed disabled:active:scale-100",
                isSelected
                  ? "border-fg-primary bg-bg-secondary text-fg-primary"
                  : "border-border-primary text-fg-secondary hover:bg-bg-secondary",
              )}
              aria-pressed={isSelected}
            >
              {option}
            </button>
          );
        })}
      </div>

      {!solved && (
        <div>
          <Button
            type="button"
            size="sm"
            loading={pending}
            disabled={selected === null}
            onClick={handleSubmit}
          >
            {result?.state === "incorrect" ? "Tentar de novo" : "Responder"}
          </Button>
        </div>
      )}
    </div>
  );
}
