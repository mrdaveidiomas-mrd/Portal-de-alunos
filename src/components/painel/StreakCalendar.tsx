"use client";

import { useMemo, useState } from "react";

import { FlameIcon } from "@/components/icons/FlameIcon";
import { cn } from "@/lib/utils/cn";

// Calendário mensal de streak — inspirado no Duolingo.
// Mostra um mês por vez (dom→sáb), com dias praticados destacados em
// laranja. Dias consecutivos dentro da mesma semana ganham um fundo
// contínuo (pill), para deixar visível a "corrente". O dia de hoje
// ganha um pin azul em forma de gota, mesmo sem prática registrada.
//
// Client component porque tem estado de mês visível (setas < e >).

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthYearLabel(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function StreakCalendar({
  activeDates,
  initialYear,
  initialMonth,
  className,
}: {
  activeDates: Set<string>;
  // Mês inicial. Convencionalmente o mês de hoje.
  initialYear: number;
  // 0-11 (igual ao Date.getMonth()).
  initialMonth: number;
  className?: string;
}) {
  const [view, setView] = useState<{ year: number; month: number }>({
    year: initialYear,
    month: initialMonth,
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayKey = toISODate(today);

  const firstOfMonth = new Date(view.year, view.month, 1);
  const lastOfMonth = new Date(view.year, view.month + 1, 0);
  const daysInMonth = lastOfMonth.getDate();
  // 0=dom..6=sáb — alinha com WEEKDAY_LABELS (semana começando no domingo,
  // como mostra o design de referência).
  const firstWeekday = firstOfMonth.getDay();

  // Constrói as linhas (semanas) — sempre múltiplo de 7, células antes do
  // dia 1 e depois do último dia ficam vazias.
  type Cell =
    | { kind: "empty" }
    | {
        kind: "day";
        day: number;
        key: string;
        active: boolean;
        isToday: boolean;
        // Posição na "run" de dias consecutivos ativos da mesma semana.
        runLeft: boolean;
        runRight: boolean;
      };

  const weeks: Cell[][] = [];
  let currentWeek: Cell[] = [];
  // Preenche o offset inicial com células vazias.
  for (let i = 0; i < firstWeekday; i++) currentWeek.push({ kind: "empty" });

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(view.year, view.month, day);
    const key = toISODate(date);
    const active = activeDates.has(key);
    currentWeek.push({
      kind: "day",
      day,
      key,
      active,
      isToday: key === todayKey,
      runLeft: false,
      runRight: false,
    });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  // Completa a última semana com células vazias.
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push({ kind: "empty" });
    weeks.push(currentWeek);
  }

  // Marca as conexões da "pill" — runLeft/runRight para cada célula ativa
  // colada a outra ativa na mesma semana.
  for (const week of weeks) {
    for (let i = 0; i < week.length; i++) {
      const cell = week[i]!;
      if (cell.kind !== "day" || !cell.active) continue;
      const left = i > 0 ? week[i - 1]! : null;
      const right = i < 6 ? week[i + 1]! : null;
      if (left && left.kind === "day" && left.active) cell.runLeft = true;
      if (right && right.kind === "day" && right.active) cell.runRight = true;
    }
  }

  function prevMonth() {
    setView((v) => {
      const m = v.month - 1;
      if (m < 0) return { year: v.year - 1, month: 11 };
      return { year: v.year, month: m };
    });
  }

  function nextMonth() {
    setView((v) => {
      const m = v.month + 1;
      if (m > 11) return { year: v.year + 1, month: 0 };
      return { year: v.year, month: m };
    });
  }

  // Não deixa avançar para um mês inteiramente no futuro — o primeiro dia
  // do próximo mês precisa ser <= hoje.
  const canGoNext = new Date(view.year, view.month + 1, 1) <= today;

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {/* Cabeçalho com setas */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Mês anterior"
          className="rounded-full p-1.5 text-fg-secondary transition-colors hover:bg-bg-tertiary hover:text-fg-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium capitalize text-fg-primary">
          {monthYearLabel(firstOfMonth)}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Próximo mês"
          disabled={!canGoNext}
          className="rounded-full p-1.5 text-fg-secondary transition-colors hover:bg-bg-tertiary hover:text-fg-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Rótulos da semana */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="text-center text-xs font-medium text-fg-tertiary"
            aria-hidden="true"
          >
            {label}
          </span>
        ))}
      </div>

      {/* Grid de dias */}
      <div
        role="grid"
        aria-label={`Calendário de prática — ${monthYearLabel(firstOfMonth)}`}
        className="flex flex-col gap-1"
      >
        {weeks.map((week, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7 gap-1">
            {week.map((cell, ci) => (
              <CellView key={ci} cell={cell} />
            ))}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-fg-tertiary">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-warning text-bg-primary">
            <FlameIcon className="h-2.5 w-2.5" />
          </span>
          Praticou
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="relative h-4 w-4">
            <span className="absolute inset-0 rounded-full border border-info bg-info/15" />
          </span>
          Hoje
        </span>
      </div>
    </div>
  );
}

type DayCell = {
  kind: "day";
  day: number;
  key: string;
  active: boolean;
  isToday: boolean;
  runLeft: boolean;
  runRight: boolean;
};
type EmptyCell = { kind: "empty" };

function CellView({ cell }: { cell: DayCell | EmptyCell }) {
  if (cell.kind === "empty") {
    return <div role="gridcell" className="aspect-square" />;
  }

  const { day, active, isToday, runLeft, runRight } = cell;

  return (
    <div
      role="gridcell"
      className="relative flex aspect-square items-center justify-center"
      title={
        active
          ? `Dia ${day} — praticou${isToday ? " (hoje)" : ""}`
          : `Dia ${day}${isToday ? " (hoje)" : ""}`
      }
    >
      {/* Fundo "pill" para runs de dias consecutivos ativos na mesma semana.
          Cobre toda a célula horizontalmente e estende para os vizinhos
          ativos sem arredondar a borda voltada para o próximo. */}
      {active && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1 left-0 right-0 bg-warning/15",
            runLeft && runRight && "rounded-none",
            !runLeft && !runRight && "rounded-full",
            runLeft && !runRight && "rounded-r-full",
            !runLeft && runRight && "rounded-l-full",
          )}
        />
      )}

      {/* Círculo do dia */}
      <span
        className={cn(
          "relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
          active
            ? "bg-warning text-bg-primary"
            : isToday
              ? "border border-info text-info"
              : "text-fg-secondary",
        )}
      >
        {active && <FlameIcon className="absolute h-3 w-3 opacity-30" />}
        <span className="relative">{day}</span>
      </span>

    </div>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

