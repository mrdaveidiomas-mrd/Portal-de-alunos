-- =====================================================================
-- Bucket `lesson-images`: imagens dos blocos de conteúdo das lições.
--
-- Diferente do bucket `avatars` (onde cada usuário gerencia o próprio
-- diretório), aqui só o ADMIN escreve — imagem de lição é material
-- didático, não conteúdo de usuário. Leitura é pública: o aluno precisa
-- ver a imagem, e a URL não expõe nada além do próprio material.
--
-- Convenção de path: lesson-images/<course_id>/<arquivo>. Agrupar por
-- curso facilita auditar/limpar material de um curso removido.
--
-- O upload é DIRETO do browser para o Storage (Server Action tem limite de
-- corpo: 1 MB no Next por padrão, ~4,5 MB de teto na Vercel — inviável
-- para material didático). Por isso os limites de tamanho/mime moram no
-- BUCKET: é a fronteira que o cliente não contorna. Quem pode escrever
-- continua sendo decidido pela RLS abaixo.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'lesson-images',
    'lesson-images',
    true,
    5242880, -- 5 MB
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  )
  on conflict (id) do update
    set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'lesson_images_admin_insert'
  ) then
    create policy "lesson_images_admin_insert" on storage.objects
      for insert to authenticated
      with check ( bucket_id = 'lesson-images' and private.is_admin() );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'lesson_images_admin_update'
  ) then
    create policy "lesson_images_admin_update" on storage.objects
      for update to authenticated
      using ( bucket_id = 'lesson-images' and private.is_admin() )
      with check ( bucket_id = 'lesson-images' and private.is_admin() );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'lesson_images_admin_delete'
  ) then
    create policy "lesson_images_admin_delete" on storage.objects
      for delete to authenticated
      using ( bucket_id = 'lesson-images' and private.is_admin() );
  end if;

  -- Leitura pública: o aluno (e o <img> do browser, sem token) precisa
  -- carregar a imagem do material da lição.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'lesson_images_public_read'
  ) then
    create policy "lesson_images_public_read" on storage.objects
      for select to anon, authenticated
      using ( bucket_id = 'lesson-images' );
  end if;
end $$;
