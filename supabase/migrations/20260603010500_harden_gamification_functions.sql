-- Migration: harden_gamification_functions
-- As funções de trigger de gamificação continuavam chamáveis como RPC por
-- anon/authenticated: o Supabase concede EXECUTE explicitamente a esses papéis
-- (default privileges no schema public), então revogar só de PUBLIC não basta.
-- Triggers seguem disparando (independem de EXECUTE do papel da sessão).

revoke execute on function public.handle_new_profile() from anon, authenticated;
revoke execute on function public.apply_xp_event() from anon, authenticated;
