"use client";

import Link from "next/link";
import { useMemo } from "react";

import { StarIcon } from "@/components/icons/StarIcon";
import { TrophyIcon } from "@/components/icons/TrophyIcon";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils/cn";

// Tela exibida UMA vez quando o aluno acaba de concluir uma parte. Mostra
// estrelas obtidas, XP da sessão e oferece voltar ao curso. Acompanha um
// efeito visual de confetti CSS (16 partículas com cores e delays randômicos).
//
// O dialog é controlado pelo pai: o PartStepper detecta `partJustCompleted`
// no resultado da Server Action e abre. O usuário pode fechar — não fica
// "preso" — e o estado server-side já está salvo.

interface ConfettiPiece {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
  size: string;
}

const CONFETTI_COLORS = [
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-info)",
  "var(--color-danger)",
];

function buildConfetti(seed: number): ConfettiPiece[] {
  // Random pseudoaleatório (LCG) com seed estável para a sessão; renderiza
  // sempre as mesmas posições no mesmo open (sem hydration mismatch).
  let s = seed || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  return Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    left: `${Math.round(rand() * 90 + 5)}%`,
    delay: `${(rand() * 250).toFixed(0)}ms`,
    duration: `${(900 + rand() * 600).toFixed(0)}ms`,
    color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)]!,
    size: `${(6 + Math.round(rand() * 6))}px`,
  }));
}

export function PartCompletionDialog({
  open,
  onClose,
  stars,
  xpAwarded,
  confettiSeed,
  courseHref,
  nextPartHref,
}: {
  open: boolean;
  onClose: () => void;
  // Quando há exercícios, stars vem do grading (0-3). Quando a parte foi
  // marcada manualmente (sem exercícios), passe null — não mostra estrelas.
  stars: number | null;
  // XP ganho na última submission. Pode ser 0 (typo "quase" sem XP extra
  // ou apenas o trigger automático sem XP).
  xpAwarded: number;
  // Seed do confetti — gerado pelo pai (que pode usar Math.random em
  // event handler, conforme regra de pureza do React 19).
  confettiSeed: number;
  // Link para voltar ao curso (opcional — fallback quando não há próxima).
  courseHref?: string;
  // Próxima parte da mesma lição. Quando presente, vira o CTA primário
  // do diálogo ("Próxima") — fluxo de continuação sem voltar à lista.
  nextPartHref?: string;
}) {
  const confetti = useMemo(
    () => buildConfetti(confettiSeed),
    [confettiSeed],
  );
  const hasStars = stars !== null;

  return (
    <Dialog open={open} onClose={onClose} title="Parte concluída!">
      <div className="relative -mx-5 -mt-5 overflow-hidden">
        {/* Bandeira superior — fundo neutro (mesma cor do Dialog),
            sem gradiente. O troféu carrega o destaque com um halo
            sutil em torno; o confetti faz o resto da celebração. */}
        <div className="relative h-32">
          {/* Confetti CSS */}
          {open &&
            confetti.map((c) => (
              <span
                key={c.id}
                aria-hidden="true"
                className="absolute top-0 animate-confetti rounded-sm"
                style={{
                  left: c.left,
                  width: c.size,
                  height: c.size,
                  backgroundColor: c.color,
                  animationDelay: c.delay,
                  animationDuration: c.duration,
                }}
              />
            ))}
          {/* Troféu central com halo concêntrico */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-bg-tertiary ring-4 ring-warning/15">
              <TrophyIcon className="h-12 w-12 text-warning" />
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <p className="text-sm text-fg-secondary">
          Você terminou esta parte. Continue assim!
        </p>

        {hasStars && (
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((i) => (
              <StarIcon
                key={i}
                filled={i <= stars}
                className={cn(
                  "h-8 w-8 transition-colors",
                  i <= stars ? "text-warning" : "text-fg-tertiary opacity-40",
                )}
              />
            ))}
          </div>
        )}

        {xpAwarded > 0 && (
          <span className="rounded-full bg-success-bg px-3 py-1 text-sm font-medium text-success">
            +{xpAwarded} XP
          </span>
        )}

        <div className="flex w-full justify-center gap-2 pt-2">
          {courseHref && (
            <Link href={courseHref}>
              <Button type="button" variant="ghost" size="sm">
                Voltar ao curso
              </Button>
            </Link>
          )}
          {nextPartHref ? (
            <Link href={nextPartHref}>
              <Button type="button" size="sm">
                Próxima
              </Button>
            </Link>
          ) : (
            // Última parte da lição: o "voltar ao curso" assume o papel
            // primário; fechar fica como ação secundária.
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Fechar
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
