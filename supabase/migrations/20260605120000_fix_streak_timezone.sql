-- =====================================================================
-- Fix: streak calculado em UTC desconsiderava prática noturna em BRT.
--
-- O trigger public.apply_xp_event() resolvia o "dia da prática" como
-- (created_at at time zone 'utc')::date. Para um aluno em São Paulo
-- (UTC-3), qualquer atividade após 21h local cai no dia seguinte em
-- UTC. Resultado: o trigger achava que dias consecutivos no fuso do
-- aluno tinham um "buraco" no meio e zerava o streak.
--
-- Correção: resolver o dia local em 'America/Sao_Paulo' (fuso fixo
-- enquanto o produto é Brasil-only; trocável centralmente quando for
-- preciso suportar outros TZs).
--
-- Backfill: como o trigger só dispara em inserts novos, recomputamos
-- user_gamification.current_streak / longest_streak / last_activity_date
-- a partir do histórico de xp_events usando o mesmo fuso, para que os
-- valores fiquem coerentes com o calendário renderizado.
-- =====================================================================

-- 1) Trigger function: usar America/Sao_Paulo no lugar de UTC.
create or replace function public.apply_xp_event()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_today date := (new.created_at at time zone 'America/Sao_Paulo')::date;
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

-- 2) Backfill: recomputa streaks a partir de xp_events em BRT.
--    Truque "islands": dias consecutivos compartilham (d - row_number).
--    longest = maior tamanho de run; current = tamanho da run cuja
--    última data é hoje ou ontem (BRT). Senão, current = 0.
with daily as (
  select
    user_id,
    (created_at at time zone 'America/Sao_Paulo')::date as d
  from public.xp_events
  group by user_id, (created_at at time zone 'America/Sao_Paulo')::date
),
ranked as (
  select
    user_id,
    d,
    d - (row_number() over (partition by user_id order by d))::int as grp
  from daily
),
runs as (
  select
    user_id,
    grp,
    count(*)::int as run_len,
    max(d) as last_d
  from ranked
  group by user_id, grp
),
agg as (
  select
    user_id,
    max(run_len) as longest,
    max(last_d) as last_activity,
    coalesce((
      select r2.run_len
      from runs r2
      where r2.user_id = runs.user_id
        and r2.last_d >= (now() at time zone 'America/Sao_Paulo')::date - 1
      order by r2.last_d desc
      limit 1
    ), 0) as current
  from runs
  group by user_id
)
update public.user_gamification g
set
  current_streak     = agg.current,
  longest_streak     = greatest(g.longest_streak, agg.longest),
  last_activity_date = agg.last_activity,
  updated_at         = now()
from agg
where g.user_id = agg.user_id;
