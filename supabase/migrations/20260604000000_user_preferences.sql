-- Migration: user_preferences
-- Preferências do usuário. Por ora: voz preferida do TTS por idioma + velocidade
-- de fala. Aluno gerencia as próprias prefs; o valor é aplicado pela Edge
-- Function tts (com fallback para defaults quando ausente/inválido).

create table public.user_preferences (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  tts_voice_en    text,
  tts_voice_es    text,
  tts_rate        numeric(3, 2),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "user_preferences_select" on public.user_preferences
  for select using ( user_id = (select auth.uid()) );

create policy "user_preferences_insert" on public.user_preferences
  for insert with check ( user_id = (select auth.uid()) );

create policy "user_preferences_update" on public.user_preferences
  for update using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );

create trigger user_preferences_set_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();
