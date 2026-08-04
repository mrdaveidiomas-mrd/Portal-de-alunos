-- Migration: content_and_enrollment
-- Hierarquia de conteúdo (course -> module -> lesson -> part -> block) +
-- matrículas, com RLS baseada em matrícula/professor/admin (ADR 0002, 0005) e
-- gating de publicação para alunos.
--
-- Decisões:
--  - Helpers de RLS no schema `private` (não exposto pela API REST), evitando
--    expô-los como RPC público.
--  - course_id desnormalizado em modules/lessons/parts/blocks (e lesson_id em
--    blocks) para políticas RLS simples e sem joins. A coerência hierárquica
--    entre os níveis é responsabilidade do app/seed; as FKs garantem apenas
--    integridade referencial.
--  - blocks.type é text (não enum): catálogo de tipos extensível no app sem
--    migration a cada tipo novo (ADR 0001).

-- =====================================================================
-- Enums de domínio
-- =====================================================================
create type public.course_language as enum ('en', 'es');
create type public.cefr_level as enum ('a1', 'a2', 'b1', 'b2', 'c1', 'c2');
create type public.part_kind as enum ('regular', 'golden');

-- =====================================================================
-- Schema privado para helpers de RLS (PostgREST só expõe public/graphql_public)
-- =====================================================================
create schema if not exists private;
grant usage on schema private to authenticated, anon;

-- =====================================================================
-- Tabelas
-- =====================================================================
create table public.courses (
  id           uuid primary key default gen_random_uuid(),
  language     public.course_language not null,
  level        public.cefr_level not null,
  title        text not null,
  slug         text not null unique,
  description  text,
  teacher_id   uuid references public.profiles (id) on delete set null,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table public.courses is
  'Curso = unidade de venda (idioma + nível CEFR). teacher_id = professor responsável (ADR 0005).';

create table public.modules (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses (id) on delete cascade,
  title      text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id           uuid primary key default gen_random_uuid(),
  module_id    uuid not null references public.modules (id) on delete cascade,
  course_id    uuid not null references public.courses (id) on delete cascade,
  title        text not null,
  position     integer not null default 0,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.parts (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references public.lessons (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  title      text not null,
  position   integer not null default 0,
  kind       public.part_kind not null default 'regular',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.parts.kind is
  'regular ou golden (parte dourada de revisão gerada ao fim da lição, ADR 0004).';

create table public.blocks (
  id         uuid primary key default gen_random_uuid(),
  part_id    uuid not null references public.parts (id) on delete cascade,
  lesson_id  uuid not null references public.lessons (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  type       text not null,
  data       jsonb not null default '{}'::jsonb,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.blocks.type is
  'Tipo do bloco (text, não enum) — catálogo extensível no app sem migration (ADR 0001).';

create table public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
comment on table public.enrollments is
  'Matrícula: vincula aluno a curso. Ponto de autorização para ver conteúdo (ADR 0002).';

-- Índices para FKs e ordenação
create index on public.modules (course_id);
create index on public.lessons (module_id);
create index on public.lessons (course_id);
create index on public.parts (lesson_id);
create index on public.parts (course_id);
create index on public.blocks (part_id);
create index on public.blocks (lesson_id);
create index on public.blocks (course_id);
create index on public.enrollments (course_id);
create index on public.enrollments (user_id);

-- =====================================================================
-- Helpers de RLS (schema private, SECURITY DEFINER para ignorar a RLS das
-- tabelas que consultam e evitar recursão de políticas).
-- =====================================================================
create function private.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function private.is_course_teacher(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.courses
    where id = p_course_id and teacher_id = (select auth.uid())
  );
$$;

create function private.is_enrolled(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.enrollments
    where course_id = p_course_id
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

create function private.is_course_staff(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_admin() or private.is_course_teacher(p_course_id);
$$;

-- Aluno acessa o curso se matriculado E o curso está publicado. Staff sempre.
create function private.can_access_course(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_course_staff(p_course_id)
    or (
      private.is_enrolled(p_course_id)
      and exists (
        select 1 from public.courses
        where id = p_course_id and is_published
      )
    );
$$;

create function private.lesson_is_published(p_lesson_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.lessons
    where id = p_lesson_id and is_published
  );
$$;

-- =====================================================================
-- RLS
-- Padrão: uma policy de SELECT (regra de leitura aluno/staff) + uma policy
-- FOR ALL para escrita só de staff. Policies permissivas são combinadas com OR.
-- =====================================================================

-- ---- courses ----
alter table public.courses enable row level security;

create policy "courses_select" on public.courses
  for select using ( private.can_access_course(id) );

create policy "courses_insert" on public.courses
  for insert with check ( private.is_admin() or teacher_id = (select auth.uid()) );

create policy "courses_update" on public.courses
  for update using ( private.is_course_staff(id) )
  with check ( private.is_course_staff(id) );

create policy "courses_delete" on public.courses
  for delete using ( private.is_course_staff(id) );

-- ---- modules ----
alter table public.modules enable row level security;

create policy "modules_select" on public.modules
  for select using ( private.can_access_course(course_id) );

create policy "modules_staff_all" on public.modules
  for all using ( private.is_course_staff(course_id) )
  with check ( private.is_course_staff(course_id) );

-- ---- lessons ----
alter table public.lessons enable row level security;

create policy "lessons_select" on public.lessons
  for select using (
    private.is_course_staff(course_id)
    or (private.can_access_course(course_id) and is_published)
  );

create policy "lessons_staff_all" on public.lessons
  for all using ( private.is_course_staff(course_id) )
  with check ( private.is_course_staff(course_id) );

-- ---- parts ----
alter table public.parts enable row level security;

create policy "parts_select" on public.parts
  for select using (
    private.is_course_staff(course_id)
    or (private.can_access_course(course_id) and private.lesson_is_published(lesson_id))
  );

create policy "parts_staff_all" on public.parts
  for all using ( private.is_course_staff(course_id) )
  with check ( private.is_course_staff(course_id) );

-- ---- blocks ----
alter table public.blocks enable row level security;

create policy "blocks_select" on public.blocks
  for select using (
    private.is_course_staff(course_id)
    or (private.can_access_course(course_id) and private.lesson_is_published(lesson_id))
  );

create policy "blocks_staff_all" on public.blocks
  for all using ( private.is_course_staff(course_id) )
  with check ( private.is_course_staff(course_id) );

-- ---- enrollments ----
alter table public.enrollments enable row level security;

-- Aluno vê a própria matrícula; staff vê as matrículas dos seus cursos.
create policy "enrollments_select" on public.enrollments
  for select using (
    user_id = (select auth.uid()) or private.is_course_staff(course_id)
  );

-- Matrículas são geridas por staff (não há auto-matrícula de aluno).
create policy "enrollments_staff_all" on public.enrollments
  for all using ( private.is_course_staff(course_id) )
  with check ( private.is_course_staff(course_id) );

-- =====================================================================
-- Triggers de updated_at (reaproveita public.set_updated_at da auth_foundation)
-- =====================================================================
create trigger courses_set_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
create trigger modules_set_updated_at before update on public.modules
  for each row execute function public.set_updated_at();
create trigger lessons_set_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();
create trigger parts_set_updated_at before update on public.parts
  for each row execute function public.set_updated_at();
create trigger blocks_set_updated_at before update on public.blocks
  for each row execute function public.set_updated_at();
