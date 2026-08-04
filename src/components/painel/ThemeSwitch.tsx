"use client";

import { MoonIcon } from "@/components/icons/MoonIcon";
import { SunIcon } from "@/components/icons/SunIcon";
import { useTheme, type Theme } from "@/components/shared/ThemeProvider";
import { cn } from "@/lib/utils/cn";

// Toggle segmentado (Claro/Escuro) com ícones. Aplica a mudança na hora —
// não precisa de botão de "salvar" porque o tema é persistido localmente.
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema da interface"
      className="flex w-full gap-1 rounded-md border border-border-primary bg-bg-tertiary p-1"
    >
      <Option
        active={theme === "light"}
        onClick={() => setTheme("light")}
        label="Claro"
        icon={<SunIcon className="h-4 w-4" />}
      />
      <Option
        active={theme === "dark"}
        onClick={() => setTheme("dark")}
        label="Escuro"
        icon={<MoonIcon className="h-4 w-4" />}
      />
    </div>
  );
}

function Option({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-bg-primary text-fg-primary shadow-sm"
          : "text-fg-secondary hover:text-fg-primary",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// Reexporta o tipo para consumidores externos (mantém parity com ThemeProvider).
export type { Theme };
