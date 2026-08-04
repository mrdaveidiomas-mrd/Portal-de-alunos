"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

const SECTIONS = [
  { label: "Início", href: "/admin", exact: true },
  { label: "Cursos", href: "/admin/cursos" },
  { label: "Alunos", href: "/admin/alunos" },
  { label: "Professores", href: "/admin/professores" },
] as const;

// Nav superior do admin. Marca a seção ativa pelo prefixo da rota,
// exceto "Início" que precisa de match exato (senão acende sempre).
export function AdminNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="flex items-center gap-1">
      {SECTIONS.map((s) => {
        const exact = "exact" in s && s.exact;
        const active = exact ? pathname === s.href : pathname.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              // Wayfinder: ativo recebe TINT da marca + texto navy (sai
              // claramente do bg #ededed da página, no light). Hover usa
              // bg-tertiary cinza-clarinho — distinto do ativo e do
              // resting (texto secundário em transparente).
              active
                ? "bg-primary-brand-surface font-semibold text-primary-brand"
                : "text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary",
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
