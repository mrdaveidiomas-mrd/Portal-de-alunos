import type { DailyXp } from "@/lib/xp/queries";
import { cn } from "@/lib/utils/cn";

// Bar chart SVG dos últimos N dias de XP. Sem libs — só SVG nativo.
//
// Layout:
//   - Eixo Y implícito: altura proporcional ao XP daquele dia / max.
//   - Eixo X: rótulos para hoje, há 7d, há 14d, há 21d, há 30d (ou início).
//   - Hover via <title> em cada barra (tooltip nativo do browser).
//
// Cores: usa tokens (fg-primary para barras com XP, bg-tertiary para
// "ghost" nos dias sem pontuação) para casar com light/dark.

const CHART_HEIGHT = 140; // px (intrinsic — escala via viewBox/preserveAspectRatio)
const BAR_GAP = 2; // px entre barras

function formatBrDate(iso: string): string {
  // "2026-06-05" -> "5 jun"
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}

export function XpHistoryChart({
  data,
  className,
}: {
  data: DailyXp[];
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.xp));
  // viewBox proporcional ao número de barras: 1 unidade por dia.
  const width = data.length;
  const minBarFraction = 0.04; // garante visibilidade da "ghost" mesmo com xp=0

  // Rótulos: pegamos índices ~igualmente espaçados, mostrando início, meio, fim.
  const labelIndices = new Set<number>();
  if (data.length > 0) {
    labelIndices.add(0);
    labelIndices.add(data.length - 1);
    if (data.length > 14) labelIndices.add(Math.floor(data.length / 2));
    if (data.length > 21) {
      labelIndices.add(Math.floor(data.length / 4));
      labelIndices.add(Math.floor((3 * data.length) / 4));
    }
  }

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <svg
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        width="100%"
        height={CHART_HEIGHT}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Histórico de XP dos últimos ${data.length} dias`}
        className="rounded-md"
      >
        {data.map((d, i) => {
          const h =
            d.xp > 0
              ? Math.max(minBarFraction, d.xp / max) * (CHART_HEIGHT - 2)
              : minBarFraction * (CHART_HEIGHT - 2);
          const y = CHART_HEIGHT - h;
          const x = i + BAR_GAP / 2 / width;
          const barWidth = 1 - BAR_GAP / width;
          const isToday = i === data.length - 1;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx={0.15}
                className={
                  d.xp > 0
                    ? isToday
                      ? "fill-fg-primary"
                      : "fill-fg-primary opacity-80"
                    : "fill-bg-tertiary"
                }
              >
                <title>{`${formatBrDate(d.date)}: ${d.xp} XP`}</title>
              </rect>
            </g>
          );
        })}
      </svg>

      {/* Linha de rótulos. Distribuímos com flex para casar com as barras. */}
      <div className="flex w-full text-[10px] text-fg-tertiary">
        {data.map((d, i) => (
          <span
            key={d.date}
            className="flex-1 text-center"
            aria-hidden="true"
          >
            {labelIndices.has(i) ? formatBrDate(d.date) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
