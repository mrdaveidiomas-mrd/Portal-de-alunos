"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { GearIcon } from "@/components/icons/GearIcon";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { label: "Módulos", segment: "modulos" },
  { label: "Matrículas", segment: "matriculas" },
] as const;

// Abas dentro do curso. Cada aba tem rota própria (linkável e previsível).
// "Config" vira ícone de engrenagem à direita — ação secundária, não
// compete com "Módulos"/"Matrículas" pelo foco visual.
export function CourseTabs({ courseId }: { courseId: string }) {
  const pathname = usePathname() ?? "";
  const configHref = `/admin/cursos/${courseId}/config`;
  const configActive = pathname.startsWith(configHref);

  return (
    <nav
      role="tablist"
      className="flex items-stretch justify-between border-b border-border-primary"
      aria-label="Seções do curso"
    >
      <div className="flex">
        {TABS.map((t) => {
          const href = `/admin/cursos/${courseId}/${t.segment}`;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={t.segment}
              href={href}
              role="tab"
              aria-selected={active}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-fg-primary text-fg-primary"
                  : "border-transparent text-fg-secondary hover:text-fg-primary",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <Link
        href={configHref}
        role="tab"
        aria-selected={configActive}
        aria-label="Configurações do curso"
        title="Configurações do curso"
        className={cn(
          "-mb-px flex items-center border-b-2 px-3 py-2 transition-colors",
          configActive
            ? "border-fg-primary text-fg-primary"
            : "border-transparent text-fg-secondary hover:text-fg-primary",
        )}
      >
        <GearIcon className="h-4 w-4" />
      </Link>
    </nav>
  );
}
