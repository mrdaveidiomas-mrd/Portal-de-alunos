-- Migration: exercises
-- Suporte à correção de exercícios sem vazar o gabarito.
--  - exercise_solutions: gabarito por bloco de exercício. RLS deixa só staff
--    ler/escrever; alunos NÃO têm policy -> a correção lê via service_role.
--  - exercise_attempts: tentativas do aluno (para dar XP uma vez e calcular
--    estrelas). Escrita só via service_role (aluno não pode se declarar certo).

create table public.exercise_solutions (
  block_id   uuid primary key references public.blocks (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  solution   jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.exercise_solutions is
  'Gabarito de cada bloco de exercício. Fora do alcance do aluno (sem policy de SELECT para ele); a correção lê via service_role.';
create index on public.exercise_solutions (course_id);

alter table public.exercise_solutions enable row level security;
create policy "exercise_solutions_select" on public.exercise_solutions
  for select using ( private.is_course_staff(course_id) );
create policy "exercise_solutions_insert" on public.exercise_solutions
  for insert with check ( private.is_course_staff(course_id) );
create policy "exercise_solutions_update" on public.exercise_solutions
  for update using ( private.is_course_staff(course_id) )
  with check ( private.is_course_staff(course_id) );
create policy "exercise_solutions_delete" on public.exercise_solutions
  for delete using ( private.is_course_staff(course_id) );

create trigger exercise_solutions_set_updated_at before update on public.exercise_solutions
  for each row execute function public.set_updated_at();

create table public.exercise_attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  block_id         uuid not null references public.blocks (id) on delete cascade,
  part_id          uuid not null references public.parts (id) on delete cascade,
  course_id        uuid not null references public.courses (id) on delete cascade,
  attempts         integer not null default 0,
  solved           boolean not null default false,
  solved_first_try boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, block_id)
);
comment on table public.exercise_attempts is
  'Tentativas do aluno por bloco de exercício. Escrita só via service_role (na correção), evitando auto-declaração de acerto.';
create index on public.exercise_attempts (block_id);
create index on public.exercise_attempts (part_id);
create index on public.exercise_attempts (course_id);

alter table public.exercise_attempts enable row level security;
-- Aluno lê as próprias tentativas; staff lê as dos seus cursos. Sem policy de
-- escrita para aluno: a correção grava via service_role.
create policy "exercise_attempts_select" on public.exercise_attempts
  for select using (
    user_id = (select auth.uid()) or private.is_course_staff(course_id)
  );

create trigger exercise_attempts_set_updated_at before update on public.exercise_attempts
  for each row execute function public.set_updated_at();
