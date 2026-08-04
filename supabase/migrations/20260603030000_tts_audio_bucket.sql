-- Migration: tts_audio_bucket
-- Bucket de cache dos áudios TTS (ADR 0003). Público para leitura (o áudio
-- gerado não é sensível), o que permite tocar via <audio src> direto. A escrita
-- é feita pela Edge Function `tts` usando service_role (ignora policies).

insert into storage.buckets (id, name, public)
values ('tts-audio', 'tts-audio', true)
on conflict (id) do nothing;
