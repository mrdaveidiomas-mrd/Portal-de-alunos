"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { FlameIcon } from "@/components/icons/FlameIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { TrophyIcon } from "@/components/icons/TrophyIcon";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils/cn";

// Diálogo polido exibido UMA vez quando o aluno conclui a LIÇÃO inteira
// (não a cada parte). Funciona como o "end-of-lesson" do Duolingo: troféu
// grande, confete, estatísticas e — o foco — um botão para compartilhar
// uma imagem 1080×1080 do progresso.
//
// O compartilhamento usa Web Share API com fallback para download/clipboard.

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
  "var(--color-primary-brand)",
];

function buildConfetti(seed: number): ConfettiPiece[] {
  let s = seed || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  // Mais confetes que o dialog de parte — celebração de lição é o "grande
  // momento" (24 partículas vs 16).
  return Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    left: `${Math.round(rand() * 90 + 5)}%`,
    delay: `${(rand() * 350).toFixed(0)}ms`,
    duration: `${(1000 + rand() * 700).toFixed(0)}ms`,
    color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)]!,
    size: `${(7 + Math.round(rand() * 7))}px`,
  }));
}

export interface LessonCompletionStudent {
  fullName: string | null;
  avatarUrl: string | null;
}

export function LessonCompletionDialog({
  open,
  onClose,
  stars,
  xpAwarded,
  currentStreak,
  student,
  lessonTitle,
  confettiSeed,
  courseHref,
}: {
  open: boolean;
  onClose: () => void;
  stars: number | null;
  xpAwarded: number;
  currentStreak: number;
  student: LessonCompletionStudent;
  lessonTitle: string;
  confettiSeed: number;
  courseHref?: string;
}) {
  const confetti = useMemo(
    () => buildConfetti(confettiSeed),
    [confettiSeed],
  );
  const hasStars = stars !== null;
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await renderShareCard({
        fullName: student.fullName ?? "Aluno",
        avatarUrl: student.avatarUrl,
        stars,
        xpAwarded,
        currentStreak,
        lessonTitle,
      });
      const file = new File([blob], "mr-dave-progresso.png", {
        type: "image/png",
      });

      // 1) Tenta Web Share API com file. É o caminho ideal — abre share
      //    sheet nativa com WhatsApp/Instagram/X/etc.
      const canShareFile =
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });
      if (canShareFile && typeof navigator.share === "function") {
        try {
          await navigator.share({
            files: [file],
            title: "Mr. Dave Idiomas",
            text: "Concluí mais uma lição no Portal Mr. Dave! 🚀",
          });
          return;
        } catch (err) {
          // AbortError = usuário cancelou; é silêncio.
          if (err instanceof Error && err.name === "AbortError") return;
          // Qualquer outro erro: cai pro fallback abaixo.
        }
      }

      // 2) Fallback: tenta copiar pra área de transferência.
      const canClipboardImage =
        typeof ClipboardItem !== "undefined" &&
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        "write" in navigator.clipboard;
      if (canClipboardImage) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          toast.success({
            title: "Imagem copiada!",
            description: "Cole no seu app favorito (Ctrl/Cmd + V).",
          });
          return;
        } catch {
          // Cai pro download.
        }
      }

      // 3) Último recurso: download direto.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mr-dave-progresso.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success({
        title: "Imagem baixada",
        description: "Compartilhe no app que preferir.",
      });
    } catch (err) {
      console.error("share failed", err);
      toast.danger({
        title: "Não consegui gerar a imagem",
        description: "Tente de novo em instantes.",
      });
    } finally {
      setSharing(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Lição concluída!">
      {/* Cabeçalho celebratório — troféu grande com pulse + confete. */}
      <div className="relative -mx-5 -mt-5 overflow-hidden bg-gradient-to-b from-primary-brand-surface/40 to-transparent">
        <div className="relative h-40">
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
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "relative flex h-24 w-24 items-center justify-center rounded-full",
                "bg-warning/10 ring-8 ring-warning/15",
                "animate-trophy-pop",
              )}
            >
              <TrophyIcon className="h-14 w-14 text-warning" />
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-fg-primary">
            Lição concluída!
          </h2>
          <p className="text-sm text-fg-secondary">
            {lessonTitle ? `“${lessonTitle}”` : "Você terminou a lição."}
          </p>
        </div>

        {/* Estatísticas em pílulas — estrelas, XP, streak. */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {hasStars && (
            <div className="flex items-center gap-1.5 rounded-full bg-bg-tertiary px-3 py-1.5">
              {[1, 2, 3].map((i) => (
                <StarIcon
                  key={i}
                  filled={i <= stars}
                  className={cn(
                    "h-5 w-5",
                    i <= stars
                      ? "text-warning"
                      : "text-fg-tertiary opacity-40",
                  )}
                />
              ))}
            </div>
          )}
          {xpAwarded > 0 && (
            <span className="rounded-full bg-success-bg px-3 py-1.5 text-sm font-semibold text-success">
              +{xpAwarded} XP
            </span>
          )}
          {currentStreak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-warning-bg px-3 py-1.5 text-sm font-semibold text-warning">
              <FlameIcon className="h-4 w-4" />
              {currentStreak}
            </span>
          )}
        </div>

        {/* Ações — compartilhar é o destaque. */}
        <div className="flex w-full flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={handleShare}
            loading={sharing}
            className="w-full sm:w-auto"
          >
            <ShareIcon className="h-4 w-4" />
            Compartilhar progresso
          </Button>
          {courseHref && (
            <Link href={courseHref} className="w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Voltar ao curso
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function ShareIcon({ className }: { className?: string }) {
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
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

// =====================================================================
// Canvas renderer — desenha o cartão 1080×1080 e devolve um Blob PNG.
// =====================================================================

interface ShareCardInput {
  fullName: string;
  avatarUrl: string | null;
  stars: number | null;
  xpAwarded: number;
  currentStreak: number;
  lessonTitle: string;
}

async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  const SIZE = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context indisponível");

  // Fundo: gradiente diagonal da marca (navy → navy mais escuro).
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, "#032d6f");
  bg.addColorStop(1, "#011a44");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Padding interno e helpers de tipografia.
  const PAD = 80;
  const font = (size: number, weight = 700) =>
    `${weight} ${size}px Inter, system-ui, -apple-system, sans-serif`;

  // Logo Mr. Dave no topo (carrega de /logo.png; se falhar, segue sem).
  try {
    const logo = await loadImage("/logo.png");
    const LOGO_SIZE = 120;
    ctx.drawImage(logo, PAD, PAD, LOGO_SIZE, LOGO_SIZE);
  } catch {
    // Sem logo: usa só o texto da marca.
  }

  // "Mr. Dave Idiomas" ao lado do logo.
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = font(40);
  ctx.fillText("Mr. Dave", PAD + 145, PAD + 50);
  ctx.font = font(28, 500);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Idiomas", PAD + 145, PAD + 92);

  // Avatar circular + nome do aluno no centro alto.
  const AVATAR_Y = 320;
  const AVATAR_R = 110;
  await drawAvatar(ctx, input.avatarUrl, input.fullName, SIZE / 2, AVATAR_Y, AVATAR_R);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = font(44);
  ctx.fillText(truncate(input.fullName, 28), SIZE / 2, AVATAR_Y + AVATAR_R + 60);

  // "Concluí mais uma lição!" call-out.
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = font(32, 500);
  ctx.fillText("Concluí mais uma lição!", SIZE / 2, AVATAR_Y + AVATAR_R + 110);

  // Linha de estatísticas: estrelas | XP | streak.
  const STATS_Y = 720;
  drawStatsRow(ctx, SIZE, STATS_Y, input);

  // Rodapé com URL/marca.
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = font(24, 500);
  ctx.textAlign = "center";
  ctx.fillText("portaldealunos.mrdaveidiomas.com.br", SIZE / 2, SIZE - PAD);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob falhou"))),
      "image/png",
      0.95,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falhou ao carregar ${src}`));
    img.src = src;
  });
}

async function drawAvatar(
  ctx: CanvasRenderingContext2D,
  src: string | null,
  fullName: string,
  cx: number,
  cy: number,
  r: number,
): Promise<void> {
  // Anel branco em volta pra dar destaque.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (src) {
    try {
      const img = await loadImage(src);
      // Calcula crop "cover" para o círculo.
      const ratio = img.width / img.height;
      let dw = r * 2;
      let dh = r * 2;
      if (ratio > 1) dw = dh * ratio;
      else dh = dw / ratio;
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx.restore();
      return;
    } catch {
      // Cai pro placeholder com iniciais.
    }
  }

  // Placeholder: círculo da marca + iniciais.
  ctx.fillStyle = "#a60404";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${r}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials(fullName), cx, cy);
  ctx.restore();
}

function drawStatsRow(
  ctx: CanvasRenderingContext2D,
  size: number,
  y: number,
  input: ShareCardInput,
): void {
  // Painel translúcido com 3 colunas.
  const PANEL_H = 200;
  const PANEL_X = 80;
  const PANEL_W = size - PANEL_X * 2;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, PANEL_X, y, PANEL_W, PANEL_H, 28);
  ctx.fill();

  const cells = 3;
  const cellW = PANEL_W / cells;

  const valueFont = `800 56px Inter, system-ui, sans-serif`;
  const labelFont = `500 22px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";

  // Cell 1 — estrelas (★★★)
  const starsCx = PANEL_X + cellW * 0.5;
  ctx.textBaseline = "middle";
  drawStars(ctx, starsCx, y + 75, input.stars ?? 0);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = labelFont;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Estrelas", starsCx, y + 160);

  // Cell 2 — XP
  const xpCx = PANEL_X + cellW * 1.5;
  ctx.fillStyle = "#ffffff";
  ctx.font = valueFont;
  ctx.textBaseline = "middle";
  ctx.fillText(`+${input.xpAwarded}`, xpCx, y + 80);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = labelFont;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("XP nesta parte", xpCx, y + 160);

  // Cell 3 — streak (🔥 + número)
  const streakCx = PANEL_X + cellW * 2.5;
  ctx.fillStyle = "#ffffff";
  ctx.font = valueFont;
  ctx.textBaseline = "middle";
  // Desenha número + chama (emoji-flame via texto)
  ctx.fillText(`🔥 ${input.currentStreak}`, streakCx, y + 80);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = labelFont;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Streak", streakCx, y + 160);

  // Linhas verticais divisórias sutis.
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  for (let i = 1; i < cells; i++) {
    const x = PANEL_X + cellW * i;
    ctx.beginPath();
    ctx.moveTo(x, y + 32);
    ctx.lineTo(x, y + PANEL_H - 32);
    ctx.stroke();
  }
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  filled: number,
) {
  const TOTAL = 3;
  const SIZE = 44;
  const GAP = 14;
  const totalW = TOTAL * SIZE + (TOTAL - 1) * GAP;
  const startX = cx - totalW / 2 + SIZE / 2;
  for (let i = 0; i < TOTAL; i++) {
    const x = startX + i * (SIZE + GAP);
    drawStar(ctx, x, cy, SIZE / 2, i < filled ? "#fbbf24" : "rgba(255,255,255,0.2)");
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const spikes = 5;
  const outerR = r;
  const innerR = r * 0.45;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

