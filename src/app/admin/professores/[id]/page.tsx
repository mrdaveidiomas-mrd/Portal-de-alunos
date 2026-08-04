import { notFound } from "next/navigation";

import { AssignStudentDialog } from "@/components/admin/AssignStudentDialog";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { EditableUserNameHeader } from "@/components/admin/EditableUserNameHeader";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { Avatar } from "@/components/shared/Avatar";
import { BackLink } from "@/components/shared/BackLink";
import { ConfirmForm } from "@/components/shared/ConfirmForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { unassignStudentFromTeacher } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/admin/guard";

export default async function AdminTeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: teacherId } = await params;
  const { supabase } = await requireAdmin();

  // 1. Professor.
  const { data: teacher } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role")
    .eq("id", teacherId)
    .maybeSingle();
  if (!teacher || teacher.role !== "teacher") notFound();

  // 2. Alunos já vinculados.
  const { data: links } = await supabase
    .from("teacher_students")
    .select("student_id")
    .eq("teacher_id", teacherId);
  const assignedIds = new Set((links ?? []).map((l) => l.student_id));

  // 3. Todos os alunos cadastrados (role=student) — para dividir entre
  //    "já vinculado" e "disponível para vincular".
  const { data: students } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const assigned = (students ?? []).filter((s) => assignedIds.has(s.id));
  const available = (students ?? []).filter((s) => !assignedIds.has(s.id));

  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/admin/professores" label="Professores" />

      <Card padded className="flex items-center gap-4">
        <Avatar
          src={teacher.avatar_url}
          fullName={teacher.full_name}
          email={teacher.email}
          size="lg"
        />
        <div className="flex flex-col">
          <EditableUserNameHeader
            id={teacher.id}
            fullName={teacher.full_name ?? ""}
            email={teacher.email}
            role="teacher"
            fallback={teacher.email}
          />
          <span className="text-sm text-fg-tertiary">{teacher.email}</span>
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-fg-primary">
              Alunos acompanhados
            </h2>
            <p className="text-sm text-fg-secondary">
              Este professor pode ver o progresso de cada aluno listado aqui.
            </p>
          </div>
          <AssignStudentDialog
            teacherId={teacher.id}
            available={available.map((s) => ({
              id: s.id,
              email: s.email,
              fullName: s.full_name,
              avatarUrl: s.avatar_url,
            }))}
          />
        </div>

        {assigned.length === 0 ? (
          <Card padded>
            <p className="text-sm text-fg-secondary">
              Nenhum aluno vinculado ainda. Use o botão{" "}
              <strong>Vincular aluno</strong> acima para começar.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col divide-y divide-border-primary rounded-md border border-border-primary [&>li:first-child]:rounded-t-md [&>li:last-child]:rounded-b-md">
            {assigned.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 bg-bg-secondary px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={s.avatar_url}
                    fullName={s.full_name}
                    email={s.email}
                    size="sm"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-fg-primary">
                      {s.full_name ?? "—"}
                    </span>
                    <span className="text-xs text-fg-tertiary">{s.email}</span>
                  </div>
                </div>
                <ConfirmForm
                  action={unassignStudentFromTeacher}
                  title="Remover vínculo"
                  message={`Remover ${s.full_name ?? s.email} dos alunos de ${teacher.full_name ?? teacher.email}? O professor não verá mais o progresso deste aluno.`}
                  confirmLabel="Remover"
                >
                  <input
                    type="hidden"
                    name="teacher_id"
                    value={teacher.id}
                  />
                  <input type="hidden" name="student_id" value={s.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    aria-label="Remover vínculo"
                    title="Remover vínculo"
                    className="text-danger hover:bg-danger-bg"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </ConfirmForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Zona de perigo no rodapé — botão de excluir o professor. */}
      <div className="flex justify-end border-t border-border-primary pt-6">
        <DeleteUserButton
          id={teacher.id}
          fullName={teacher.full_name ?? ""}
          email={teacher.email}
          role="teacher"
        />
      </div>
    </div>
  );
}
