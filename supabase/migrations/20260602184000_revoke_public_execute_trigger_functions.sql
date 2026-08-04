-- Migration: revoke_public_execute_trigger_functions
-- O linter continuava acusando que as funções SECURITY DEFINER eram chamáveis
-- por anon/authenticated mesmo após revogar EXECUTE desses papéis. Causa: ao
-- criar uma função, o Postgres concede EXECUTE a PUBLIC por padrão, e PUBLIC
-- engloba anon/authenticated. A correção é revogar de PUBLIC.
-- Triggers continuam disparando (independem de EXECUTE do papel da sessão).

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.protect_profile_role() from public;
revoke execute on function public.set_updated_at() from public;
