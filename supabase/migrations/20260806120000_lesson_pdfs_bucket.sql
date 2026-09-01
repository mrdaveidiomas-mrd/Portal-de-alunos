-- =====================================================================
-- Bucket `lesson-pdfs`: arquivos PDF anexados aos blocos de conteúdo
-- lecionado das lições (bloco do tipo `pdf`).
--
-- Mesmo modelo do bucket `lesson-images`: só o ADMIN escreve (material
-- didático, não conteúdo de usuário), e a leitura é pública — o aluno
-- precisa abrir/baixar o PDF, e a URL não expõe nada além do próprio
-- material da lição.
--
-- Convenção de path: lesson-pdfs/<course_id>/<arquivo>. Agrupar por curso
-- facilita auditar/limpar material de um curso removido.
--
-- O upload é DIRETO do browser para o Storage (Server Action tem limite de
-- corpo: 1 MB no Next por padrão, ~4,5 MB de teto na Vercel — inviável
-- para PDF de material didático). Por isso os limites de tamanho/mime moram
-- no BUCKET: é a fronteira que o cliente não contorna. Quem pode escrever
-- continua sendo decidido pela RLS abaixo.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'lesson-pdfs',
    'lesson-pdfs',
    true,
    20971520, -- 20 MB
    array['application/pdf']
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
      and policyname = 'lesson_pdfs_admin_insert'
  ) then
    create policy "lesson_pdfs_admin_insert" on storage.objects
      for insert to authenticated
      with check ( bucket_id = 'lesson-pdfs' and private.is_admin() );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'lesson_pdfs_admin_update'
  ) then
    create policy "lesson_pdfs_admin_update" on storage.objects
      for update to authenticated
      using ( bucket_id = 'lesson-pdfs' and private.is_admin() )
      with check ( bucket_id = 'lesson-pdfs' and private.is_admin() );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'lesson_pdfs_admin_delete'
  ) then
    create policy "lesson_pdfs_admin_delete" on storage.objects
      for delete to authenticated
      using ( bucket_id = 'lesson-pdfs' and private.is_admin() );
  end if;

  -- Leitura pública: o aluno (e o visualizador/iframe do browser, sem
  -- token) precisa abrir e baixar o PDF do material da lição.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'lesson_pdfs_public_read'
  ) then
    create policy "lesson_pdfs_public_read" on storage.objects
      for select to anon, authenticated
      using ( bucket_id = 'lesson-pdfs' );
  end if;
end $$;
