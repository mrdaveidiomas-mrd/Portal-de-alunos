import { FlameIcon } from "@/components/icons/FlameIcon";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils/cn";

// Metas de streak — degraus que o aluno persegue. Mostra cada marco
// com seu estado: bloqueado (ainda longe), em progresso (próximo a
// alcançar) ou concluído. A meta "em progresso" é a primeira ainda
// não atingida, e ganha uma barra de progresso.

const MILESTONES = [3, 7, 15, 30, 90, 180, 365] as const;

export function StreakGoals({
  currentStreak,
  longestStreak,
}: {
  currentStreak: number;
  // Maior streak já atingido — usado para marcar metas conquistadas
  // historicamente mesmo que o streak atual tenha sido interrompido.
  longestStreak: number;
}) {
  // Próxima meta = primeira que ainda não foi atingida pelo streak ATUAL.
  // (Mesmo que o aluno já tenha batido 30 dias no passado, se o streak
  //  atual é 4, a "próxima" continua sendo 7 — é o que ele está perseguindo
  //  agora.)
  const nextIndex = MILESTONES.findIndex((m) => currentStreak < m);

  return (
    <div className="flex flex-col gap-2">
      {MILESTONES.map((days, i) => {
        const reachedNow = currentStreak >= days;
        const reachedHistorically = longestStreak >= days;
        const isNext = i === nextIndex;
        // Para a meta "em progresso", calcula o ponto de partida — a meta
        // anterior ou 0. Assim a barra mostra o caminho relativo entre
        // marcos, não desde o dia 0 do streak.
        const prevMilestone = i > 0 ? MILESTONES[i - 1]! : 0;
        return (
          <MilestoneRow
            key={days}
            days={days}
            reachedNow={reachedNow}
            reachedHistorically={reachedHistorically}
            isNext={isNext}
            current={currentStreak}
            from={prevMilestone}
          />
        );
      })}
    </div>
  );
}

function MilestoneRow({
  days,
  reachedNow,
  reachedHistorically,
  isNext,
  current,
  from,
}: {
  days: number;
  reachedNow: boolean;
  reachedHistorically: boolean;
  isNext: boolean;
  current: number;
  from: number;
}) {
  const status: "done" | "next" | "locked" = reachedNow
    ? "done"
    : isNext
      ? "next"
      : "locked";

  return (
    <Card
      padded
      className={cn(
        "flex items-center gap-4",
        status === "next" && "border-warning/40",
        status === "locked" && "opacity-70",
      )}
    >
      {/* Ícone redondo */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          status === "done" && "bg-warning text-bg-primary",
          status === "next" && "bg-warning/15 text-warning",
          status === "locked" && "bg-bg-tertiary text-fg-tertiary",
        )}
        aria-hidden="true"
      >
        <FlameIcon className="h-5 w-5" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-fg-primary">
            {days} {days === 1 ? "dia" : "dias"}
          </span>
          <StatusLabel
            status={status}
            current={current}
            target={days}
            reachedHistorically={reachedHistorically}
          />
        </div>
        {status === "next" && (
          <ProgressBar
            value={Math.max(current - from, 0)}
            max={days - from}
            ariaLabel={`Progresso para a meta de ${days} dias`}
          />
        )}
      </div>
    </Card>
  );
}

function StatusLabel({
  status,
  current,
  target,
  reachedHistorically,
}: {
  status: "done" | "next" | "locked";
  current: number;
  target: number;
  reachedHistorically: boolean;
}) {
  if (status === "done") {
    return (
      <span className="text-xs font-medium text-success">Concluída</span>
    );
  }
  if (status === "next") {
    return (
      <span className="text-xs text-fg-secondary">
        {current} / {target} dias
      </span>
    );
  }
  // locked — mostra um indicador discreto se já foi conquistada antes
  if (reachedHistorically) {
    return (
      <span className="text-xs text-fg-tertiary">já alcançada antes</span>
    );
  }
  return (
    <span className="text-xs text-fg-tertiary">bloqueada</span>
  );
}
