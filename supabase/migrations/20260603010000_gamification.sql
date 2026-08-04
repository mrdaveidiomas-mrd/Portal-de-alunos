-- Migration: gamification
-- XP, streak e conquistas. Toda ESCRITA é server-side (trigger ou service_role);
-- alunos apenas LEEM seu estado. Isso evita trapaça de XP.
--
-- Decisões:
--  - xp_events é um ledger append-only; um trigger mantém o agregado
--    (user_gamification) e o streak a cada evento.
--  - user_gamification nasce junto com o profile (trigger).
--  - Streak calculado por data UTC (não guardamos timezone do usuário ainda).
--  - Catálogo de achievements começa vazio (populado por seed/admin depois).

-- =====================================================================
-- Tabelas
-- =====================================================================
create table public.user_gamification (
  user_id            uuid primary key references public.profiles (id) on delete cascade,
  total_xp           integer not null default 0,
  current_streak     integer not null default 0,
  longest_streak     integer not null default 0,
  last_activity_date date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table public.user_gamification is
  'Agregado de gamificação por usuário (XP total, streak). Mantido por trigger a partir de xp_events. Escrita apenas server-side.';

create table public.xp_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  amount     integer not null check (amount <> 0),
  source     text not null,
  part_id    uuid references public.parts (id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.xp_events is
  'Ledger append-only de ganhos/ajustes de XP. source = motivo (ex: part_completed, golden_perfect). Inserido apenas via service_role.';
create index on public.xp_events (user_id);

create table public.achievements (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  title       text not null,
  description text,
  xp_reward   integer not null default 0,
  created_at  timestamptz not null default now()
);
comment on table public.achievements is
  'Catálogo de conquistas. code = identificador estável usado pelo app. Gerido por admin.';

create table public.user_achievements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at      timestamptz not null default now(),
  unique (user_id, achievement_id)
);
create index on public.user_achievements (user_id);

-- =====================================================================
-- Trigger: cria a linha de gamificação junto com o profile.
-- =====================================================================
create function public.handle_new_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_gamification (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_profile() from public;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

-- =====================================================================
-- Trigger: aplica cada xp_event ao agregado (XP + streak).
-- Streak: mesmo dia = mantém; dia seguinte = +1; senão reinicia em 1.
-- =====================================================================
create function public.apply_xp_event()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_today date := (new.created_at at time zone 'utc')::date;
begin
  insert into public.user_gamification
    (user_id, total_xp, current_streak, longest_streak, last_activity_date)
  values (new.user_id, new.amount, 1, 1, v_today)
  on conflict (user_id) do update set
    total_xp = public.user_gamification.total_xp + excluded.total_xp,
    current_streak = case
      when public.user_gamification.last_activity_date = v_today
        then public.user_gamification.current_streak
      when public.user_gamification.last_activity_date = v_today - 1
        then public.user_gamification.current_streak + 1
      else 1
    end,
    last_activity_date = v_today;

  update public.user_gamification
    set longest_streak = greatest(longest_streak, current_streak)
    where user_id = new.user_id;

  return new;
end;
$$;
revoke execute on function public.apply_xp_event() from public;

create trigger on_xp_event_created
  after insert on public.xp_events
  for each row execute function public.apply_xp_event();

-- updated_at em user_gamification (reaproveita public.set_updated_at)
create trigger user_gamification_set_updated_at before update on public.user_gamification
  for each row execute function public.set_updated_at();

-- =====================================================================
-- RLS
-- Leitura: o próprio usuário (e admin). Escrita: nenhuma policy para usuários
-- (acontece via trigger / service_role). O catálogo de achievements é público.
-- =====================================================================
alter table public.user_gamification enable row level security;
create policy "user_gamification_select" on public.user_gamification
  for select using ( user_id = (select auth.uid()) or private.is_admin() );

alter table public.xp_events enable row level security;
create policy "xp_events_select" on public.xp_events
  for select using ( user_id = (select auth.uid()) or private.is_admin() );

alter table public.user_achievements enable row level security;
create policy "user_achievements_select" on public.user_achievements
  for select using ( user_id = (select auth.uid()) or private.is_admin() );

alter table public.achievements enable row level security;
create policy "achievements_select" on public.achievements
  for select using ( true );
create policy "achievements_admin_insert" on public.achievements
  for insert with check ( private.is_admin() );
create policy "achievements_admin_update" on public.achievements
  for update using ( private.is_admin() ) with check ( private.is_admin() );
create policy "achievements_admin_delete" on public.achievements
  for delete using ( private.is_admin() );
