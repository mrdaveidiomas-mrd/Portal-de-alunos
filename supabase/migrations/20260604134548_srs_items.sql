-- Migration: srs_items
-- Sistema de revisão espaçada (SM-2 / Anki clássico). Cada linha é um item de
-- revisão pertencente a um aluno, gerado automaticamente por:
--   - exercícios que o aluno errou ou recebeu "quase lá" (uma linha por block)
--   - termos de blocos de vocabulário em partes concluídas (uma linha por termo)
--
-- O algoritmo SM-2 vive na aplicação (src/lib/srs/sm2.ts). Aqui o DB só guarda
-- o estado: ease_factor, interval_days, repetitions e quando revisitar.
--
-- payload (JSONB) guarda tudo que a UI de sessão precisa para renderizar o
-- item sem precisar refazer joins pesados na hora de revisar.

create table public.srs_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  course_id       uuid not null references public.courses (id) on delete cascade,
  -- Origem do item: tipo + id do bloco-fonte + chave secundária opcional
  -- (termo, para vocab; vazio para exercício).
  source_type     text not null check (source_type in ('exercise', 'vocab')),
  source_id       uuid not null,
  source_key      text not null default '',
  payload         jsonb not null,
  -- Estado do SM-2 ---------------------------------------------------------
  ease_factor      numeric(4,2) not null default 2.50 check (ease_factor >= 1.30),
  interval_days    integer      not null default 0    check (interval_days >= 0),
  repetitions      integer      not null default 0    check (repetitions   >= 0),
  next_review_at   timestamptz  not null default now(),
  last_quality     smallint              check (last_quality between 0 and 5),
  last_reviewed_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, source_type, source_id, source_key)
);
comment on table public.srs_items is
  'Itens de revisão espaçada (SM-2) gerados automaticamente. Um item por (aluno, fonte). course_id desnormalizado para RLS de staff.';

-- Índice principal: "o que está pronto para revisar agora" do aluno.
create index srs_items_user_due_idx
  on public.srs_items (user_id, next_review_at);
create index srs_items_course_idx
  on public.srs_items (course_id);

alter table public.srs_items enable row level security;

-- Aluno vê/edita os próprios itens; staff (admin / professor do curso) vê
-- — mesma simetria de part_progress e exercise_attempts.
create policy "srs_items_select" on public.srs_items
  for select using (
    user_id = (select auth.uid()) or private.is_course_staff(course_id)
  );

create policy "srs_items_insert" on public.srs_items
  for insert with check (
    user_id = (select auth.uid()) and private.is_enrolled(course_id)
  );

create policy "srs_items_update" on public.srs_items
  for update using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );

create policy "srs_items_delete" on public.srs_items
  for delete using ( user_id = (select auth.uid()) );

create trigger srs_items_set_updated_at before update on public.srs_items
  for each row execute function public.set_updated_at();
