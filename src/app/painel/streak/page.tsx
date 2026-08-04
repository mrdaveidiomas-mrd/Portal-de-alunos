import { redirect } from "next/navigation";

import { FlameIcon } from "@/components/icons/FlameIcon";
import { TargetIllustration } from "@/components/illustrations/TargetIllustration";
import { StreakCalendar } from "@/components/painel/StreakCalendar";
import { StreakGoals } from "@/components/painel/StreakGoals";
import { BackLink } from "@/components/shared/BackLink";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getStreakData } from "@/lib/streak/queries";
import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string): string {
  // "2026-06-05" ou ISO completo — extrai data e formata em PT-BR.
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function StreakPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 365 dias cobrem todos os marcos de meta (até 365) e dão fôlego para
  // navegar para meses anteriores no calendário sem rebuscar dados.
  const streak = await getStreakData(supabase, user.id, 365);

  // "Hoje" em BRT — o servidor pode estar rodando em qualquer fuso (Vercel
  // usa UTC). Resolvemos via Intl no mesmo TZ usado pelo trigger SQL e pela
  // resolução de activeDates, para o calendário e o KPI ficarem coerentes.
  const todayBRT = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  // todayBRT == "YYYY-MM-DD"
  const [yearStr, monthStr] = todayBRT.split("-");
  const currentYear = Number(yearStr);
  const currentMonth = Number(monthStr) - 1; // 0-11

  // Dias com prática no mês corrente — para o KPI ao lado do streak atual.
  const monthPrefix = `${yearStr}-${monthStr}-`;
  let activeDaysInMonth = 0;
  for (const key of streak.activeDates) {
    if (key.startsWith(monthPrefix)) activeDaysInMonth++;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <BackLink href="/painel" label="Voltar ao painel" />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-fg-primary">Seu streak</h1>
        <p className="text-sm text-fg-secondary">
          Streak é a sequência de dias seguidos em que você praticou. Cada
          dia com ao menos uma atividade conta.
        </p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-3 gap-3">
        <Card padded className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-2xl font-bold text-fg-primary">
            {streak.currentStreak}
            <FlameIcon className="h-5 w-5 text-warning" />
          </span>
          <span className="text-xs text-fg-secondary">Streak atual</span>
        </Card>
        <Card padded className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-fg-primary">
            {streak.longestStreak}
          </span>
          <span className="text-xs text-fg-secondary">Maior streak</span>
        </Card>
        <Card padded className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-fg-primary">
            {activeDaysInMonth}
          </span>
          <span className="text-xs text-fg-secondary">Dias ativos no mês</span>
        </Card>
      </section>

      {/* Calendário do mês */}
      <Card padded className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-fg-primary">
          Calendário do streak
        </h2>
        {streak.activeDates.size === 0 ? (
          <EmptyState
            illustration={<TargetIllustration className="h-20 w-20" />}
            title="Comece seu streak"
            description="Pratique hoje para acender sua primeira chama. Mesmo um exercício já conta!"
          />
        ) : (
          <StreakCalendar
            activeDates={streak.activeDates}
            initialYear={currentYear}
            initialMonth={currentMonth}
          />
        )}
      </Card>

      {/* Metas de streak */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-fg-primary">
          Meta de streak
        </h2>
        <StreakGoals
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
        />
      </section>

      {/* Última atividade */}
      {streak.lastActivityDate && (
        <Card padded className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-fg-primary">
            Última atividade
          </h2>
          <p className="text-sm text-fg-secondary">
            {formatDate(streak.lastActivityDate)}
          </p>
        </Card>
      )}
    </main>
  );
}
