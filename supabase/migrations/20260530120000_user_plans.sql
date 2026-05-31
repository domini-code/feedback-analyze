-- public.user_plans — per-user billing plan and Stripe identifiers.
-- Schema and policies follow openspec/changes/add-stripe-payments/design.md decisions 1 and 2.
-- A user with no row is treated as 'free' by the application (lib/plans.ts).

create table public.user_plans (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  plan                   text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.user_plans enable row level security;

-- Users may read their own plan. Plan changes only ever come from the Stripe
-- webhook, which writes via the service-role key and bypasses RLS — so there is
-- deliberately no insert/update/delete policy for end users.
create policy "user_plans_select_own"
  on public.user_plans for select
  using (auth.uid() = user_id);
