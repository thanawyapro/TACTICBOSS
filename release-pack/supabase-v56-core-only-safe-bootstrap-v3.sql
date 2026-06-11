-- Tactic Boss AI v56 — Production Safe Bootstrap
-- Idempotent and additive: safe to run whether v55 was fully applied, partially applied, or not applied.
-- Does not delete existing application data.

create extension if not exists pgcrypto;

-- =========================================================
-- V55 REQUIRED FOUNDATIONS
-- =========================================================

create table if not exists public.user_progression (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 1 check (streak >= 0),
  last_active_date date not null default current_date,
  completed_challenge_ids jsonb not null default '[]'::jsonb,
  activity jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.daily_challenges (
  id text primary key,
  title_key text not null,
  description_key text not null,
  action_type text not null check (action_type in ('generate','save','rival','improve','daily_plan','challenge')),
  xp_reward integer not null default 25 check (xp_reward > 0),
  difficulty text not null default 'easy' check (difficulty in ('easy','medium','hard')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id text not null references public.daily_challenges(id) on delete cascade,
  completed_at timestamptz not null default now(),
  xp_awarded integer not null default 0,
  unique(user_id, challenge_id)
);

create index if not exists user_challenge_progress_user_idx
  on public.user_challenge_progress(user_id, completed_at desc);

alter table public.user_progression enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.user_challenge_progress enable row level security;

drop policy if exists user_progression_select_own on public.user_progression;
create policy user_progression_select_own on public.user_progression
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists user_progression_insert_own on public.user_progression;
create policy user_progression_insert_own on public.user_progression
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists user_progression_update_own on public.user_progression;
create policy user_progression_update_own on public.user_progression
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists daily_challenges_read_active on public.daily_challenges;
create policy daily_challenges_read_active on public.daily_challenges
  for select to authenticated
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists challenge_progress_select_own on public.user_challenge_progress;
create policy challenge_progress_select_own on public.user_challenge_progress
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists challenge_progress_insert_own on public.user_challenge_progress;
create policy challenge_progress_insert_own on public.user_challenge_progress
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.user_progression, public.daily_challenges, public.user_challenge_progress from anon;
grant select, insert, update on public.user_progression to authenticated;
grant select on public.daily_challenges to authenticated;
grant select, insert on public.user_challenge_progress to authenticated;

insert into public.user_progression(user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function public.provision_user_progression()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_progression(user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.provision_user_progression() from public;

drop trigger if exists on_auth_user_created_progression on auth.users;
create trigger on_auth_user_created_progression
after insert on auth.users
for each row execute function public.provision_user_progression();

insert into public.daily_challenges(id, title_key, description_key, action_type, xp_reward, difficulty)
values
  ('generate-first-plan','challenge.generate.title','challenge.generate.description','generate',30,'easy'),
  ('improve-own-tactic','challenge.improve.title','challenge.improve.description','improve',45,'medium'),
  ('scout-a-rival','challenge.rival.title','challenge.rival.description','rival',55,'hard'),
  ('save-tactical-idea','challenge.save.title','challenge.save.description','save',25,'easy')
on conflict (id) do update set
  xp_reward = excluded.xp_reward,
  difficulty = excluded.difficulty,
  is_active = true;

-- =========================================================
-- V56 AI ANALYSIS TABLES
-- =========================================================

create table if not exists public.screenshot_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_name text not null,
  analysis_type text not null default 'opponent'
    check (analysis_type in ('squad','opponent','formation','match_result','stats','heatmap','board')),
  result_data jsonb not null default '{}'::jsonb,
  image_preview text,
  created_at timestamptz not null default now()
);

create table if not exists public.match_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_name text not null,
  result_data jsonb not null default '{}'::jsonb,
  image_preview text,
  created_at timestamptz not null default now()
);

create index if not exists screenshot_analyses_user_created_idx
  on public.screenshot_analyses(user_id, created_at desc);
create index if not exists match_analyses_user_created_idx
  on public.match_analyses(user_id, created_at desc);

alter table public.screenshot_analyses enable row level security;
alter table public.match_analyses enable row level security;

drop policy if exists screenshot_analyses_select_own on public.screenshot_analyses;
create policy screenshot_analyses_select_own on public.screenshot_analyses
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists screenshot_analyses_insert_own on public.screenshot_analyses;
create policy screenshot_analyses_insert_own on public.screenshot_analyses
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists screenshot_analyses_delete_own on public.screenshot_analyses;
create policy screenshot_analyses_delete_own on public.screenshot_analyses
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists match_analyses_select_own on public.match_analyses;
create policy match_analyses_select_own on public.match_analyses
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists match_analyses_insert_own on public.match_analyses;
create policy match_analyses_insert_own on public.match_analyses
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists match_analyses_delete_own on public.match_analyses;
create policy match_analyses_delete_own on public.match_analyses
  for delete to authenticated using (auth.uid() = user_id);

revoke all on public.screenshot_analyses, public.match_analyses from anon;
grant select, insert, delete on public.screenshot_analyses to authenticated;
grant select, insert, delete on public.match_analyses to authenticated;

insert into public.daily_challenges(id, title_key, description_key, action_type, xp_reward, difficulty)
values
  ('analyze-screenshot','challenge.screenshot.title','challenge.screenshot.description','challenge',35,'medium'),
  ('analyze-match','challenge.match.title','challenge.match.description','challenge',50,'hard')
on conflict (id) do update set
  xp_reward = excluded.xp_reward,
  difficulty = excluded.difficulty,
  is_active = true;

-- =========================================================
-- META CENTER
-- =========================================================
-- Deliberately untouched in this bootstrap. Existing deployments use different
-- meta_tactics schemas, so Meta Center migration must be handled separately
-- after inspecting the live schema. Core v55/v56 tables do not depend on it.

-- =========================================================
-- VERIFICATION RESULT
-- =========================================================

select
  to_regclass('public.user_progression') as user_progression,
  to_regclass('public.daily_challenges') as daily_challenges,
  to_regclass('public.user_challenge_progress') as user_challenge_progress,
  to_regclass('public.screenshot_analyses') as screenshot_analyses,
  to_regclass('public.match_analyses') as match_analyses;
