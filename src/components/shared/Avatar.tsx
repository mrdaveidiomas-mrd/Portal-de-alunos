import { cn } from "@/lib/utils/cn";

// Avatar circular. Quando há `src`, renderiza a imagem. Quando não há,
// mostra iniciais sobre fundo colorido determinístico (cor estável a
// partir do identifier: mesmo aluno = mesma cor, sempre).
//
// Tamanhos via prop semântica para manter consistência (sm/md/lg).

const SIZE_CLS = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-24 w-24 text-lg",
} as const;

export type AvatarSize = keyof typeof SIZE_CLS;

// Paleta de fundos para iniciais. Cores suaves para combinar com ambos
// os temas. Selecionada deterministicamente por hash do identifier.
const PALETTE = [
  "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  "bg-orange-500/15 text-orange-600 dark:text-orange-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
];

function hashIdentifier(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initialsOf(name: string | null | undefined, email: string): string {
  const source = (name?.trim() || email).trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]![0] ?? "?").toUpperCase();
  return (
    (parts[0]![0] ?? "") + (parts[parts.length - 1]![0] ?? "")
  ).toUpperCase();
}

export function Avatar({
  src,
  fullName,
  email,
  size = "md",
  className,
}: {
  src?: string | null;
  fullName?: string | null;
  email: string;
  size?: AvatarSize;
  className?: string;
}) {
  const sizeCls = SIZE_CLS[size];
  const initials = initialsOf(fullName, email);
  // Cor estável: hash do email (identificador único e estável).
  const palette = PALETTE[hashIdentifier(email) % PALETTE.length]!;

  if (src) {
    // Renderiza <img> nativo — Next/Image exigiria configurar remotePatterns
    // para o domínio do Supabase. Para avatares (objeto pequeno, com
    // cache HTTP), <img> é suficiente.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={fullName ?? email}
        className={cn(
          "shrink-0 rounded-full border border-border-primary object-cover",
          sizeCls,
          className,
        )}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={fullName ?? email}
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full font-semibold",
        sizeCls,
        palette,
        className,
      )}
    >
      {initials}
    </div>
  );
}
