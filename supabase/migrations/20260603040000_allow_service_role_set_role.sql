-- Migration: allow_service_role_set_role
-- Ajusta o trigger protect_profile_role: a versão anterior revertia QUALQUER
-- mudança de role quando auth.uid() era nulo, impedindo o bootstrap do primeiro
-- admin e a gestão de papéis server-side (service_role).
--
-- Nova regra: só reverte quando há um usuário autenticado NÃO-admin tentando a
-- mudança. Contexto sem JWT (auth.uid() nulo = service_role / migrations) é
-- confiável e pode alterar o role. O anon nunca chega aqui (a RLS de UPDATE
-- exige auth.uid() = id, barrando-o antes do trigger).

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if (select auth.uid()) is not null
      and not exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
      )
    then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;
