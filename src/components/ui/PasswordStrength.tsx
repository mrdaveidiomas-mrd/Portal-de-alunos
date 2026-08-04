"use client";

import { cn } from "@/lib/utils/cn";

// Pontuação 0–4 baseada em comprimento + variedade de caracteres.
function scorePassword(value: string): number {
  if (value.length === 0) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
}

const LABELS = ["", "Fraca", "Razoável", "Boa", "Forte"];
const COLORS = ["", "bg-danger", "bg-warning", "bg-warning", "bg-success"];

export function PasswordStrength({ value }: { value: string }) {
  if (value.length === 0) return null;
  const score = scorePassword(value);
  const colorClass = COLORS[score] ?? "";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full bg-bg-tertiary transition-colors",
              i < score && colorClass,
            )}
          />
        ))}
      </div>
      <span className="text-xs text-fg-tertiary">{LABELS[score]}</span>
    </div>
  );
}
