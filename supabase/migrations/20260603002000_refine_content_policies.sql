-- Migration: refine_content_policies
-- Ajustes apontados pelo performance linter após content_and_enrollment:
--  1. FK courses.teacher_id sem índice de cobertura.
--  2. multiple_permissive_policies: o padrão "_select" + "_staff_all" (FOR ALL)
--     gerava DUAS policies permissivas de SELECT por tabela. Troca-se o FOR ALL
--     por policies explícitas de INSERT/UPDATE/DELETE, deixando uma única policy
--     de SELECT (que já cobre a leitura de staff).

-- 1. Índice para a FK de teacher.
create index on public.courses (teacher_id);

-- 2. Substituir as policies FOR ALL por escrita explícita (sem SELECT).
-- modules
drop policy "modules_staff_all" on public.modules;
create policy "modules_insert" on public.modules
  for insert with check ( private.is_course_staff(course_id) );
create policy "modules_update" on public.modules
  for update using ( private.is_course_staff(course_id) )
  with check ( private.is_course_staff(course_id) );
create policy "modules_delete" on public.modules
  for delete using ( private.is_course_staff(course_id) );

-- lessons
drop policy "lessons_staff_all" on public.lessons;
create policy "lessons_insert" on public.lessons
  for insert with check ( private.is_course_staff(course_id) );
create policy "lessons_update" on public.lessons
  for update using ( private.is_course_staff(course_id) )
  with check ( private.is_course_staff(course_id) );
create policy "lessons_delete" on public.lessons
  for delete using ( private.is_course_staff(course_id) );

-- parts
drop policy "parts_staff_all" on public.parts;
create policy "parts_insert" on public.parts
  for insert with check ( private.is_course_staff(course_id) );
create policy "parts_update" on public.parts
  for update using ( private.is_course_staff(course_id) )
  with check ( private.is_course_staff(course_id) );
create policy "parts_delete" on public.parts
  for delete using ( private.is_course_staff(course_id) );

-- blocks
drop policy "blocks_staff_all" on public.blocks;
create policy "blocks_insert" on public.blocks
  for insert with check ( private.is_course_staff(course_id) );
create policy "blocks_update" on public.blocks
  for update using ( private.is_course_staff(course_id) )
  with check ( private.is_course_staff(course_id) );
create policy "blocks_delete" on public.blocks
  for delete using ( private.is_course_staff(course_id) );

-- enrollments
drop policy "enrollments_staff_all" on public.enrollments;
create policy "enrollments_insert" on public.enrollments
  for insert with check ( private.is_course_staff(course_id) );
create policy "enrollments_update" on public.enrollments
  for update using ( private.is_course_staff(course_id) )
  with check ( private.is_course_staff(course_id) );
create policy "enrollments_delete" on public.enrollments
  for delete using ( private.is_course_staff(course_id) );
