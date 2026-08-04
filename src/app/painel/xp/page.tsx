import { redirect } from "next/navigation";

import { TargetIllustration } from "@/components/illustrations/TargetIllustration";
import { XpHistoryChart } from "@/components/painel/XpHistoryChart";
import { BackLink } from "@/components/shared/BackLink";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getXpBySource, getXpHistory } from "@/lib/xp/queries";

// Rótulos amigáveis para sources de exercícios/speaking. Achievements vêm
// do label resolvido pela query (que faz join com a tabela achievements).
const SOURCE_LABELS: Record<string, string> = {
  "exercise:multiple_choice": "Múltipla escolha",
  "exercise:fill_blank": "Lacuna",
  "exercise:translation": "Tradução",
  "exercise:reorder_words": "Reordenar palavras",
  "exercise:error_correction": "Correção de erro",
  "speaking:voice": "Speaking (voz)",
  "speaking:text": "Speaking (texto)",
};

function prettyLabel(source: string, fallback: string): string {
  return SOURCE_LABELS[source] ?? fallback;
}

export default async function XpHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [history, bySource] = await Promise.all([
    getXpHistory(supabase, user.id, 30),
    getXpBySource(supabase, user.id),
  ]);

  const maxSource = Math.max(1, ...bySource.map((s) => s.xp));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <BackLink href="/painel" label="Voltar ao painel" />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-fg-primary">Seu XP</h1>
        <p className="text-sm text-fg-secondary">
          Acompanhe a evolução do seu esforço ao longo do tempo. XP é
          ganho ao concluir exercícios e atividades de speaking.
        </p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-3 gap-3">
        <Card padded className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-fg-primary">
            {history.totalXp}
          </span>
          <span className="text-xs text-fg-secondary">XP total</span>
        </Card>
        <Card padded className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-fg-primary">
            {history.weekXp}
          </span>
          <span className="text-xs text-fg-secondary">Últimos 7 dias</span>
        </Card>
        <Card padded className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-fg-primary">
            {history.todayXp}
          </span>
          <span className="text-xs text-fg-secondary">Hoje</span>
        </Card>
      </section>

      {/* Histórico diário */}
      <Card padded className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-fg-primary">
            Últimos 30 dias
          </h2>
          <span className="text-xs text-fg-tertiary">
            Passe o mouse nas barras para ver o XP de cada dia
          </span>
        </div>
        {history.totalXp === 0 ? (
          <EmptyState
            illustration={<TargetIllustration className="h-20 w-20" />}
            title="Sem XP ainda"
            description="Quando você acertar seu primeiro exercício, ele aparece aqui — e o gráfico vai contando sua evolução."
          />
        ) : (
          <XpHistoryChart data={history.daily} />
        )}
      </Card>

      {/* Breakdown por fonte */}
      {bySource.length > 0 && (
        <Card padded className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-fg-primary">
            De onde veio seu XP
          </h2>
          <ul className="flex flex-col gap-2">
            {bySource.map((s) => {
              const pct = (s.xp / maxSource) * 100;
              return (
                <li key={s.source} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-fg-primary">
                      {prettyLabel(s.source, s.label)}
                    </span>
                    <span className="text-fg-secondary">{s.xp} XP</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary">
                    <div
                      className="h-full rounded-full bg-fg-primary transition-[width] duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </main>
  );
}
