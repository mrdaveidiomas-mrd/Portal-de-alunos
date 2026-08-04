-- Migration: progress
-- Progresso do aluno por parte (part_progress). Granularidade atômica = parte;
-- progresso de lição/módulo é derivável a partir daqui. Estrelas (1-3) e score
-- por parte (ADR sobre estrelas/desempenho). XP/streak/conquistas ficam para a
-- migration de gamificação (passo seguinte).

create type public.progress_status as enum ('in_progress', 'completed');

create table public.part_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  part_id      uuid not null references public.parts (id) on delete cascade,
  course_id    uuid not null references public.courses (id) on delete cascade,
  status       public.progress_status not null default 'in_progress',
  stars        smallint not null default 0 check (stars between 0 and 3),
  score        smallint check (score between 0 and 100),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, part_id)
);
comment on table public.part_progress is
  'Progresso de um aluno em uma parte: status, estrelas (0-3) e score (0-100). course_id desnormalizado para RLS de staff.';

create index on public.part_progress (user_id);
create index on public.part_progress (part_id);
create index on public.part_progress (course_id);

alter table public.part_progress enable row level security;

-- Aluno vê o próprio progresso; staff vê o progresso nos seus cursos
-- (base para o dashboard do professor, fase futura).
create policy "part_progress_select" on public.part_progress
  for select using (
    user_id = (select auth.uid()) or private.is_course_staff(course_id)
  );

-- Aluno registra/atualiza apenas o próprio progresso, e só em curso em que
-- está matriculado.
create policy "part_progress_insert" on public.part_progress
  for insert with check (
    user_id = (select auth.uid()) and private.is_enrolled(course_id)
  );

create policy "part_progress_update" on public.part_progress
  for update using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );

create trigger part_progress_set_updated_at before update on public.part_progress
  for each row execute function public.set_updated_at();
