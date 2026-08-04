-- O trigger protect_profile_role() impede que usuários não-admin troquem
-- o role de qualquer conta. Mas o admin client server-side (service_role)
-- também era barrado porque, dentro do trigger security definer,
-- auth.uid() é NULL para chamadas via service_role.
--
-- Esta migração adiciona o bypass: se a chamada vem com JWT de service_role
-- (current_setting request.jwt.claims), a troca de role passa. Isso libera
-- as Server Actions admin (createTeacher, updateUser) a alterar o role.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_role text;
begin
  if new.role is not distinct from old.role then
    return new;
  end if;

  -- Bypass quando a chamada chega com JWT de service_role (Server Actions
  -- admin via createAdminClient()).
  begin
    jwt_role := current_setting('request.jwt.claims', true)::json->>'role';
  exception when others then
    jwt_role := null;
  end;
  if jwt_role = 'service_role' then
    return new;
  end if;

  -- Caminho clássico: o caller é admin → permite.
  if exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  ) then
    return new;
  end if;

  -- Caso contrário, reverte silenciosamente (mantém old.role).
  new.role := old.role;
  return new;
end;
$$;
