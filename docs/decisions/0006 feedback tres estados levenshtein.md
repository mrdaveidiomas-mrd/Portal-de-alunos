# 0006 — Feedback em três estados com Levenshtein

**Data**: 2026-05-29
**Status**: Aceito

## Contexto

Exercícios de texto livre (tradução, escrita curta, completar) sofrem com a rigidez do `string === string`. Alunos digitam variações válidas, esquecem maiúsculas, comem pontuação. Marcar tudo isso como "erro" frustra; aceitar tudo como "correto" não educa.

Inspiração no Duolingo: estado intermediário "quase correto" que aceita typos com aviso.

## Decisão

Sistema de três estados:

1. **Perfeito** ✅ — resposta normalizada bate exatamente com uma das respostas aceitas. XP cheio.
2. **Quase lá** ⚠️ — distância de Levenshtein dentro da tolerância. Resposta aceita com destaque visual do erro. XP parcial (70%) + opção de refazer para recuperar XP restante.
3. **Erro** ❌ — distância acima da tolerância. XP zero + resposta correta exibida + opção de tentar de novo.

## Pipeline de correção

```
resposta do aluno
  ↓
NORMALIZAÇÃO
  - toLowerCase
  - trim + colapso de espaços
  - remoção de pontuação final
  - normalização de aspas
  ↓
MATCHING EXATO
  resposta normalizada ∈ respostas_aceitas? → PERFEITO
  ↓ não
LEVENSHTEIN PALAVRA-A-PALAVRA
  para cada palavra esperada:
    palavra do aluno na mesma posição
    distância ≤ max(1, floor(length × 0.2))?
  todas as palavras dentro da tolerância? → QUASE LÁ
  ↓ não
ERRO
```

## Configuração de tolerância

- Distância tolerada por palavra: `max(1, floor(length × 0.2))`
- Palavras de 2-4 chars: 1 erro permitido
- Palavras de 5-9 chars: 1-2 erros
- Palavras de 10+ chars: 2-3 erros
- Ordem das palavras importa (sentença re-ordenada = erro)

## Banco de respostas aceitas

Cada exercício de texto livre armazena:
- 1 resposta **canônica** (a "modelo" que aparece em "Forma correta: ...")
- Array de variantes aceitas (típicas: com/sem contração, ordem alternativa de adjuntos, sinônimos comuns)

Admin cadastra manualmente. Futuro: botão "Gerar variantes com IA" (Claude API) sugere variantes que o admin aprova.

## XP

- Perfeito: 10 XP
- Quase lá: 7 XP (com opção de refazer para os 3 XP restantes)
- Erro: 0 XP

Valores configuráveis em arquivo `src/lib/gamification/config.ts`.

## Estrelas e quase-lás

Para o cálculo de estrelas por parte:
- 3 estrelas: ≥90% perfeitos
- 2 estrelas: ≥70% perfeitos OU ≥90% perfeitos+quase-lás
- 1 estrela: parte completada (todos os blocos interagidos)

## Consequências

- Função `gradeAnswer(user, expected, accepted[])` em `src/lib/grading/`.
- Implementação de Levenshtein pura em `src/lib/grading/levenshtein.ts` (algoritmo conhecido, ~30 linhas).
- Testes unitários obrigatórios para `gradeAnswer` (casos: typo único, múltiplos typos, palavra trocada, ordem trocada, pontuação extra).
- UI mostra os três estados com cores semânticas (verde, amarelo, vermelho) + texto explicativo.