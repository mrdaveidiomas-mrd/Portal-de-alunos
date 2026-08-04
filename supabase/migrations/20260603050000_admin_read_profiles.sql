-- Migration: admin_read_profiles
-- Permite que admins leiam todos os perfis (necessário para gerir matrículas:
-- achar aluno por e-mail e listar matriculados). Mantém o aluno lendo só o
-- próprio perfil. Combinado numa única policy de SELECT para não disparar o
-- aviso de multiple_permissive_policies.

drop policy "profiles_select_own" on public.profiles;

create policy "profiles_select" on public.profiles
  for select
  using ( (select auth.uid()) = id or private.is_admin() );
