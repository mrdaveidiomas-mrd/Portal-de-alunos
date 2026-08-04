-- Migration: review_marks
-- Marcação manual de partes para o aluno revisitar depois. course_id é
-- desnormalizado para o staff ler pelos seus cursos (RLS simétrica ao
-- part_progress).

create table public.review_marks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  part_id    uuid not null references public.parts (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now(),
  unique (user_id, part_id)
);
comment on table public.review_marks is
  'Partes que o aluno marcou para revisar mais tarde. Uma marca por (aluno, parte).';

create index on public.review_marks (user_id);
create index on public.review_marks (part_id);
create index on public.review_marks (course_id);

alter table public.review_marks enable row level security;

-- Aluno vê/edita as próprias marcações; staff (admin/professor do curso) vê.
create policy "review_marks_select" on public.review_marks
  for select using (
    user_id = (select auth.uid()) or private.is_course_staff(course_id)
  );

create policy "review_marks_insert" on public.review_marks
  for insert with check (
    user_id = (select auth.uid()) and private.is_enrolled(course_id)
  );

create policy "review_marks_delete" on public.review_marks
  for delete using ( user_id = (select auth.uid()) );

create policy "review_marks_update" on public.review_marks
  for update using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );
