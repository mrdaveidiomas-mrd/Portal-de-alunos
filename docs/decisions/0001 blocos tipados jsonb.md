# 0001 — Blocos tipados com JSONB

**Data**: 2026-05-29
**Status**: Aceito

## Contexto

O conteúdo das lições é heterogêneo: parágrafos de texto rico, listas de vocabulário, tabelas de conjugação, diálogos com personagens, exercícios de tipos variados (múltipla escolha, lacuna, tradução, reordenação), áudios para leitura, alertas e callouts, diagramas de fórmula, e mais. Identificamos cerca de 20 tipos distintos analisando os PDFs do material existente, e novos tipos surgirão.

Precisamos decidir como modelar isso no banco de dados.

## Alternativas consideradas

### Alternativa A: uma tabela por tipo de bloco
Cada tipo vira tabela: `text_blocks`, `vocabulary_blocks`, `multiple_choice_blocks`, etc. Cada uma com suas colunas específicas.

**Prós**: tipos fortes no banco, queries específicas otimizadas, validação de schema garantida pelo Postgres.

**Contras**: cada novo tipo exige nova migration, nova tabela, novo código de leitura/escrita. Adicionar 1 tipo = 1 dia de trabalho mínimo. Para um catálogo de 20+ tipos, inviável.

### Alternativa B: campo único de texto livre (HTML/Markdown)
Toda lição vira um único campo `content` com HTML formatado.

**Prós**: zero complexidade de schema.

**Contras**: impossível corrigir exercícios programaticamente, impossível tocar áudio bloco-a-bloco, impossível rastrear progresso por elemento, admin teria que formatar manualmente.

### Alternativa C (escolhida): tabela única `lesson_blocks` com `type` (enum) + `data` (JSONB)
Uma tabela. Cada linha tem: `id`, `part_id`, `order`, `type` (enum), `data` (JSONB com estrutura específica do tipo).

**Prós**:
- Adicionar tipo novo = adicionar valor no enum + componente de renderização. Sem migration.
- Schema do `data` validado em código (TypeScript + zod), não em SQL.
- Queries simples: "todos os blocos da parte X em ordem" é um SELECT direto.
- JSONB do Postgres é indexável e queryável quando preciso.

**Contras**:
- Validação de `data` precisa ser disciplinada em código (não há proteção do banco).
- Queries específicas por estrutura interna de `data` (ex: "todos os exercícios de múltipla escolha com mais de 4 opções") são mais verbosas que com colunas dedicadas.

## Decisão

Adotamos a **Alternativa C**.

## Consequências

- Cada tipo de bloco é definido em código: enum em `src/types/blocks.ts`, schema zod em `src/lib/blocks/schemas.ts`, componente renderizador em `src/components/blocks/`.
- Toda escrita em `lesson_blocks.data` passa por validação zod antes de chegar ao banco.
- Migrations não são necessárias para adicionar tipos novos — apenas código.
- Caso uma futura performance crítica exija queries pesadas sobre conteúdo interno dos blocos, criamos views materializadas específicas. Não otimizamos prematuramente.