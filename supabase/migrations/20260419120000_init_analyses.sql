-- public.analyses — per-user persistence for feedback classifications.
-- Schema and policies follow openspec/changes/add-supabase-auth-and-persistence/design.md decisions 4 and 5.

create table public.analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  input_text  text not null,
  items       jsonb not null,
  summary     jsonb not null,
  created_at  timestamptz not null default now()
);

create index analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;

create policy "analyses_select_own"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "analyses_insert_own"
  on public.analyses for insert
  with check (auth.uid() = user_id);
