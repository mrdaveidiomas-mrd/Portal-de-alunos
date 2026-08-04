"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import type { ReorderWordsData } from "@/lib/blocks/schemas";
import { submitExercise, type ExerciseResult } from "@/lib/exercises/actions";
import { notifyExerciseResult } from "@/lib/toast/notify-result";
import { cn } from "@/lib/utils/cn";

// Renderer de "reordenar palavras":
//  - tokens vêm na ordem correta (data.tokens).
//  - embaralhamos UMA VEZ por (blockId), com seed determinístico, para que
//    refreshs/voltas não bagunçem a posição que o aluno está montando.
//  - aluno clica numa palavra disponível para empurrar para a fila de
//    "frase montada"; clica de volta para devolver.
//  - envia `selectedIndices` = índices ORIGINAIS na ordem montada.
//
// Hash do blockId é o seed do shuffle — usa o mesmo `seededShuffle` no
// servidor seria desnecessário porque o gabarito é só "ordem identidade".

function hashStringToInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const rand = seededRandom(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

interface IndexedToken {
  originalIndex: number;
  text: string;
}

export function ReorderWordsExercise({
  blockId,
  data,
  onSolved,
  onPartCompleted,
  previewMode = false,
}: {
  blockId: string;
  data: ReorderWordsData;
  onSolved?: () => void;
  onPartCompleted?: (info: { stars: number | null; xpAwarded: number; lessonJustCompleted?: boolean }) => void;
  previewMode?: boolean;
}) {
  // Lista de tokens embaralhada UMA VEZ (memo por blockId).
  const shuffled = useMemo<IndexedToken[]>(() => {
    const seed = hashStringToInt(blockId);
    const indexed = data.tokens.map<IndexedToken>((text, i) => ({
      originalIndex: i,
      text,
    }));
    // Garante que pelo menos uma ordem diferente da identidade seja exibida.
    const s = seededShuffle(indexed, seed);
    const isIdentity = s.every((t, i) => t.originalIndex === i);
    if (isIdentity && s.length > 1) {
      const tmp = s[0] as IndexedToken;
      s[0] = s[s.length - 1] as IndexedToken;
      s[s.length - 1] = tmp;
    }
    return s;
  }, [blockId, data.tokens]);

  // Estado: quais índices ORIGINAIS já foram colocados na frase montada,
  // na ordem em que o aluno os clicou.
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [pending, setPending] = useState(false);

  const selectedSet = new Set(selected);
  const allUsed = selected.length === data.tokens.length;
  const solved = result?.state === "perfect";

  function pick(originalIndex: number) {
    if (solved || pending) return;
    if (selectedSet.has(originalIndex)) return;
    setSelected((prev) => [...prev, originalIndex]);
  }

  function unpick(originalIndex: number) {
    if (solved || pending) return;
    setSelected((prev) => prev.filter((i) => i !== originalIndex));
  }

  function clear() {
    if (pending) return;
    setSelected([]);
    setResult(null);
  }

  async function handleSubmit() {
    if (!allUsed || pending || solved) return;
    setPending(true);
    const res = await submitExercise({
      blockId,
      selectedIndices: selected,
      previewMode,
    });
    setPending(false);
    setResult(res);
    notifyExerciseResult(res, { answerLabel: "Ordem" });
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

      {/* Frase montada */}
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-md border border-dashed border-border-primary p-2">
        {selected.length === 0 ? (
          <span className="text-sm text-fg-tertiary">
            Clique nas palavras abaixo para montar a frase.
          </span>
        ) : (
          selected.map((origIdx, posIdx) => (
            <Chip
              key={`${posIdx}-${origIdx}`}
              text={data.tokens[origIdx] ?? ""}
              onClick={() => unpick(origIdx)}
              filled
              disabled={solved}
            />
          ))
        )}
      </div>

      {/* Banco de palavras */}
      <div className="flex flex-wrap gap-2">
        {shuffled.map((tok) => {
          const used = selectedSet.has(tok.originalIndex);
          return (
            <Chip
              key={tok.originalIndex}
              text={tok.text}
              onClick={() => pick(tok.originalIndex)}
              disabled={used || solved}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {!solved && (
          <Button
            type="button"
            size="sm"
            loading={pending}
            disabled={!allUsed}
            onClick={handleSubmit}
          >
            {result?.state === "incorrect" ? "Tentar de novo" : "Responder"}
          </Button>
        )}
        {!solved && selected.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clear}
            disabled={pending}
          >
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}

function Chip({
  text,
  onClick,
  filled = false,
  disabled = false,
}: {
  text: string;
  onClick: () => void;
  filled?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md border px-3 py-1 text-sm transition-colors",
        filled
          ? "border-fg-primary bg-fg-primary text-fg-inverse"
          : "border-border-primary bg-bg-tertiary text-fg-primary hover:bg-bg-secondary",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {text}
    </button>
  );
}

