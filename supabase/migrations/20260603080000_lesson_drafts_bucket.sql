-- Migration: lesson_drafts_bucket
-- Cache de drafts da Edge Function import_lesson (chamadas \xE0 Claude API).
-- Privado: s\xF3 a fun\xE7\xE3o l\xEA/escreve, via service_role. Sem policies p\xFAblicas.

insert into storage.buckets (id, name, public)
values ('lesson-drafts', 'lesson-drafts', false)
on conflict (id) do nothing;
