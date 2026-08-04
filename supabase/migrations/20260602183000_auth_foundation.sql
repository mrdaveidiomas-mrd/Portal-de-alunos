-- Migration: auth_foundation
-- Fundação de autenticação do Portal de Alunos.
-- Cria o enum de papéis, a tabela `profiles` (espelho 1:1 de auth.users),
-- os triggers de criação no signup / proteção do role / updated_at, e as
-- políticas RLS. Sem dados de conteúdo ainda (isso vem em migrations futuras).

-- =====================================================================
-- 1. Enum de papéis do usuário
-- =====================================================================
create type public.user_role as enum ('student', 'teacher', 'admin');

-- =====================================================================
-- 2. Tabela de perfis
--    1:1 com auth.users. Guarda dados de aplicação e o papel (role).
-- =====================================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.user_role not null default 'student',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil de aplicação de cada usuário autenticado (1:1 com auth.users). O campo role distingue student/teacher/admin e é a base da autorização via RLS.';

-- =====================================================================
-- 3. RLS
--    Habilitar RLS sem políticas = negado por padrão. Abrimos só o
--    necessário. Professores/admins ganham leitura ampliada em migrations
--    futuras (quando existirem matrículas e a relação aluno-professor).
-- =====================================================================
alter table public.profiles enable row level security;

-- SELECT: cada usuário lê apenas o próprio perfil.
-- (select auth.uid()) é avaliado uma vez (initplan) — recomendação de perf.
create policy "profiles_select_own"
  on public.profiles
  for select
  using ( (select auth.uid()) = id );

-- UPDATE: cada usuário atualiza apenas o próprio perfil. A proteção do
-- campo `role` é feita pelo trigger protect_profile_role (abaixo), pois RLS
-- não compara valor antigo x novo de uma coluna.
create policy "profiles_update_own"
  on public.profiles
  for update
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- Sem políticas de INSERT/DELETE para usuários: perfis nascem via trigger
-- (SECURITY DEFINER) e são removidos por cascata ao apagar auth.users.

-- =====================================================================
-- 4. Trigger: cria o perfil automaticamente no signup.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =====================================================================
-- 5. Trigger: impede escalonamento de privilégio.
--    Um usuário comum não pode alterar o próprio `role`; apenas perfis
--    com role = 'admin' conseguem alterar o campo. Para os demais, o valor
--    é silenciosamente revertido ao anterior.
-- =====================================================================
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role = 'admin'
    ) then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_update
  before update on public.profiles
  for each row
  execute function public.protect_profile_role();

-- =====================================================================
-- 6. Trigger: mantém updated_at em dia.
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
