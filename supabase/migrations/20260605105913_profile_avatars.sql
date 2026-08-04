-- Migration: profile_avatars
-- Adiciona suporte a foto de perfil. Cada usuário pode fazer upload
-- de uma imagem; o caminho é guardado em profiles.avatar_url.
-- Quando vazio, a UI mostra as iniciais do nome.

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'URL pública da foto de perfil no bucket avatars. Null quando o usuário não enviou foto (a UI mostra iniciais).';

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- Policies do bucket. Convenção de path: avatars/<user_id>/<filename>.
-- O usuário gerencia apenas o próprio diretório; leitura é pública.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'avatars_user_insert_own'
  ) then
    create policy "avatars_user_insert_own" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'avatars_user_update_own'
  ) then
    create policy "avatars_user_update_own" on storage.objects
      for update to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      )
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'avatars_user_delete_own'
  ) then
    create policy "avatars_user_delete_own" on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = (select auth.uid())::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'avatars_public_read'
  ) then
    create policy "avatars_public_read" on storage.objects
      for select to anon, authenticated
      using ( bucket_id = 'avatars' );
  end if;
end $$;
