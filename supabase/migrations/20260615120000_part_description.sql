-- =====================================================================
-- Parts: descrição curta (opcional).
--
-- Cada parte ganha um campo `description` (text null). Usado pelo admin
-- para anotar o foco/objetivo da parte além do título — aparece na
-- listagem da lição como subtítulo da linha. Não afeta progresso nem
-- correção; é só metadado pedagógico.
-- =====================================================================

alter table public.parts
  add column if not exists description text;

comment on column public.parts.description is
  'Descrição curta opcional da parte (objetivo/foco), exibida na listagem da lição.';
