"use client";

import { useMemo } from "react";

import { CalendarIcon } from "@/components/icons/CalendarIcon";
import { buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DAY_LABELS,
  formatStartTime,
  nextOccurrenceBRT,
  type LiveSession,
} from "@/lib/live-sessions/queries";

// Card "Próxima aula" no painel do aluno. Recebe TODAS as aulas
// cadastradas e escolhe a próxima ocorrência (recorrência semanal em BRT).
// Layout horizontal, igual aos demais cards: KpiIcon azul + título +
// linha-meta com professor/dia/hora + botão "Entrar na aula" à direita.
export function UpcomingLiveSessionCard({
  sessions,
}: {
  sessions: LiveSession[];
}) {
  // useMemo com input estável evita recomputar. A "agora" só é avaliada
  // na primeira renderização do card — pra atualizar de fato no rollover
  // do horário, o painel seria recarregado (revalidatePath).
  const next = useMemo(() => {
    if (sessions.length === 0) return null;
    const now = new Date();
    let best: { session: LiveSession; when: Date } | null = null;
    for (const s of sessions) {
      const when = nextOccurrenceBRT(s.dayOfWeek, s.startTime, now);
      if (!best || when < best.when) best = { session: s, when };
    }
    return best;
  }, [sessions]);

  if (sessions.length === 0 || !next) return null;

  const session = next.session;
  // "Está acontecendo agora?" — janela de 60 minutos antes / 60 minutos
  // depois do horário marcado, em BRT.
  const now = new Date();
  const minutesAway = Math.round(
    (next.when.getTime() - now.getTime()) / 60_000,
  );
  const isLive = minutesAway > -60 && minutesAway <= 60;

  const meta = [
    session.teacherName ?? "Professor",
    DAY_LABELS[session.dayOfWeek],
    formatStartTime(session.startTime),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <a
      href={session.meetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <Card
        padded
        interactive
        className="flex items-center justify-between gap-4"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Próxima aula é ação SECUNDÁRIA — recua: chip neutro
              (bg-tertiary + texto secundário) em vez do azul da marca. */}
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-fg-secondary">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-fg-primary">
                Próxima aula
              </span>
              {isLive && (
                <span className="flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  Ao vivo
                </span>
              )}
            </div>
            <span className="truncate text-xs text-fg-tertiary">{meta}</span>
          </div>
        </div>

        {/* Span estilizado como botão — não é um <button> porque já está
            dentro de um <a> (HTML inválido). O card inteiro é o click target. */}
        {/* Mantém o mesmo azul primário dos outros botões do painel
            (Começar, Continuar/Revisar) para parecer realmente um botão. */}
        <span
          className={
            buttonVariants({ size: "sm" }) + " w-24 shrink-0 text-center"
          }
        >
          {isLive ? "Entrar agora" : "Entrar"}
        </span>
      </Card>
    </a>
  );
}
