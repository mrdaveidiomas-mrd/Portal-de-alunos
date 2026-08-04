-- =====================================================================
-- Achievements v2: conjuntos com tiers + coleta manual de recompensa.
--
-- O modelo antigo (5 conquistas individuais, XP creditado automaticamente
-- ao bater a condição) está sendo trocado por:
--
--   - 3 conquistas "standalone" (Primeiro dia, Primeira lição, Primeira
--     marcação) — só 1 tier.
--   - 6 "conjuntos" (Estudante, Sem erros, Hora de relembrar, Período
--     perfeito, Louco por XP, Colecionador de estrelas), cada um com 3
--     tiers — apresentados na UI como UM card que avança conforme o
--     aluno conquista os tiers.
--
--   - XP NÃO é creditado automaticamente: o aluno precisa apertar
--     "Coletar recompensa" na página de conquistas. Por isso introduzimos
--     `user_achievements.claimed_at`. earned_at marca quando atingiu a
--     condição; claimed_at marca quando o XP foi creditado.
--
-- Schema:
--   - achievements ganha `set_code` (null para standalone) e `tier` (1..3).
--   - user_achievements ganha `claimed_at` (nullable).
--   - user_gamification ganha `total_srs_reviews` para alimentar o
--     conjunto "Hora de relembrar" sem precisar de scan agregado em
--     srs_items.
--
-- Limpeza:
--   - Apaga TODAS as user_achievements (catálogo vai ser refeito do zero).
--   - Apaga xp_events com source like 'achievement:%' (XP daquelas
--     conquistas vai voltar a ser obtido via coleta).
--   - Recomputa user_gamification.total_xp a partir do ledger limpo.
--   - Apaga as 5 conquistas antigas do catálogo. O novo catálogo é
--     populado por scripts/seed-achievements.mjs (rode após esta
--     migration).
-- =====================================================================

-- 1) Schema: novas colunas
alter table public.achievements
  add column if not exists set_code text,
  add column if not exists tier smallint check (tier between 1 and 3);

comment on column public.achievements.set_code is
  'Agrupa conquistas em um conjunto progressivo (ex: ''studious'', ''flawless''). null = conquista standalone.';
comment on column public.achievements.tier is
  'Posição no conjunto (1=bronze, 2=prata, 3=ouro). null para standalone.';

create index if not exists achievements_set_code_idx on public.achievements (set_code, tier);

alter table public.user_achievements
  add column if not exists claimed_at timestamptz;

comment on column public.user_achievements.claimed_at is
  'Marca quando o aluno apertou "Coletar recompensa" e o XP foi creditado. null = atingiu mas ainda não coletou.';

alter table public.user_gamification
  add column if not exists total_srs_reviews integer not null default 0;

comment on column public.user_gamification.total_srs_reviews is
  'Contador de revisões SRS feitas (cada chamada de reviewItem incrementa em 1).';

-- 2) Limpeza dos dados antigos
delete from public.user_achievements;
delete from public.xp_events where source like 'achievement:%';
delete from public.achievements;

-- 3) Recompõe total_xp a partir do ledger limpo
update public.user_gamification g
set total_xp = coalesce((
  select sum(amount)::int
  from public.xp_events
  where user_id = g.user_id
), 0);

-- 4) Backfill: total_srs_reviews a partir do que já existe.
--    srs_items.repetitions é o melhor proxy do passado (SM-2 zera em
--    "again", então subestima — mas é o que temos). A partir desta
--    migration, todo novo review incrementa o contador via reviewItem.
update public.user_gamification g
set total_srs_reviews = coalesce((
  select sum(repetitions)::int
  from public.srs_items
  where user_id = g.user_id
), 0);
