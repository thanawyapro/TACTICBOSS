-- Tactic Boss AI V130 — Coach OS cloud state
-- Run once in Supabase SQL Editor. The app remains usable with local storage if this migration is not installed.

create table if not exists public.coach_os_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_os_state_updated_at_idx
  on public.coach_os_state(updated_at desc);

alter table public.coach_os_state enable row level security;

drop policy if exists coach_os_state_select_own on public.coach_os_state;
create policy coach_os_state_select_own
  on public.coach_os_state
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists coach_os_state_insert_own on public.coach_os_state;
create policy coach_os_state_insert_own
  on public.coach_os_state
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists coach_os_state_update_own on public.coach_os_state;
create policy coach_os_state_update_own
  on public.coach_os_state
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists coach_os_state_delete_own on public.coach_os_state;
create policy coach_os_state_delete_own
  on public.coach_os_state
  for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.coach_os_state from anon;
grant select, insert, update, delete on table public.coach_os_state to authenticated;

comment on table public.coach_os_state is
  'Per-user Coach OS V130 state: match journal, coach memory inputs, rival profiles, arena scores, rescue draft, tactical lab draft and tactical passport identity.';
