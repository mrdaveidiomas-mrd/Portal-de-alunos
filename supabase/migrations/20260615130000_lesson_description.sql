-- =====================================================================
-- Lessons: descrição curta (opcional).
--
-- Mesma régua de parts.description (ver 20260615120000): metadado
-- pedagógico opcional, exibido como subtítulo na listagem de
-- módulos/lições. Não afeta progresso, gating ou correção.
-- =====================================================================

alter table public.lessons
  add column if not exists description text;

comment on column public.lessons.description is
  'Descrição curta opcional da lição (objetivo/foco), exibida como subtítulo.';
