import Link from "next/link";

import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { UserRowMenu } from "@/components/admin/UserRowMenu";
import { Avatar } from "@/components/shared/Avatar";
import { Card } from "@/components/ui/Card";
import { requireAdmin } from "@/lib/admin/guard";

export default async function AdminTeachersPage() {
  const { supabase } = await requireAdmin();

  const [{ data: profiles }, { data: links }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, created_at")
      .eq("role", "teacher")
      .order("created_at", { ascending: false }),
    supabase.from("teacher_students").select("teacher_id"),
  ]);

  // Conta quantos alunos cada professor acompanha — exibido como hint
  // na lista, para o admin ter contexto sem precisar abrir o detalhe.
  const studentCountByTeacher = new Map<string, number>();
  for (const link of links ?? []) {
    studentCountByTeacher.set(
      link.teacher_id,
      (studentCountByTeacher.get(link.teacher_id) ?? 0) + 1,
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg-primary">Professores</h1>
          <p className="text-sm text-fg-secondary">
            Gerencie as contas e login dos professores.
          </p>
        </div>
        <CreateUserDialog role="teacher" />
      </div>

      <section className="flex flex-col gap-3">
        {(profiles ?? []).length === 0 ? (
          <Card padded>
            <p className="text-sm text-fg-secondary">
              Nenhum professor cadastrado ainda.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col divide-y divide-border-primary rounded-md border border-border-primary [&>li:first-child]:rounded-t-md [&>li:last-child]:rounded-b-md">
            {(profiles ?? []).map((p) => {
              const count = studentCountByTeacher.get(p.id) ?? 0;
              return (
                <li
                  key={p.id}
                  className="flex items-stretch bg-bg-secondary"
                >
                  <Link
                    href={`/admin/professores/${p.id}`}
                    className="group flex flex-1 items-center justify-between gap-3 px-4 py-2 transition-colors hover:bg-primary-brand-surface"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        src={p.avatar_url}
                        fullName={p.full_name}
                        email={p.email}
                        size="sm"
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium text-fg-primary transition-colors group-hover:text-primary-brand">
                          {p.full_name ?? "—"}
                        </span>
                        <span className="text-xs text-fg-tertiary">
                          {p.email}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-fg-tertiary">
                      {count}{" "}
                      {count === 1 ? "aluno vinculado" : "alunos vinculados"}
                    </span>
                  </Link>
                  <div className="flex items-center pr-2">
                    <UserRowMenu
                      id={p.id}
                      fullName={p.full_name ?? ""}
                      email={p.email}
                      role="teacher"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
