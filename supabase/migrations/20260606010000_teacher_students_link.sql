-- Professores deixam de "cuidar de cursos" e passam a acompanhar alunos
-- específicos. Tabela teacher_students é o vínculo (many-to-many).
-- Admin gerencia; professor lê seus vínculos; aluno vê seus professores.

create table public.teacher_students (
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teacher_id, student_id)
);
comment on table public.teacher_students is
  'Vínculo many-to-many entre professores e alunos acompanhados. Admin gerencia. Substitui courses.teacher_id (ADR 0007).';
create index on public.teacher_students (teacher_id);
create index on public.teacher_students (student_id);

alter table public.teacher_students enable row level security;
create policy "teacher_students_admin_all" on public.teacher_students
  for all using ( private.is_admin() ) with check ( private.is_admin() );
create policy "teacher_students_teacher_select" on public.teacher_students
  for select using ( teacher_id = (select auth.uid()) );
create policy "teacher_students_student_select" on public.teacher_students
  for select using ( student_id = (select auth.uid()) );

-- Helper: auth.uid() é professor de p_student_id?
create function private.is_my_student(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.teacher_students
    where teacher_id = (select auth.uid())
      and student_id = p_student_id
  );
$$;
revoke execute on function private.is_my_student(uuid) from public;

-- Helper: auth.uid() é professor (qualquer)?
create function private.is_teacher()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'teacher'
  );
$$;
revoke execute on function private.is_teacher() from public;

-- is_course_staff vira sinônimo de is_admin (professor não cuida mais de
-- conteúdo). Mantém o nome para não reescrever todas as policies.
create or replace function private.is_course_staff(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_admin();
$$;

-- Professor pode LER conteúdo de qualquer curso publicado (precisa ver
-- onde os alunos estão estudando). Atualiza can_access_course.
create or replace function private.can_access_course(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_admin()
    or (
      private.is_teacher()
      and exists (select 1 from public.courses where id = p_course_id and is_published)
    )
    or (
      private.is_enrolled(p_course_id)
      and exists (select 1 from public.courses where id = p_course_id and is_published)
    );
$$;

-- courses_insert: agora só admin (professor não cria curso).
drop policy if exists "courses_insert" on public.courses;
create policy "courses_insert" on public.courses
  for insert with check ( private.is_admin() );

-- profiles_teacher_select: a antiga lia alunos via courses.teacher_id.
-- Substitui por teacher_students.
drop policy if exists "profiles_teacher_select" on public.profiles;
create policy "profiles_teacher_select" on public.profiles
  for select using ( private.is_my_student(id) );

-- Policies SELECT do professor sobre dados de cada aluno acompanhado.
-- (admin já tem via *_select existente; estes são puramente aditivos).
create policy "user_gamification_teacher_select" on public.user_gamification
  for select using ( private.is_my_student(user_id) );
create policy "xp_events_teacher_select" on public.xp_events
  for select using ( private.is_my_student(user_id) );
create policy "user_achievements_teacher_select" on public.user_achievements
  for select using ( private.is_my_student(user_id) );
create policy "part_progress_teacher_select" on public.part_progress
  for select using ( private.is_my_student(user_id) );
create policy "enrollments_teacher_select" on public.enrollments
  for select using ( private.is_my_student(user_id) );
create policy "exercise_attempts_teacher_select" on public.exercise_attempts
  for select using ( private.is_my_student(user_id) );
create policy "speaking_attempts_teacher_select" on public.speaking_attempts
  for select using ( private.is_my_student(user_id) );
create policy "review_marks_teacher_select" on public.review_marks
  for select using ( private.is_my_student(user_id) );
create policy "srs_items_teacher_select" on public.srs_items
  for select using ( private.is_my_student(user_id) );

-- Drop a função antiga que dependia de courses.teacher_id.
drop function if exists private.is_course_teacher(uuid);

-- Finalmente, drop a coluna courses.teacher_id (e seu index).
alter table public.courses drop column if exists teacher_id;
