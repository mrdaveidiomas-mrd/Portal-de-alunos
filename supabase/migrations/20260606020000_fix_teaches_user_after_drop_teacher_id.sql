-- Bug: a função private.teaches_user(p_user_id) ainda referenciava
-- courses.teacher_id, coluna apagada pela migration de teacher_students.
-- Resultado: a policy profiles_select (que usa teaches_user) explodia e
-- o SELECT em profiles retornava 0 linhas para todos os usuários — admins
-- inclusive não conseguiam ler o próprio perfil, e por isso o redirect de
-- login não detectava role=admin.
--
-- Correção: reescreve teaches_user para usar a tabela teacher_students.

create or replace function private.teaches_user(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.teacher_students
    where teacher_id = (select auth.uid())
      and student_id = p_user_id
  );
$$;
revoke execute on function private.teaches_user(uuid) from public;
