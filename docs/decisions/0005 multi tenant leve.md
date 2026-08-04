# 0005 — Multi-tenant leve via teacher_id em courses

**Data**: 2026-05-29
**Status**: Aceito

## Contexto

O cliente atual tem aulas síncronas com professor designado por aluno. Cada aluno tem **um** professor responsável, que dá suas aulas e acompanha seu progresso. Há também possibilidade futura de contratar outros professores (de espanhol, ou substitutos), com suas próprias turmas, dentro da mesma plataforma.

Precisamos decidir se modelamos isso desde o início.

## Alternativas consideradas

### Alternativa A: ignorar e assumir um único professor
Toda lógica assume o "professor" como uma constante implícita.

**Contras**: futuro retrofit para suportar múltiplos professores exigirá mexer em RLS, em UI, em queries — alto custo.

### Alternativa B (escolhida): multi-tenant leve via `teacher_id`
Cada `course` tem um `teacher_id` (FK para `users` com role `teacher`). Cada aluno é matriculado em um ou mais cursos, e portanto vê os professores correspondentes. RLS faz com que professor X só veja alunos cujos cursos ele leciona.

**Prós**:
- Custo de implementação inicial: baixo (1 coluna + algumas policies).
- Futuro: zero retrofit. Contratar novo professor = criar user + cursos atribuídos.
- Schema honesto sobre a realidade (mesmo com 1 professor hoje, o modelo é correto).

### Alternativa C: multi-tenant pesado (workspaces, organizações)
Cada escola seria uma "organização", com isolamento total.

**Contras**: overkill para o escopo atual (uma escola, alguns professores).

## Decisão

Adotamos multi-tenant leve via `teacher_id` em `courses`.

## Regras

1. `courses.teacher_id` é FK obrigatória para `users` com role `teacher` ou `admin`.
2. Política RLS em `users`: professor pode ver dados de alunos matriculados em seus cursos.
3. Política RLS em `user_progress`: professor pode ver progresso de alunos matriculados em seus cursos.
4. Admin (`role = 'admin'`) sempre tem visão completa, sem restrição por `teacher_id`.
5. Painel do professor (Fase 2+) lista apenas alunos de cursos sob sua responsabilidade.

## Consequências

- Schema do MVP já inclui `courses.teacher_id`.
- RLS de tabelas analíticas (Fase 2+) considera tanto `auth.uid() = user_id` (próprio aluno) quanto "aluno está em curso do professor logado".
- UI de admin permite criar usuários com role `teacher` desde o MVP, mesmo que apenas Mr. Dave use no início.