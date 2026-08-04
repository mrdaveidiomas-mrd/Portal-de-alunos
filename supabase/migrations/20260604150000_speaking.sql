-- Migration: speaking
-- Suporte ao tipo de bloco 'speaking': lista de frases para o aluno falar e o
-- navegador (Web Speech API) transcrever. Para cada frase:
--   - guardamos a melhor tentativa em speaking_attempts (idempotência de XP)
--   - quando o aluno erra/quase, semeamos um item SRS (source_type='speaking')
--
-- IMPORTANTE: speaking NÃO entra em EXERCISE_TYPES no app — por design,
-- speaking não conta para a conclusão da parte nem para o cálculo de estrelas
-- (modo "híbrido"). Aluno em browser sem suporte pode usar fallback por texto.

-- 1) Extender o CHECK de srs_items.source_type para incluir 'speaking'.
alter table public.srs_items
  drop constraint srs_items_source_type_check;

alter table public.srs_items
  add constraint srs_items_source_type_check
  check (source_type in ('exercise', 'vocab', 'speaking'));

-- 2) Tabela de tentativas de speaking, granular por frase.
create table public.speaking_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  block_id      uuid not null references public.blocks (id) on delete cascade,
  -- Cada bloco de speaking tem uma lista de frases (data.items[i]); guardamos
  -- por (block_id, phrase_index).
  phrase_index  smallint not null check (phrase_index >= 0),
  part_id       uuid not null references public.parts (id)   on delete cascade,
  course_id     uuid not null references public.courses (id) on delete cascade,
  -- Estado do melhor resultado já obtido: 'perfect' | 'close' | 'incorrect'.
  best_state    text not null default 'incorrect'
                 check (best_state in ('perfect', 'close', 'incorrect')),
  xp_awarded    integer not null default 0 check (xp_awarded >= 0),
  attempts      integer not null default 0 check (attempts >= 0),
  -- Marca se a tentativa veio do fallback por texto (browser sem Web Speech).
  via_text      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, block_id, phrase_index)
);
comment on table public.speaking_attempts is
  'Tentativas de speaking (Web Speech API ou fallback por texto). Uma linha por (aluno, bloco, frase). Não conta para conclusão de parte.';

create index speaking_attempts_user_idx on public.speaking_attempts (user_id);
create index speaking_attempts_block_idx on public.speaking_attempts (block_id);
create index speaking_attempts_course_idx on public.speaking_attempts (course_id);

alter table public.speaking_attempts enable row level security;

-- Mesmas políticas de exercise_attempts: aluno vê/edita o próprio, staff
-- vê do curso onde é professor/admin. Insert exige matrícula ativa.
create policy "speaking_attempts_select" on public.speaking_attempts
  for select using (
    user_id = (select auth.uid()) or private.is_course_staff(course_id)
  );

create policy "speaking_attempts_insert" on public.speaking_attempts
  for insert with check (
    user_id = (select auth.uid()) and private.is_enrolled(course_id)
  );

create policy "speaking_attempts_update" on public.speaking_attempts
  for update using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );

create trigger speaking_attempts_set_updated_at before update on public.speaking_attempts
  for each row execute function public.set_updated_at();
