# 0004 — Lições divididas em partes

**Data**: 2026-05-29
**Status**: Aceito

## Contexto

Lições do material original são longas (uma lição completa = 30-60 min de estudo). Apresentar isso ao aluno como uma única "página" cria três problemas: ① alto custo psicológico para iniciar (procrastinação), ② impossibilidade de retomada limpa em sessões curtas (no transporte público, no intervalo), ③ feedback de progresso pouco frequente (engajamento baixo).

A literatura de design de aprendizado digital recomenda "chunking" em unidades de 5-15 minutos.

## Alternativas consideradas

### Alternativa A: lição = unidade única
Aluno vê tudo de uma vez em scroll vertical.

### Alternativa B: cada bloco é uma "tela" navegável
Tipo Duolingo puro: aluno passa por uma tela de cada vez.

**Contras**: granularidade pequena demais para o tipo de conteúdo educacional adulto, fragmenta demais o raciocínio (uma tabela de conjugação não faz sentido vista bloco por bloco).

### Alternativa C (escolhida): lição → partes → blocos
Lição é dividida em "partes" (5-15 min cada). Aluno vê uma parte por vez. Dentro da parte, blocos rolam em coluna única.

## Decisão

Adotamos a estrutura `Lesson → Part → Block`.

## Regras de geração e edição

1. **Geração automática inicial**: ao importar PDF, partes são geradas a partir das seções padrão do material (Opening text, Vocabulary, Lesson topic, Grammar, Pronunciation, Dialogue, Exercises). Cada seção vira uma parte.
2. **Edição livre**: admin pode unir partes, dividir partes, renomear, reordenar. Sem restrição estrutural.
3. **Tempo estimado**: calculado automaticamente baseado nos blocos contidos (textos: ~200 palavras/min, áudios: duração do TTS, exercícios: 30s por questão). Admin pode sobrescrever.
4. **Progresso por parte**: `user_progress` registra completude por parte (não por lição). Lição é considerada "completa" quando todas as partes (exceto a dourada) foram completadas.
5. **Parte dourada**: gerada automaticamente ao final de cada lição. Contém seleção aleatória de 5-10 exercícios das partes anteriores. Recompensa XP extra.

## Consequências

- Schema: tabela `lesson_parts` com `lesson_id`, `order`, `title`, `icon`, `estimated_minutes`, `is_golden`.
- Tabela `lesson_blocks` referencia `part_id` (não `lesson_id` diretamente).
- Dashboard mostra "X de Y partes concluídas" como métrica de progresso primária.
- Sistema de estrelas (1-3) é por parte, não por lição.
- Sistema de XP atribui bônus por completar parte e bônus extra por parte dourada.