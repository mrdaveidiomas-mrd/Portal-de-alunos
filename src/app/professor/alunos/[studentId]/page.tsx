import { notFound } from "next/navigation";

import { FlameIcon } from "@/components/icons/FlameIcon";
import { EditMeetUrlButton } from "@/components/professor/EditMeetUrlButton";
import { Avatar } from "@/components/shared/Avatar";
import { BackLink } from "@/components/shared/BackLink";
import { Card } from "@/components/ui/Card";
import { SegmentedProgressBar } from "@/components/ui/SegmentedProgressBar";
import {
  DAY_LABELS,
  formatStartTime,
  listStudentLiveSessions,
} from "@/lib/live-sessions/queries";
import { getStudentDetail } from "@/lib/professor/queries";
import { requireTeacher } from "@/lib/professor/guard";

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

export default async function ProfessorStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { supabase } = await requireTeacher();

  const [detail, sessions] = await Promise.all([
    getStudentDetail(supabase, studentId),
    // RLS filtra pra somente as aulas onde teacher_id = professor logado.
    // Admin vê todas; professor vê apenas as próprias.
    listStudentLiveSessions(supabase, studentId),
  ]);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <BackLink href="/professor/alunos" label="Meus alunos" />
        <div className="flex items-center gap-4">
          <Avatar
            src={detail.avatarUrl}
            fullName={detail.fullName}
            email={detail.email}
            size="lg"
          />
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold text-fg-primary">
              {detail.fullName ?? detail.email}
            </h1>
            {detail.fullName && (
              <span className="text-sm text-fg-secondary">{detail.email}</span>
            )}
          </div>
        </div>
      </div>

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

                  {/* Quebra por lição — segmentos = partes (em ordem). */}
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

      {/* Aulas síncronas onde este professor é responsavel. RLS filtra
          a lista — admin que abrir esta pagina vê todas as aulas; o
          professor vê apenas as próprias. Quem cria/exclui aulas e fixa
          dia/hora segue sendo o admin. Aqui o professor só edita o
          link do Meet (caso o Google gere um link novo, etc.). */}
      {sessions.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-fg-primary">
              Aulas síncronas
            </h2>
            <p className="text-xs text-fg-tertiary">
              Horários recorrentes com link de acesso.
            </p>
          </div>
          <ul className="flex flex-col divide-y divide-border-primary rounded-md border border-border-primary [&>li:first-child]:rounded-t-md [&>li:last-child]:rounded-b-md">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 bg-bg-secondary px-4 py-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium text-fg-primary">
                    {DAY_LABELS[s.dayOfWeek]} · {formatStartTime(s.startTime)}
                  </span>
                  <a
                    href={s.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-xs text-primary-brand hover:underline"
                  >
                    {s.meetUrl}
                  </a>
                </div>
                <EditMeetUrlButton
                  sessionId={s.id}
                  initialMeetUrl={s.meetUrl}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
