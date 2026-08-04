# CLAUDE.md

Este arquivo é lido automaticamente pelo Claude Code ao abrir o projeto. Ele consolida o contexto, as convenções e as decisões arquiteturais que devem ser seguidas em toda sessão.

---

## Visão geral do projeto

Portal do aluno para uma escola de idiomas (inglês e espanhol). O sistema permite que alunos consumam conteúdo digitalizado de aulas (módulos, lições, partes, blocos de conteúdo e exercícios autocorrigidos), com gamificação leve (XP, streak, conquistas, partes douradas, estrelas). Há também um painel para professores acompanharem alunos e um painel administrativo para gestão de conteúdo.

O produto complementa aulas síncronas presenciais/online. **Não substitui o professor** — funciona como reforço guiado, com o professor designado tendo visão das dificuldades de cada aluno.

## Stack técnica

- **Next.js 16.x** com App Router, TypeScript, React 19, Server Components por padrão.
- **Supabase** para autenticação, Postgres com Row Level Security, Storage (áudios TTS), Edge Functions.
- **Tailwind CSS** com tokens de design via variáveis CSS (paleta neutra inicial, trocável centralmente).
- **TipTap** para edição rich text no admin (Fase 2+).
- **dnd-kit** para drag-and-drop no admin (Fase 3+).
- **Google Cloud TTS Neural2** com cache em Supabase Storage para áudios.
- **Web Speech API** nativa para reconhecimento de voz (Fase 3+).
- **Deploy**: Vercel (Next.js) + Supabase Cloud (backend).
- **Versionamento**: Git, GitHub, commits pequenos e atômicos.

## Glossário do domínio

Termos com significado **específico** neste projeto. Use sempre o mesmo termo em código, comentários, comunicação:

- **Course** (curso): unidade de venda. Ex: "Inglês A1 Adulto". Tem idioma e nível CEFR.
- **Module** (módulo): agrupamento ordenado de lições dentro de um curso. Ex: "Module 01 — Foundations".
- **Lesson** (lição): unidade pedagógica equivalente a uma aula. Ex: "Lesson 03 — To be or not to be".
- **Part** (parte): subdivisão de uma lição (5-15 min cada). Geradas semi-automaticamente a partir das seções padrão dos PDFs de origem (Vocabulary, Lesson topic, Grammar, etc.). Admin pode editar livremente.
- **Block** (bloco): unidade atômica de conteúdo dentro de uma parte. Tipado (`type`) e com dados em JSONB (`data`).
- **Golden part** (parte dourada): parte de revisão gerada automaticamente ao final de cada lição. Recompensa extra ao gabaritar.
- **Star** (estrela): 1 a 3 estrelas por parte, baseado em desempenho nos exercícios daquela parte.
- **Enrollment** (matrícula): vincula um aluno (user) a um curso. É o ponto de autorização para ver conteúdo.
- **Exercise** (exercício): bloco com correção automática. Tipos: `multiple_choice`, `fill_blank`, `translation`, `reorder_words`, `error_correction`, etc.
- **User** (usuário): qualquer pessoa autenticada. Campo `role` diferencia: `student`, `teacher`, `admin`.
- **Streak**: sequência de dias consecutivos com atividade.
- **XP**: pontos de experiência ganhos por atividade.
- **SRS** (Spaced Repetition System): sistema de revisão espaçada. Cada conteúdo gera itens revisitados em intervalos crescentes.

## Convenções de código

### Geral
- TypeScript estrito (`strict: true` no `tsconfig`). Sem `any` exceto em casos extremos justificados.
- Imports absolutos via `@/` apontando para `src/`.
- Arquivos em `kebab-case.ts`. Componentes React em `PascalCase.tsx`. Hooks `use-camel-case.ts`.
- Um componente por arquivo. Nome do arquivo igual ao nome do componente exportado.
- Server Components por padrão. Marcar `'use client'` apenas quando necessário (interação, hooks de browser, estado local).

### Pastas (resumo, ver estrutura completa abaixo)
- `src/app/` — rotas (App Router)
- `src/components/` — UI: `ui/` primitivos, `blocks/` renderizadores, `exercises/` tipos de exercício, `shared/` compartilhados
- `src/lib/` — lógica pura (não-React): `supabase/`, `tts/`, `grading/`, `gamification/`, `utils.ts`
- `src/types/` — tipos TypeScript do domínio
- `src/styles/` — `globals.css`, `tokens.css`
- `supabase/` — `migrations/`, `seed.sql`, `functions/` (Edge Functions)
- `docs/decisions/` — ADRs numerados

### Design system
- **Nunca** usar cores hardcoded (`#fff`, `red`, `rgb(...)`). Sempre via tokens: `var(--color-text-primary)`, `text-fg-primary` (no Tailwind), etc.
- Tokens definidos em `src/styles/tokens.css`. Trocar paleta = mudar este arquivo.
- Modo claro e escuro suportados desde o dia 1. Cada token tem par claro/escuro.
- Componentes em `components/ui/` são os primitivos. Reutilizar antes de criar novos.

### Padrões Supabase
- **Sempre** usar Supabase CLI para criar migrations. Nunca mudar schema pelo Dashboard em produção.
- Toda tabela com dados de usuário **DEVE** ter RLS habilitada e políticas escritas. Sem exceção.
- Políticas RLS escritas em arquivos `.sql` versionados, comentadas explicando o "porquê".
- Clientes Supabase em `src/lib/supabase/`:
  - `server.ts` — cliente para Server Components e Server Actions (usa `cookies()`)
  - `browser.ts` — cliente para Client Components (`'use client'`)
  - `admin.ts` — cliente service_role, usar **apenas** em Edge Functions ou rotas server-only seguras

### Server Actions vs Route Handlers
- **Preferir Server Actions** (`'use server'`) para mutações disparadas da UI. São mais simples e type-safe.
- Route Handlers (`app/api/`) só para webhooks externos ou endpoints que precisam ser chamados de fora do app.

## Decisões arquiteturais importantes

Cada uma destas decisões tem um ADR completo em `docs/decisions/`. Aqui só o resumo:

1. **Blocos tipados com JSONB** (`ADR 0001`): cada `lesson_block` tem `type` (enum) + `data` (JSONB). Permite catálogo extensível de tipos sem migration nova a cada tipo.
2. **RLS para autorização** (`ADR 0002`): autorização "aluno só vê o curso em que está matriculado" mora no banco via RLS, não na aplicação. Aplicação confia no banco.
3. **TTS gerado uma vez e cacheado** (`ADR 0003`): cada combinação (texto + voz) gera MP3 uma vez via Edge Function, salva no Storage, e a partir daí serve do cache. Custo de TTS aproximadamente zero em regime.
4. **Lições divididas em partes** (`ADR 0004`): toda lição é uma sequência de partes (5-15 min cada). Geração inicial automática por seção dos PDFs; admin pode reorganizar livremente.
5. **Multi-tenant leve via teacher_id em courses** (`ADR 0005`): cada curso tem um professor responsável. Cada professor vê só seus alunos. RLS faz cumprir.
6. **Feedback em três estados com Levenshtein** (`ADR 0006`): exercícios de texto livre aceitam (1) perfeito = XP cheio, (2) quase lá = typo dentro de tolerância, XP parcial, (3) erro = XP zero + resposta correta exibida.

## O que está dentro/fora do MVP

**Dentro do MVP (4 semanas):**
- Autenticação e RLS funcionais
- 6 tipos de bloco essenciais: texto rico, vocabulário, leitura com TTS, diálogo com TTS, múltipla escolha, lacuna
- TTS Google Cloud com cache no Storage
- Sistema de lições, partes, blocos e progresso
- Gamificação básica: XP, streak, conquistas, partes douradas, estrelas
- Dashboard do aluno
- Sistema de feedback em três estados (perfeito/quase lá/erro)
- Marcação manual de itens para revisar
- Admin minimalista (formulários funcionais, sem polimento)
- Modo escuro
- Deploy em produção
- 3-4 lições reais de demonstração

**Fora do MVP (próximas fases):**
- Speaking com Web Speech API
- Revisão espaçada automática (SRS)
- Dashboard analítico do professor
- Calendário de aulas síncronas
- Glossário pessoal
- Modo offline / PWA
- Importação por PDF com IA (Claude API)
- Integração com sistema externo de frequência
- Section templates no admin
- Drag-and-drop de partes/blocos
- 14+ tipos de bloco adicionais
- App nas lojas (Capacitor)

## Convenções para o Claude Code

Quando trabalhando neste projeto, o Claude Code deve:

1. **Ler este arquivo primeiro** em qualquer nova sessão. Os termos e padrões aqui são autoridade.
2. **Antes de criar arquivos novos**, conferir se o que precisa já não existe (estrutura definida, primitivos em `ui/` reutilizáveis).
3. **Sempre criar migrations via Supabase CLI**, não SQL solto. Comando: `supabase migration new nome_descritivo`.
4. **Toda nova tabela** com dados de usuário precisa de RLS + política + comentário explicando o "porquê" da política.
5. **Nunca commitar** `.env.local`, chaves de API, ou qualquer credencial. Conferir `.gitignore` antes de adicionar arquivos.
6. **Commits pequenos e atômicos**. Mensagem no formato `tipo(escopo): descrição` (`feat(auth): adiciona login por email/senha`). Tipos: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`.
7. **Quando ambígua a abordagem**, perguntar antes de implementar. Não fazer escolhas arquiteturais grandes sem alinhar.
8. **Tipos do domínio** (`Lesson`, `Block`, `Exercise`, etc.) vivem em `src/types/`. Importar de lá, não redefinir localmente.
9. **Ao adicionar dependência nova**, justificar por que ela é necessária antes de instalar.
10. **Ao mexer em RLS**, sempre testar com pelo menos dois usuários diferentes para validar o isolamento.

## Como rodar o projeto

```bash
# Primeira vez
pnpm install
cp .env.example .env.local           # preencher chaves
supabase start                        # inicia Postgres local + serviços (Docker)
supabase db reset                     # aplica migrations + seed
pnpm dev                              # inicia Next.js em http://localhost:3000

# Dia a dia
supabase start                        # se já estava parado
pnpm dev

# Criar migration nova
supabase migration new nome_descritivo
# (edita o arquivo gerado em supabase/migrations/)
supabase db reset                     # aplica localmente

# Deploy de migrations para produção
supabase link --project-ref REF       # uma vez
supabase db push                      # envia migrations pendentes
```

## Contato e responsável

Projeto desenvolvido por Alexandre, com Claude (chat) atuando como projetista/arquiteto e Claude Code atuando como par de programação. Decisões arquiteturais grandes são tomadas em conversa no chat antes de virar código.