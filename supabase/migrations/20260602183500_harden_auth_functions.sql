-- Migration: harden_auth_functions
-- Correções de segurança apontadas pelo database linter após auth_foundation:
--   1. set_updated_at sem search_path fixo (function_search_path_mutable).
--   2. Funções de trigger SECURITY DEFINER expostas como RPC público
--      (anon/authenticated podem chamá-las via /rest/v1/rpc/...).
-- Triggers continuam disparando normalmente após revogar EXECUTE: o mecanismo
-- de trigger não exige privilégio EXECUTE do papel da sessão.

-- 1. Fixar search_path da função de updated_at.
alter function public.set_updated_at() set search_path = '';

-- 2. Tirar as funções de trigger da API RPC pública.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.protect_profile_role() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
