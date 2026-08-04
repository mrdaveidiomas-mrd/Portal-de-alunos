import { redirect } from "next/navigation";

import { TrophyIcon } from "@/components/icons/TrophyIcon";
import { ClaimAchievementButton } from "@/components/painel/ClaimAchievementButton";
import { BackLink } from "@/components/shared/BackLink";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  METRIC_FOR_CODE,
  SET_LABELS,
  SET_TIERS,
  STANDALONE_CODES,
  THRESHOLDS,
  type AchievementCode,
  type SetCode,
} from "@/lib/achievements/catalog";
import { computeUserMetrics } from "@/lib/achievements/metrics";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils/cn";

interface CatalogRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  xp_reward: number;
  set_code: string | null;
  tier: number | null;
}

interface OwnedRow {
  achievement_id: string;
  earned_at: string;
  claimed_at: string | null;
}

// Cada entrada do catálogo recebe seu estado para a UI.
interface ItemView {
  id: string;
  code: AchievementCode;
  title: string;
  description: string | null;
  xpReward: number;
  // "locked" — nem atingiu | "earned" — atingiu, ainda não coletou
  // | "claimed" — atingiu e coletou
  status: "locked" | "earned" | "claimed";
}

export default async function ConquistasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: catalog }, { data: owned }, metrics] = await Promise.all([
    supabase
      .from("achievements")
      .select(
        "id, code, title, description, xp_reward, set_code, tier",
      )
      .order("tier", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("user_achievements")
      .select("achievement_id, earned_at, claimed_at")
      .eq("user_id", user.id),
    computeUserMetrics(supabase, user.id),
  ]);

  const ownedMap = new Map<string, OwnedRow>();
  for (const o of owned ?? []) ownedMap.set(o.achievement_id, o);
  const byCode = new Map<AchievementCode, CatalogRow>();
  for (const c of (catalog ?? []) as CatalogRow[]) {
    byCode.set(c.code as AchievementCode, c);
  }

  function makeView(code: AchievementCode): ItemView | null {
    const c = byCode.get(code);
    if (!c) return null;
    const ow = ownedMap.get(c.id);
    let status: ItemView["status"] = "locked";
    if (ow?.claimed_at) status = "claimed";
    else if (ow) status = "earned";
    return {
      id: c.id,
      code,
      title: c.title,
      description: c.description,
      xpReward: c.xp_reward,
      status,
    };
  }

  const standaloneItems = STANDALONE_CODES.map(makeView).filter(
    (i): i is ItemView => i !== null,
  );

  const setEntries = (Object.keys(SET_TIERS) as SetCode[]).map((setCode) => {
    const tiers = SET_TIERS[setCode]
      .map(makeView)
      .filter((i): i is ItemView => i !== null);
    return { setCode, label: SET_LABELS[setCode], tiers };
  });

  const claimable =
    standaloneItems.filter((i) => i.status === "earned").length +
    setEntries.reduce(
      (acc, s) => acc + s.tiers.filter((t) => t.status === "earned").length,
      0,
    );
  const totalClaimed =
    standaloneItems.filter((i) => i.status === "claimed").length +
    setEntries.reduce(
      (acc, s) => acc + s.tiers.filter((t) => t.status === "claimed").length,
      0,
    );
  const totalItems =
    standaloneItems.length +
    setEntries.reduce((acc, s) => acc + s.tiers.length, 0);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <BackLink href="/painel" label="Voltar ao painel" />
        <h1 className="text-2xl font-semibold text-fg-primary">Conquistas</h1>
        <p className="text-sm text-fg-secondary">
          {totalClaimed} de {totalItems} coletadas
          {claimable > 0 && (
            <>
              {" · "}
              <span className="font-medium text-warning">
                {claimable} para coletar
              </span>
            </>
          )}
          .
        </p>
      </div>

      {/* Standalones */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-fg-primary">
          Primeiros passos
        </h2>
        <ul className="flex flex-col gap-3">
          {standaloneItems.map((item) => (
            <li key={item.id}>
              <StandaloneCard item={item} />
            </li>
          ))}
        </ul>
      </section>

      {/* Conjuntos */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-fg-primary">Conjuntos</h2>
        <ul className="flex flex-col gap-3">
          {setEntries.map((entry) => (
            <li key={entry.setCode}>
              <SetCard
                setCode={entry.setCode}
                label={entry.label}
                tiers={entry.tiers}
                metricValue={resolveMetricValue(metrics, entry.tiers)}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function StandaloneCard({ item }: { item: ItemView }) {
  return (
    <Card
      padded
      className={cn(
        "flex items-start gap-3",
        item.status === "earned" && "border-warning/40 bg-warning-bg/30",
        item.status === "locked" && "opacity-60",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          item.status === "claimed" && "bg-warning text-bg-primary",
          item.status === "earned" && "bg-warning/15 text-warning",
          item.status === "locked" && "bg-bg-tertiary text-fg-tertiary",
        )}
      >
        <TrophyIcon className="h-5 w-5" />
      </div>
      <div className="flex flex-1 flex-col">
        <span className="font-medium text-fg-primary">{item.title}</span>
        {item.description && (
          <span className="text-sm text-fg-secondary">{item.description}</span>
        )}
        <StatusLine item={item} />
      </div>
      {item.status === "earned" && (
        <ClaimAchievementButton
          achievementId={item.id}
          xpReward={item.xpReward}
        />
      )}
    </Card>
  );
}

function SetCard({
  setCode,
  label,
  tiers,
  metricValue,
}: {
  setCode: SetCode;
  label: string;
  tiers: ItemView[];
  metricValue: number;
}) {
  void setCode;
  // Tier "em destaque": o primeiro earned (não coletado) ou o primeiro
  // locked. Se todos forem claimed, mostra o tier 3 como "completo".
  const earnedNotClaimed = tiers.find((t) => t.status === "earned");
  const firstLocked = tiers.find((t) => t.status === "locked");
  const focusTier = earnedNotClaimed ?? firstLocked ?? tiers[tiers.length - 1]!;

  // Threshold do tier focado e o anterior (para a barra de progresso ser
  // relativa, ex: para o tier 2 do "Estudante" mostra 12/30, partindo
  // do 10 já alcançado).
  const focusThreshold = THRESHOLDS[focusTier.code] ?? 0;
  const focusIndex = tiers.indexOf(focusTier);
  const prevThreshold =
    focusIndex > 0 ? THRESHOLDS[tiers[focusIndex - 1]!.code] ?? 0 : 0;

  const allClaimed = tiers.every((t) => t.status === "claimed");

  // Quantos tiers já estão claimed (para "Tier 2 de 3" tipo de label).
  const claimedTiers = tiers.filter((t) => t.status === "claimed").length;

  return (
    <Card
      padded
      className={cn(
        "flex flex-col gap-3",
        earnedNotClaimed && "border-warning/40 bg-warning-bg/30",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            allClaimed && "bg-warning text-bg-primary",
            earnedNotClaimed && !allClaimed && "bg-warning/15 text-warning",
            !allClaimed &&
              !earnedNotClaimed &&
              "bg-bg-tertiary text-fg-tertiary",
          )}
        >
          <TrophyIcon className="h-5 w-5" />
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium text-fg-primary">{label}</span>
            <span className="text-xs text-fg-tertiary">
              {allClaimed
                ? "Conjunto completo ✓"
                : `Tier ${claimedTiers + (earnedNotClaimed ? 1 : 0)} de ${tiers.length}`}
            </span>
          </div>
          <span className="text-sm text-fg-secondary">{focusTier.title}</span>
          {focusTier.description && (
            <span className="text-xs text-fg-tertiary">
              {focusTier.description}
            </span>
          )}
        </div>
        {earnedNotClaimed && (
          <ClaimAchievementButton
            achievementId={earnedNotClaimed.id}
            xpReward={earnedNotClaimed.xpReward}
          />
        )}
      </div>

      {/* Barra de progresso até o tier focado (apenas se ainda não foi
          tudo coletado). */}
      {!allClaimed && (
        <div className="flex flex-col gap-1">
          <ProgressBar
            value={Math.max(metricValue - prevThreshold, 0)}
            max={Math.max(focusThreshold - prevThreshold, 1)}
            ariaLabel={`Progresso para ${focusTier.title}`}
          />
          <span className="text-xs text-fg-tertiary">
            {formatProgress(metricValue, focusThreshold)}
          </span>
        </div>
      )}

      {/* Mini-trilha dos 3 tiers — visual rápido de quem foi coletado. */}
      <TierTrack tiers={tiers} />
    </Card>
  );
}

function StatusLine({ item }: { item: ItemView }) {
  if (item.status === "claimed") {
    return (
      <span className="mt-1 text-xs text-success">
        Coletada · +{item.xpReward} XP
      </span>
    );
  }
  if (item.status === "earned") {
    return (
      <span className="mt-1 text-xs font-medium text-warning">
        Pronto para coletar!
      </span>
    );
  }
  return (
    <span className="mt-1 text-xs text-fg-tertiary">
      Recompensa: +{item.xpReward} XP
    </span>
  );
}

function TierTrack({ tiers }: { tiers: ItemView[] }) {
  return (
    <ul className="flex gap-2">
      {tiers.map((t, i) => (
        <li
          key={t.id}
          className={cn(
            "flex flex-1 items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs",
            t.status === "claimed" &&
              "border-success/40 bg-success-bg/30 text-success",
            t.status === "earned" &&
              "border-warning/50 bg-warning-bg/40 text-warning",
            t.status === "locked" &&
              "border-border-primary text-fg-tertiary",
          )}
        >
          <span className="font-semibold">{i + 1}</span>
          <span className="truncate">+{t.xpReward} XP</span>
          {t.status === "claimed" && <span aria-hidden="true">✓</span>}
        </li>
      ))}
    </ul>
  );
}

function formatProgress(value: number, target: number): string {
  // Formatação de números maiores fica melhor com separador (1.000 XP)
  const fmt = (n: number) => n.toLocaleString("pt-BR");
  const capped = Math.min(value, target);
  return `${fmt(capped)} / ${fmt(target)}`;
}

function resolveMetricValue(
  metrics: import("@/lib/achievements/catalog").UserMetrics,
  tiers: ItemView[],
): number {
  // Todos os tiers do conjunto usam a mesma métrica — basta olhar o
  // primeiro. Boolean metrics (hasFirstDay/hasBookmark) não aparecem
  // em conjuntos; coerção para number cobre as numéricas com segurança.
  const first = tiers[0];
  if (!first) return 0;
  const key = METRIC_FOR_CODE[first.code as AchievementCode];
  if (!key) return 0;
  const raw = metrics[key];
  return typeof raw === "number" ? raw : raw ? 1 : 0;
}
