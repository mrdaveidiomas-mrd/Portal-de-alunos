-- Migration: teacher_read_student_profiles
-- Estende a policy de SELECT em profiles: além de self/admin, o professor agora
-- lê o perfil dos alunos matriculados em cursos onde ele é o teacher_id. Sem
-- isso, o dashboard do professor não conseguiria mostrar nome/e-mail dos alunos.

create function private.teaches_user(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.user_id = p_user_id
      and c.teacher_id = (select auth.uid())
  );
$$;

drop policy "profiles_select" on public.profiles;

create policy "profiles_select" on public.profiles
  for select
  using (
    (select auth.uid()) = id
    or private.is_admin()
    or private.teaches_user(id)
  );
