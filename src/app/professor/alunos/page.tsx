import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { SegmentedProgressBar } from "@/components/ui/SegmentedProgressBar";
import { getMyStudents } from "@/lib/professor/queries";
import { requireTeacher } from "@/lib/professor/guard";

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffMin = Math.floor((now - t) / 60_000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `há ${diffD} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function ProfessorStudentsPage() {
  const { supabase, userId } = await requireTeacher();
  const students = await getMyStudents(supabase, userId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-fg-primary">Meus alunos</h1>
        <p className="text-sm text-fg-secondary">
          Acompanhe o progresso dos alunos que você é responsável.
        </p>
      </div>

      {students.length === 0 ? (
        <Card padded>
          <p className="text-sm text-fg-secondary">
            Você ainda não tem nenhum aluno vinculado. Peça ao admin para
            associar alunos ao seu perfil.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {students.map((s) => (
            <li key={s.userId}>
              <Link href={`/professor/alunos/${s.userId}`} className="block">
                <Card
                  padded
                  interactive
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-fg-primary">
                      {s.fullName ?? s.email}
                    </span>
                    {s.fullName && (
                      <span className="text-xs text-fg-tertiary">{s.email}</span>
                    )}
                    <span className="mt-1 text-xs text-fg-tertiary">
                      {s.enrolledCourses}{" "}
                      {s.enrolledCourses === 1 ? "curso" : "cursos"} ·
                      última atividade {formatRelative(s.lastActivity)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <span className="text-sm text-fg-secondary">
                      <span className="text-fg-primary">
                        {s.lessonsCompleted}
                      </span>{" "}
                      / {s.totalLessons || "—"} lições
                    </span>
                    {s.totalLessons > 0 && (
                      <div className="w-40">
                        <SegmentedProgressBar
                          value={s.lessonsCompleted}
                          max={s.totalLessons}
                          ariaLabel="Progresso geral em lições"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
