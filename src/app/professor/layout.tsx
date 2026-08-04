import Link from "next/link";

import { GearIcon } from "@/components/icons/GearIcon";
import { Logo } from "@/components/shared/Logo";
import { requireTeacher } from "@/lib/professor/guard";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mantém o guard, mas não usamos mais `isAdmin` aqui — os atalhos
  // cross-portal foram retirados (atrapalhavam mais do que ajudavam).
  await requireTeacher();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border-primary">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/professor/alunos"
            className="flex items-center gap-2 text-sm font-semibold text-fg-primary"
          >
            <Logo className="h-7 w-7" />
            Professor · Portal
          </Link>
          <Link
            href="/professor/configuracoes"
            aria-label="Configurações"
            title="Configurações"
            className="rounded p-1.5 text-fg-secondary transition-colors hover:bg-bg-secondary hover:text-fg-primary"
          >
            <GearIcon className="h-5 w-5" />
          </Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl px-6 py-8">{children}</div>
    </div>
  );
}
