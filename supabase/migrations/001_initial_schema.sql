create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('ADMIN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  content text not null,
  category text not null check (category in ('concept', 'dbms', 'advanced', 'case')),
  level text,
  status text not null check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null check (type in ('DBMS', 'TOPIC', 'ADVANCED', 'OPERATION', 'CASE', 'INTERNAL')),
  created_at timestamptz not null default now()
);

create table if not exists public.document_tags (
  document_id uuid references public.documents(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (document_id, tag_id)
);

create table if not exists public.official_docs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  dbms text not null,
  title text not null,
  url text not null,
  note text,
  version text,
  created_at timestamptz not null default now()
);

create table if not exists public.document_relations (
  source_document_id uuid references public.documents(id) on delete cascade,
  target_document_id uuid references public.documents(id) on delete cascade,
  relation_type text not null,
  primary key (source_document_id, target_document_id, relation_type)
);

create index if not exists documents_public_idx on public.documents (status, slug) where deleted_at is null;
create index if not exists documents_category_idx on public.documents (category) where deleted_at is null;
create index if not exists tags_type_idx on public.tags (type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
  );
$$;

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.tags enable row level security;
alter table public.document_tags enable row level security;
alter table public.official_docs enable row level security;
alter table public.document_relations enable row level security;

drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles" on public.profiles
for select using (public.is_admin() or id = auth.uid());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles" on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read published documents" on public.documents;
create policy "Public can read published documents" on public.documents
for select using (status = 'published' and deleted_at is null);

drop policy if exists "Admins can read all documents" on public.documents;
create policy "Admins can read all documents" on public.documents
for select using (public.is_admin());

drop policy if exists "Admins can manage documents" on public.documents;
create policy "Admins can manage documents" on public.documents
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read tags" on public.tags;
create policy "Public can read tags" on public.tags
for select using (true);

drop policy if exists "Admins can manage tags" on public.tags;
create policy "Admins can manage tags" on public.tags
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read document tags for published documents" on public.document_tags;
create policy "Public can read document tags for published documents" on public.document_tags
for select using (
  exists (
    select 1 from public.documents
    where documents.id = document_tags.document_id
      and documents.status = 'published'
      and documents.deleted_at is null
  )
);

drop policy if exists "Admins can manage document tags" on public.document_tags;
create policy "Admins can manage document tags" on public.document_tags
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read official docs for published documents" on public.official_docs;
create policy "Public can read official docs for published documents" on public.official_docs
for select using (
  exists (
    select 1 from public.documents
    where documents.id = official_docs.document_id
      and documents.status = 'published'
      and documents.deleted_at is null
  )
);

drop policy if exists "Admins can manage official docs" on public.official_docs;
create policy "Admins can manage official docs" on public.official_docs
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read relations for published documents" on public.document_relations;
create policy "Public can read relations for published documents" on public.document_relations
for select using (
  exists (
    select 1 from public.documents
    where documents.id = document_relations.source_document_id
      and documents.status = 'published'
      and documents.deleted_at is null
  )
);

drop policy if exists "Admins can manage relations" on public.document_relations;
create policy "Admins can manage relations" on public.document_relations
for all using (public.is_admin()) with check (public.is_admin());
