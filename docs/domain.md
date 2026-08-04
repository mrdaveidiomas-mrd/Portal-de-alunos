# Glossário do domínio

Este arquivo expande o glossário básico do `CLAUDE.md` com detalhes, regras de negócio e relações entre conceitos. É a referência canônica do "vocabulário" do projeto.

## Hierarquia de conteúdo

```
Course (curso)
└── Module (módulo)
    └── Lesson (lição)
        └── Part (parte)
            └── Block (bloco)
```

### Course
Unidade comercial. Tem um idioma (`en`, `es`), um nível CEFR (`A1`, `A2`, `B1`, etc.), um professor responsável (`teacher_id`), e título descritivo.

**Exemplo**: "Inglês A1 Adulto" (idioma `en`, nível `A1`, professor Mr. Dave).

### Module
Agrupamento de lições com ordem definida dentro do curso. Cada módulo tem título e ordem.

**Exemplo**: "Module 01 — Foundations", "Module 02 — Daily life".

### Lesson
Equivalente digital de uma aula presencial. Tem título, ordem dentro do módulo, e um conjunto de partes.

**Exemplo**: "Lesson 03 — To be or not to be" (3ª lição do Module 01).

### Part
Subdivisão de uma lição, idealmente consumível em 5-15 minutos. Geradas semi-automaticamente a partir das seções dos PDFs do material original (Opening text, Vocabulary, Lesson topic, Grammar, Pronunciation, Dialogue, Exercises). O admin pode reorganizar, renomear, dividir ou unir partes livremente.

Cada parte tem: título, ordem, ícone (opcional), tempo estimado (calculado ou manual), e se é uma "parte dourada" (`is_golden`).

### Block
Unidade atômica de conteúdo dentro de uma parte. **Tipado** via campo `type` (enum) com dados específicos do tipo em campo `data` (JSONB).

Tipos do MVP (6):
- `rich_text` — parágrafos formatados com markdown leve
- `vocabulary` — lista de termos com tradução
- `reading` — texto longo com TTS, para leitura
- `dialogue` — diálogo entre personagens com TTS por linha
- `exercise_multiple_choice` — exercício de múltipla escolha
- `exercise_fill_blank` — exercício de preencher lacuna

Tipos futuros (fases seguintes): `audio_only`, `pronunciation_practice` (Web Speech), `exercise_translation`, `exercise_reorder_words`, `exercise_error_correction`, `comparison_table`, `formula_diagram`, `rule_group`, `comprehension_question`, `callout_info`, `callout_warning`, `callout_tip`, `structured_list`, entre outros.

## Pessoas e autorização

### User
Qualquer pessoa autenticada. Tem campo `role` que determina permissões:
- `student` — vê apenas conteúdo dos cursos em que está matriculado
- `teacher` — vê seus alunos designados e os cursos que ministra
- `admin` — acesso total ao painel administrativo

Um usuário pode ter apenas um role primário, mas a UI deve ser construída para que um admin possa ser também professor (raro, mas possível).

### Enrollment
Vincula um aluno a um curso. Tem `status`: `active`, `paused`, `completed`. Apenas matrículas `active` dão acesso ao conteúdo via RLS.

A criação de enrollment é feita pelo admin (manualmente no MVP). Pode ter `started_at`, `expires_at` (para cursos com validade).

## Progresso e gamificação

### user_progress
Registra qual parte cada aluno completou e seu desempenho. Chave: (`user_id`, `part_id`). Campos: `completed_at`, `stars` (0-3), `xp_earned`, `attempts`.

Uma parte é considerada "completada" quando todos os blocos obrigatórios dela foram interagidos (lidos, áudios tocados pelo menos uma vez, exercícios respondidos).

### user_stats
Estatísticas agregadas por usuário: `total_xp`, `current_streak`, `longest_streak`, `last_activity_at`, `weekly_xp`.

Atualizadas via triggers no Postgres sempre que `user_progress` é alterado.

### XP (pontos de experiência)
Ganhos:
- Bloco de conteúdo consumido (não-exercício): +2 XP
- Exercício correto perfeito: +10 XP
- Exercício "quase lá" (typo aceito): +7 XP
- Exercício errado: 0 XP
- Bônus por completar parte: +5 XP
- Bônus por 3 estrelas em parte: +10 XP
- Bônus por completar parte dourada: +20 XP

Valores podem ser ajustados — devem ficar em arquivo de configuração, não hardcoded.

### Streak
Sequência de dias consecutivos com pelo menos uma atividade (bloco consumido ou exercício respondido). Reseta para 1 se o aluno passar um dia sem atividade. **Considerar fuso horário do usuário** ao calcular "dia".

### Conquistas (achievements)
Tabela `achievements` lista todas as conquistas disponíveis (nome, descrição, ícone, condição em texto). Tabela `user_achievements` registra quando cada aluno conquistou cada uma.

Conquistas iniciais do MVP:
- "Primeira lição" — completou primeira lição do curso
- "Sequência de 7" — 7 dias seguidos estudando
- "Sequência de 30" — 30 dias seguidos estudando
- "Madrugador" — estudou antes das 7h
- "Coruja" — estudou depois das 22h

### Estrelas por parte
- 3 estrelas: 90%+ dos exercícios da parte respondidos perfeitamente
- 2 estrelas: 70-89% perfeitos OU 90%+ aceitando "quase lás"
- 1 estrela: completou a parte (todos os blocos interagidos)
- 0 estrelas: parte não completada

Refazer uma parte pode aumentar a contagem de estrelas, nunca diminuir.

### Parte dourada
Parte gerada automaticamente ao final de cada lição, contendo seleção aleatória de 5-10 exercícios das partes anteriores. Recompensa XP extra. Alimenta o sistema de revisão espaçada (fase futura).

### Item marcado para revisar
Aluno pode marcar qualquer bloco/conteúdo individualmente para "revisar depois". Esses itens aparecem na fila de revisão do dashboard, separados dos itens sugeridos pelo sistema SRS (quando este existir).

## Correção de exercícios

### Três estados de feedback
1. **Perfeito**: resposta normalizada bate exatamente com uma resposta aceita. XP cheio.
2. **Quase lá**: distância de Levenshtein entre a resposta do aluno e a esperada é pequena (typo). XP parcial (70%) + destaque visual do erro + opção de refazer para recuperar XP restante.
3. **Erro**: resposta muito diferente. XP zero + resposta correta exibida + opção de tentar de novo.

### Normalização
Antes de comparar, tanto resposta do aluno quanto respostas aceitas passam por:
- `toLowerCase()`
- Trim de espaços
- Colapso de múltiplos espaços em um
- Remoção de pontuação final (`.`, `!`, `?`)
- Normalização de aspas (`'` e `'` viram `'`)
- Acentos opcionais: dependendo do exercício, podem ser ignorados

### Respostas aceitas
Cada exercício de texto livre armazena: 1 resposta canônica + array de variantes aceitas. Ex: para "Eu não estou trabalhando agora", aceitar:
- "I'm not working now"
- "I am not working now"
- "I'm not working right now"
- "I am not working right now"

### Tolerância de Levenshtein
Para cada palavra: distância tolerada = `max(1, floor(length × 0.2))`.
- "working" (7 chars) → tolera 1 erro → "workign", "workin", "wirking" aceitam.
- "interesting" (11 chars) → tolera 2 erros.
- Para frases, comparação é palavra-por-palavra na ordem; ordem importa.

## Áudio (TTS)

### Cache de áudios
Cada combinação (texto + voz + sotaque) gera UM arquivo MP3, salvo no Storage com chave `tts/{hash}.mp3` onde `hash = sha256(texto + voz + sotaque)`. Acessos subsequentes servem direto do Storage.

### Preferências do aluno
Cada usuário tem `preferred_voice_gender` (`male` | `female`) e `preferred_accent_en` (`us` | `uk`) e `preferred_accent_es` (`es` | `mx` | `ar`).

Ao reproduzir um bloco de áudio, o sistema escolhe a voz com base em:
1. Se o bloco define personagem com gênero específico (ex: diálogo com Anna feminina), respeita.
2. Caso contrário, usa preferência do aluno.

### Vozes Google Cloud TTS Neural2
- Inglês US masculino: `en-US-Neural2-D` ou `en-US-Neural2-J`
- Inglês US feminino: `en-US-Neural2-F` ou `en-US-Neural2-H`
- Inglês UK masculino: `en-GB-Neural2-B` ou `en-GB-Neural2-D`
- Inglês UK feminino: `en-GB-Neural2-A` ou `en-GB-Neural2-C`
- Espanhol ES masculino: `es-ES-Neural2-F`
- Espanhol ES feminino: `es-ES-Neural2-A`
- Espanhol MX masculino: `es-US-Neural2-B`
- Espanhol MX feminino: `es-US-Neural2-A`

Lista pode ser revisada conforme novas vozes são lançadas.

## Relação com aulas síncronas

O portal **complementa** aulas síncronas. O admin/professor define semanalmente qual é o "foco da semana" — uma ou duas lições que a turma está estudando presencialmente. Essa marcação:

- Destaca essas lições no dashboard do aluno
- Calcula "alinhamento com a turma" (`em dia`, `adiantado`, `atrasado`)
- Permite ao professor ver no painel quem está acompanhando o ritmo

Configuração `course.show_class_alignment` (boolean) permite ao admin desabilitar essa lógica para cursos individuais (1-aluno, sem turma).