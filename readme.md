# Portal de Idiomas

Plataforma de aprendizado para escola de idiomas (inglês e espanhol). Aluno acessa conteúdo de lições do curso em que está matriculado, com exercícios autocorrigidos, áudios via TTS e gamificação. Complementa aulas síncronas presenciais/online.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions)
- **TTS**: Google Cloud Text-to-Speech
- **Deploy**: Vercel + Supabase Cloud

## Pré-requisitos

- Node.js 20 LTS ou superior
- pnpm 9+
- Docker Desktop (para Supabase local)
- Supabase CLI
- Git

## Setup inicial

```bash
git clone <url-do-repo>
cd portal-idiomas
pnpm install
cp .env.example .env.local
# Editar .env.local com as chaves apropriadas
supabase start
supabase db reset
pnpm dev
```

Acesse `http://localhost:3000`.

## Documentação

- **`CLAUDE.md`** — contexto do projeto, glossário do domínio, convenções de código. **Leia antes de qualquer coisa.**
- **`docs/decisions/`** — Architecture Decision Records (ADRs) documentando decisões importantes.
- **`docs/domain.md`** — glossário expandido do domínio e regras de negócio.

## Comandos úteis

```bash
pnpm dev              # servidor de desenvolvimento
pnpm build            # build de produção
pnpm lint             # roda ESLint
pnpm type-check       # valida tipos TypeScript

supabase start        # sobe stack local (Postgres, Auth, Storage)
supabase stop         # encerra stack local
supabase db reset     # reseta banco local e aplica migrations + seed
supabase migration new nome    # cria nova migration
```

## Licença

Projeto privado.