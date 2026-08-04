-- =====================================================================
-- Aulas síncronas (live) por aluno.
--
-- Cada registro representa um HORÁRIO RECORRENTE de aula síncrona entre
-- um professor e um aluno: dia da semana + hora + link do Meet. O admin
-- cadastra/edita pela página do aluno. Aluno e professor vinculado leem
-- pela própria sessão (RLS).
--
-- O par (student_id, teacher_id) precisa existir em teacher_students —
-- ou seja, só dá pra agendar aula entre dupla já vinculada. Esse vínculo
-- é gerenciado pelo admin em /admin/professores/[id].
-- =====================================================================

create table public.student_live_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  -- 0=domingo, 1=segunda, ..., 6=sábado (compatível com Date.getDay()
  -- em JS, o que evita conversões no cliente).
  day_of_week smallint not null check (day_of_week between 0 and 6),
  -- Hora local (sem fuso) — o produto resolve em America/Sao_Paulo no
  -- momento de computar "próxima ocorrência". Quando suportar outros
  -- fusos, basta acrescentar uma coluna timezone.
  start_time time not null,
  meet_url text not null check (length(meet_url) between 5 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Garante que o par é um vínculo válido em teacher_students.
  constraint student_live_sessions_link_fk
    foreign key (teacher_id, student_id)
    references public.teacher_students (teacher_id, student_id)
    on delete cascade
);

create index student_live_sessions_student_idx
  on public.student_live_sessions (student_id, day_of_week, start_time);
create index student_live_sessions_teacher_idx
  on public.student_live_sessions (teacher_id, day_of_week, start_time);

-- updated_at automático.
create trigger student_live_sessions_set_updated_at
before update on public.student_live_sessions
for each row execute function public.set_updated_at();

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.student_live_sessions enable row level security;

-- Admin: tudo (CRUD).
create policy student_live_sessions_admin_all
  on public.student_live_sessions
  for all
  using (private.is_admin())
  with check (private.is_admin());

-- Aluno: lê apenas as próprias aulas. Sem insert/update/delete — só admin.
create policy student_live_sessions_student_select
  on public.student_live_sessions
  for select
  using (student_id = (select auth.uid()));

-- Professor: lê apenas as aulas que ele dá. Útil para uma futura agenda
-- do professor; até lá fica como acesso passivo.
create policy student_live_sessions_teacher_select
  on public.student_live_sessions
  for select
  using (teacher_id = (select auth.uid()));

comment on table public.student_live_sessions is
  'Horários recorrentes de aulas síncronas por aluno (admin cadastra).';
