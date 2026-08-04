import Link from "next/link";

import { Avatar } from "@/components/shared/Avatar";
import { Card } from "@/components/ui/Card";
import { SegmentedProgressBar } from "@/components/ui/SegmentedProgressBar";
import { requireAdmin } from "@/lib/admin/guard";
import {
  getAdminOverview,
  getRecentlyActiveStudents,
  type AdminStudentRow,
} from "@/lib/admin/queries";

// Mesmo helper de tempo relativo que o painel do professor usa.
// Duplicado aqui pra evitar uma viagem ao /shared/utils só por isso.
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

// Home do admin: 4 cards de visão geral + lista dos alunos mais ativos
// recentemente (mesmo card do painel do professor). Cada card é clicável
// e leva à página correspondente.
export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const [overview, recentStudents] = await Promise.all([
    getAdminOverview(supabase),
    getRecentlyActiveStudents(supabase, 5),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {/* <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-fg-primary">Visão geral</h1>
      </div> */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatLink
          href="/admin/alunos"
          label="Alunos matriculados"
          value={overview.enrolledStudents}
          hint="Com matrícula ativa"
          icon={<UsersIcon />}
        />
        <StatLink
          href="/admin/alunos"
          label="Alunos ativos"
          value={overview.activeStudents}
          hint="Últimos 7 dias"
          icon={<ActivityIcon />}
        />
        <StatLink
          href="/admin/professores"
          label="Professores"
          value={overview.teachers}
          hint={overview.teachers === 1 ? "Cadastrado" : "Cadastrados"}
          icon={<TeacherIcon />}
        />
        <StatLink
          href="/admin/cursos"
          label="Cursos"
          value={overview.courses}
          hint={
            overview.publishedCourses === 1
              ? "1 publicado"
              : `${overview.publishedCourses} publicados`
          }
          icon={<BookIcon />}
        />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-fg-primary">
            Atividade recente
          </h2>
        </div>

        {recentStudents.length === 0 ? (
          <Card padded>
            <p className="text-sm text-fg-secondary">
              Nenhum aluno cadastrado ainda.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {recentStudents.map((s) => (
              <li key={s.userId}>
                <StudentRowCard student={s} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatLink({
  href,
  label,
  value,
  hint,
  icon,
}: {
  href: string;
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="block">
      <Card padded interactive className="flex h-full flex-col gap-2 p-8">
        <div className="flex items-start justify-between gap-3">
          <span className="text-4xl font-bold text-fg-primary">{value}</span>
          {/* Badge circular com o ícone — surface da marca um passo mais
              saturada (brand-lighter = #c5d8f8 no light) pra ter contraste
              visível contra o card branco. No dark cai em rgba translúcida
              da marca — mesma régua do empty da barra de progresso. */}
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-brand-lighter text-primary-brand">
            {icon}
          </span>
        </div>
        <span className="text-base font-medium text-fg-primary">{label}</span>
        <span className="text-sm text-fg-tertiary">{hint}</span>
      </Card>
    </Link>
  );
}

// Ícones inline (SVG outline 24x24) — só usados aqui, sem dependência
// nova em /icons.
function svgProps() {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className: "h-5 w-5",
  };
}

function UsersIcon() {
  // Grupo de pessoas — alunos matriculados.
  return (
    <svg {...svgProps()}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ActivityIcon() {
  // Linha de pulso — alunos ativos / atividade recente.
  return (
    <svg {...svgProps()}>
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </svg>
  );
}

function TeacherIcon() {
  // Chapéu de formatura — professores.
  return (
    <svg {...svgProps()}>
      <path d="M2 9 12 4l10 5-10 5L2 9z" />
      <path d="M6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4" />
      <path d="M22 9v5" />
    </svg>
  );
}

function BookIcon() {
  // Livro aberto — cursos.
  return (
    <svg {...svgProps()}>
      <path d="M4 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z" />
      <path d="M20 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H20z" />
    </svg>
  );
}

// Mesmo formato visual do card de aluno no painel do professor —
// /professor/alunos/page.tsx. Link vai pra detalhe administrativo
// (/admin/alunos/[id]).
function StudentRowCard({ student: s }: { student: AdminStudentRow }) {
  return (
    <Link href={`/admin/alunos/${s.userId}`} className="block">
      <Card
        padded
        interactive
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <Avatar
            src={s.avatarUrl}
            fullName={s.fullName}
            email={s.email}
            size="md"
          />
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
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <span className="text-sm text-fg-secondary">
            <span className="text-fg-primary">{s.lessonsCompleted}</span> /{" "}
            {s.totalLessons || "—"} lições
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
  );
}
