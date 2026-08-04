# 0002 — RLS no Postgres para autorização

**Data**: 2026-05-29
**Status**: Aceito

## Contexto

A regra "aluno só pode ver o conteúdo dos cursos em que está matriculado" é central no produto. Ela precisa ser aplicada em **toda** query que toque conteúdo de lições, exercícios, progresso, áudios, etc. Aplicar isso na camada de aplicação significa lembrar de adicionar filtros (`WHERE enrollment_active`) em todas as queries — uma fonte clássica de bugs de segurança.

## Alternativas consideradas

### Alternativa A: filtros na aplicação
Cada query da aplicação adiciona manualmente os filtros de autorização.

**Prós**: lógica fica visível no código da aplicação.

**Contras**: errar uma vez = vazamento de dados. Difícil auditar todas as queries. Devs novos esquecem filtros.

### Alternativa B (escolhida): Row Level Security do Postgres
Cada tabela tem políticas RLS escritas em SQL que o banco aplica **automaticamente** a toda query. A aplicação faz `SELECT * FROM lessons` e o banco retorna apenas as lições que o usuário autenticado pode ver.

**Prós**:
- Impossível esquecer: o banco faz cumprir, sempre.
- Auditável: todas as regras estão em arquivos SQL versionados.
- Supabase tem suporte nativo de primeira classe.
- A função `auth.uid()` do Supabase identifica o usuário corrente.

**Contras**:
- Curva de aprendizado: escrever políticas RLS exige entender SQL bem.
- Debugar "por que essa query retorna vazio?" exige testar com policies em mente.
- Performance de policies complexas precisa ser observada (mas Postgres é rápido).

## Decisão

Adotamos **RLS para toda autorização**. A aplicação confia no banco.

## Regras de implementação

1. **Toda tabela com dados de usuário** tem RLS habilitada: `ALTER TABLE x ENABLE ROW LEVEL SECURITY;`.
2. **Cada política** tem comentário SQL explicando o "porquê", não só o "o quê".
3. **Políticas vivem em migrations versionadas**, nunca criadas via Dashboard.
4. **Testes manuais obrigatórios**: ao criar política nova, testar com 2+ usuários diferentes para validar isolamento.
5. **Service role bypassa RLS** — usar `SUPABASE_SERVICE_ROLE_KEY` apenas em Edge Functions ou Server Actions com lógica privilegiada justificada.

## Exemplo

```sql
-- Alunos veem apenas lições dos cursos em que estão matriculados (ativo)
CREATE POLICY "students_see_enrolled_courses_lessons"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN modules m ON m.course_id = e.course_id
      WHERE e.user_id = auth.uid()
        AND e.status = 'active'
        AND m.id = lessons.module_id
    )
  );
```

## Consequências

- Erros de "query retorna vazio" tornam-se rotina nas primeiras semanas — debug exige verificar policies.
- Performance: adicionamos índices nos campos usados em policies (`enrollments.user_id`, `enrollments.status`, etc.).
- Onboarding de devs futuros exige ensinar RLS antes do código.