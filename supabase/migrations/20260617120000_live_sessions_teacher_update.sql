-- =====================================================================
-- Permite ao PROFESSOR editar o meet_url das próprias aulas síncronas.
--
-- O admin continua com CRUD completo (policy student_live_sessions_admin_all).
-- O professor antes só lia (student_live_sessions_teacher_select). Agora
-- também atualiza, mas APENAS rows onde teacher_id = auth.uid() — não
-- pode mexer em aulas que não dá.
--
-- A policy é permissiva no UPDATE (não restringe colunas pelo banco); a
-- Server Action no app garante que só o meet_url muda. Defesa em
-- profundidade: o ideal é o front + RLS reforçarem juntos a mesma regra.
-- =====================================================================

create policy student_live_sessions_teacher_update
  on public.student_live_sessions
  for update
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));
