-- As funções is_my_student / is_teacher / teaches_user foram criadas com
-- `revoke execute ... from public`. Mas as policies precisam que a role
-- `authenticated` (a que PostgREST usa) consiga executá-las — senão a
-- avaliação da policy falha com "permission denied" e o SELECT retorna
-- zero linhas silenciosamente.
--
-- As outras funções do mesmo schema (is_admin, can_access_course, ...)
-- mantiveram o default PUBLIC EXECUTE; por isso funcionam.
--
-- Como são SECURITY DEFINER, dar EXECUTE para authenticated é seguro:
-- a função só consulta o que precisa (teacher_students / profiles) e
-- retorna boolean — não vaza dados.

grant execute on function private.is_my_student(uuid) to authenticated;
grant execute on function private.is_teacher() to authenticated;
grant execute on function private.teaches_user(uuid) to authenticated;
