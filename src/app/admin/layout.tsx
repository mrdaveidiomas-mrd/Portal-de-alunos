import Link from "next/link";

import { AdminNav } from "@/components/admin/AdminNav";
import { GearIcon } from "@/components/icons/GearIcon";
import { Logo } from "@/components/shared/Logo";
import { requireAdmin } from "@/lib/admin/guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border-primary">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm font-semibold text-fg-primary"
            >
              <Logo className="h-7 w-7" />
              Admin · Portal
            </Link>
            <AdminNav />
          </div>
          <Link
            href="/admin/configuracoes"
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
