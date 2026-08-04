import { notFound } from "next/navigation";

import { AddLiveSessionButton } from "@/components/admin/AddLiveSessionButton";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { EditableUserNameHeader } from "@/components/admin/EditableUserNameHeader";
import { LiveSessionRowMenu } from "@/components/admin/LiveSessionRowMenu";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { Avatar } from "@/components/shared/Avatar";
import { BackLink } from "@/components/shared/BackLink";
import { Card } from "@/components/ui/Card";
import { SegmentedProgressBar } from "@/components/ui/SegmentedProgressBar";
import { requireAdmin } from "@/lib/admin/guard";
import {
  DAY_LABELS,
  formatStartTime,
  listStudentLiveSessions,
} from "@/lib/live-sessions/queries";
import { getStudentDetail } from "@/lib/professor/queries";

// Mesmo helper de tempo relativo do painel do professor.
function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diffMin = Math.floor((Date.now() - t) / 60_000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `há ${diffD} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role")
    .eq("id", id)
    .maybeSingle();
  if (!student || student.role !== "student") notFound();

  // Professores VINCULADOS a este aluno — única fonte permitida de
  // teacher_id no LiveSessionDialog (o FK composto exige).
  const { data: links } = await supabase
    .from("teacher_students")
    .select(
      "teacher_id, teacher:profiles!teacher_students_teacher_id_fkey(id, full_name, email)",
    )
    .eq("student_id", id);
  const teachers = (links ?? [])
    .map((l) => l.teacher)
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .map((t) => ({ id: t.id, fullName: t.full_name, email: t.email }));

  // getStudentDetail roda como admin (RLS permite via private.is_admin),
  // entao o mesmo helper que o professor usa pra ver seu aluno serve aqui.
  const [sessions, detail] = await Promise.all([
    listStudentLiveSessions(supabase, id),
    getStudentDetail(supabase, id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/admin/alunos" label="Alunos" />

      <Card padded className="flex items-center gap-4">
        <Avatar
          src={student.avatar_url}
          fullName={student.full_name}
          email={student.email}
          size="lg"
        />
        <div className="flex flex-col">
          <EditableUserNameHeader
            id={student.id}
            fullName={student.full_name ?? ""}
            email={student.email}
            role="student"
          />
          <span className="text-sm text-fg-tertiary">{student.email}</span>
        </div>
      </Card>

      {/* KPIs do aluno (XP / streak / maior streak) + progresso por
          curso — mesma visão que /professor/alunos/[studentId]. Só
          renderiza se o aluno tiver detalhe (sempre tem; o detail
          retorna null apenas para profile inexistente). */}
      {detail && (
        <>
          <section className="grid grid-cols-3 gap-3">
            <Card padded className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-fg-primary">
                {detail.totalXp}
              </span>
              <span className="text-xs text-fg-secondary">XP total</span>
            </Card>
            <Card padded className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-2xl font-bold text-fg-primary">
                {detail.currentStreak}
                <FlameIcon className="h-5 w-5 text-warning" />
              </span>
              <span className="text-xs text-fg-secondary">Streak atual</span>
            </Card>
            <Card padded className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-fg-primary">
                {detail.longestStreak}
              </span>
              <span className="text-xs text-fg-secondary">Maior streak</span>
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-fg-primary">
              Progresso por curso
            </h2>
            {detail.courses.length === 0 ? (
              <Card padded>
                <p className="text-sm text-fg-secondary">
                  Este aluno ainda não está matriculado em nenhum curso.
                </p>
              </Card>
            ) : (
              <ul className="flex flex-col gap-3">
                {detail.courses.map((c) => (
                  <li key={c.courseId}>
                    <Card padded className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium text-fg-primary">
                            {c.courseTitle}
                          </span>
                          <span className="shrink-0 rounded-full border border-border-primary px-2.5 py-1 text-xs text-fg-secondary">
                            {c.language.toUpperCase()} ·{" "}
                            {c.level.toUpperCase()}
                          </span>
                        </div>
                        <SegmentedProgressBar
                          value={c.lessonsCompleted}
                          max={Math.max(c.totalLessons, 1)}
                          ariaLabel={`Progresso em ${c.courseTitle}`}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-fg-tertiary">
                          <span>
                            <span className="text-fg-primary">
                              {c.lessonsCompleted}
                            </span>
                            {" / "}
                            {c.totalLessons} lições
                          </span>
                          <span>
                            Última atividade {formatRelative(c.lastActivity)}
                          </span>
                        </div>
                      </div>

                      {/* Quebra por lição — segmentos = partes. Cada
                          segmento preenchido representa uma parte concluída
                          (na ordem de position), então o admin/professor
                          vê QUAIS partes o aluno fez, não só quantas. */}
                      {c.lessons.length > 0 && (
                        <ul className="flex flex-col gap-2 border-t border-border-primary pt-3">
                          {c.lessons.map((l) => (
                            <li key={l.lessonId} className="flex flex-col gap-1">
                              <div className="flex items-baseline justify-between gap-3">
                                <span className="text-sm text-fg-primary">
                                  {l.lessonTitle}
                                </span>
                                <span className="shrink-0 text-xs text-fg-tertiary">
                                  {l.partsCompleted} / {l.totalParts} partes
                                </span>
                              </div>
                              <SegmentedProgressBar
                                value={l.partsCompleted}
                                max={Math.max(l.totalParts, 1)}
                                ariaLabel={`Progresso na lição ${l.lessonTitle}`}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-fg-primary">
              Aulas síncronas
            </h2>
            <p className="text-xs text-fg-tertiary">
              Horários recorrentes com link de acesso.
            </p>
          </div>
          <AddLiveSessionButton studentId={id} teachers={teachers} />
        </div>

        {sessions.length === 0 ? (
          <Card padded>
            <p className="text-sm text-fg-secondary">
              {teachers.length === 0
                ? "Vincule um professor ao aluno em Professores antes de cadastrar aulas."
                : "Nenhuma aula cadastrada. Use o botão acima."}
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col divide-y divide-border-primary rounded-md border border-border-primary [&>li:first-child]:rounded-t-md [&>li:last-child]:rounded-b-md">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 bg-bg-primary px-4 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-fg-primary">
                    {DAY_LABELS[s.dayOfWeek]} · {formatStartTime(s.startTime)}
                  </span>
                  <span className="text-xs text-fg-tertiary">
                    Professor: {s.teacherName ?? "—"}
                  </span>
                  <a
                    href={s.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-brand hover:underline truncate max-w-md"
                  >
                    {s.meetUrl}
                  </a>
                </div>
                <LiveSessionRowMenu
                  studentId={id}
                  teachers={teachers}
                  session={{
                    id: s.id,
                    teacherId: s.teacherId,
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    meetUrl: s.meetUrl,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Zona de perigo no rodapé — botão de excluir o aluno. */}
      <div className="flex justify-end border-t border-border-primary pt-6">
        <DeleteUserButton
          id={student.id}
          fullName={student.full_name ?? ""}
          email={student.email}
          role="student"
        />
      </div>
    </div>
  );
}
