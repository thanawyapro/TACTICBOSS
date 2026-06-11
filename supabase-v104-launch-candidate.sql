-- Tactic Boss AI V104 — Launch Candidate Stability + Complete Product QA
-- Idempotent final launch migration.
-- Safe to run after older Tactic Boss migrations. It also creates the core tables needed by V104 if they do not exist.
-- Run in Supabase SQL Editor before public launch.

create extension if not exists pgcrypto;

-- ================================================================
-- 1) Core user-owned tables required by the app
-- ================================================================
create table if not exists public.users_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  favorite_game text,
  tactic_dna jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  theme text default 'theme-dark',
  language text default 'ar',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan text default 'free',
  status text default 'active',
  ai_monthly_limit integer default 30,
  saved_tactics_limit integer default 25,
  rivals_limit integer default 5,
  started_at timestamptz default now(),
  expires_at timestamptz,
  updated_at timestamptz default now(),
  constraint subscriptions_plan_check check (plan in ('free','pro','elite')),
  constraint subscriptions_status_check check (status in ('active','trialing','past_due','cancelled','expired'))
);

create table if not exists public.saved_tactics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  game text,
  user_formation text,
  opponent_formation text,
  user_style text,
  opponent_style text,
  match_state text,
  team text,
  opponent_team text,
  input_data jsonb default '{}'::jsonb,
  result_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.rivals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  favorite_game text,
  favorite_formation text,
  favorite_team text,
  playstyle text,
  strengths text,
  weaknesses text,
  notes text,
  board_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  request_type text,
  game text,
  provider text,
  input_data jsonb default '{}'::jsonb,
  result_data jsonb default '{}'::jsonb,
  success boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.user_progression (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0,
  streak integer not null default 1,
  last_active_date date not null default current_date,
  completed_challenge_ids text[] not null default '{}'::text[],
  activity jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_progression_xp_check check (xp >= 0 and xp <= 1000000),
  constraint user_progression_streak_check check (streak >= 0 and streak <= 3650)
);

-- Add missing columns safely for older installs.
alter table public.saved_tactics add column if not exists updated_at timestamptz default now();
alter table public.rivals add column if not exists favorite_team text;
alter table public.rivals add column if not exists board_data jsonb;
alter table public.rivals add column if not exists updated_at timestamptz default now();
alter table public.ai_requests add column if not exists provider text;
alter table public.ai_requests add column if not exists success boolean default true;
alter table public.subscriptions add column if not exists ai_monthly_limit integer default 30;
alter table public.subscriptions add column if not exists saved_tactics_limit integer default 25;
alter table public.subscriptions add column if not exists rivals_limit integer default 5;
alter table public.subscriptions add column if not exists updated_at timestamptz default now();

create unique index if not exists users_profile_user_id_uidx on public.users_profile(user_id);
create unique index if not exists user_settings_user_id_uidx on public.user_settings(user_id);
create unique index if not exists subscriptions_user_id_uidx on public.subscriptions(user_id);
create index if not exists saved_tactics_user_id_created_idx on public.saved_tactics(user_id, created_at desc);
create index if not exists rivals_user_id_created_idx on public.rivals(user_id, created_at desc);
create index if not exists ai_requests_user_id_created_idx on public.ai_requests(user_id, created_at desc);

-- ================================================================
-- 2) Coach League + server-side AI cost guard
-- ================================================================
create table if not exists public.coach_competition_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text default 'Coach',
  total_points integer not null default 0,
  weekly_points integer not null default 0,
  season_points integer not null default 0,
  week_key text not null default to_char(now(), 'IYYY-"W"IW'),
  season_key text not null default to_char(now(), 'YYYY-MM'),
  current_streak integer not null default 1,
  last_active_date date not null default current_date,
  badges text[] not null default '{}'::text[],
  daily_usage jsonb not null default jsonb_build_object('date', current_date::text, 'text_generation', 0, 'vision_analysis', 0, 'match_analysis', 0, 'coach_tip', 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coach_points_non_negative check (total_points >= 0 and weekly_points >= 0 and season_points >= 0)
);

create table if not exists public.competition_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  points integer not null default 0,
  meta jsonb not null default '{}'::jsonb,
  day_key date not null default current_date,
  week_key text not null default to_char(now(), 'IYYY-"W"IW'),
  season_key text not null default to_char(now(), 'YYYY-MM'),
  created_at timestamptz not null default now(),
  constraint competition_events_points_check check (points >= 0 and points <= 500),
  constraint competition_events_event_type_len check (char_length(event_type) between 2 and 48)
);

create index if not exists competition_events_user_day_type_idx on public.competition_events(user_id, day_key, event_type);
create index if not exists competition_events_week_points_idx on public.competition_events(week_key, points desc);
create index if not exists coach_competition_week_points_idx on public.coach_competition_profiles(week_key, weekly_points desc);

create or replace function public.ensure_user_progression()
returns public.user_progression
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.user_progression;
begin
  if uid is null then raise exception 'UNAUTHORIZED'; end if;
  insert into public.user_progression(user_id)
  values(uid)
  on conflict (user_id) do nothing;
  select * into row from public.user_progression where user_id = uid;
  return row;
end;
$$;

create or replace function public.ensure_coach_competition_profile()
returns public.coach_competition_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.coach_competition_profiles;
  display text := 'Coach';
begin
  if uid is null then raise exception 'UNAUTHORIZED'; end if;
  select coalesce(display_name, 'Coach') into display from public.users_profile where user_id = uid;
  insert into public.coach_competition_profiles(user_id, display_name)
  values(uid, coalesce(display, 'Coach'))
  on conflict (user_id) do update set
    display_name = coalesce(excluded.display_name, public.coach_competition_profiles.display_name),
    updated_at = now();
  select * into row from public.coach_competition_profiles where user_id = uid;
  return row;
end;
$$;

create or replace function public.competition_event_points(p_event_type text)
returns integer
language sql
stable
as $$
  select case p_event_type
    when 'generate_plan' then 20
    when 'save_tactic' then 30
    when 'rival_profile' then 40
    when 'daily_challenge' then 80
    when 'screenshot_analysis' then 60
    when 'match_analysis' then 70
    when 'share_card' then 25
    when 'board_scan' then 20
    when 'improve_tactic' then 45
    else 10
  end;
$$;

create or replace function public.competition_daily_cap(p_event_type text)
returns integer
language sql
stable
as $$
  select case p_event_type
    when 'generate_plan' then 3
    when 'save_tactic' then 5
    when 'rival_profile' then 3
    when 'daily_challenge' then 1
    when 'screenshot_analysis' then 1
    when 'match_analysis' then 1
    when 'share_card' then 3
    when 'board_scan' then 3
    when 'improve_tactic' then 2
    else 3
  end;
$$;

create or replace function public.rank_title_for_points(p_points integer)
returns text
language sql
stable
as $$
  select case
    when p_points >= 3000 then 'Tactic Boss Legend'
    when p_points >= 1500 then 'Meta Master'
    when p_points >= 750 then 'Elite Tactician'
    when p_points >= 300 then 'Pro Analyst'
    when p_points >= 100 then 'Smart Coach'
    else 'Rookie Coach'
  end;
$$;

create or replace function public.next_competition_badges(p_badges text[], p_weekly integer, p_season integer, p_streak integer, p_event_type text)
returns text[]
language plpgsql
stable
as $$
declare
  badges text[] := coalesce(p_badges, '{}'::text[]);
begin
  if p_streak >= 3 and not ('streak-3' = any(badges)) then badges := badges || 'streak-3'; end if;
  if p_streak >= 7 and not ('streak-7' = any(badges)) then badges := badges || 'streak-7'; end if;
  if p_weekly >= 250 and not ('weekly-250' = any(badges)) then badges := badges || 'weekly-250'; end if;
  if p_season >= 1000 and not ('season-1000' = any(badges)) then badges := badges || 'season-1000'; end if;
  if p_event_type = 'daily_challenge' and not ('daily-rival' = any(badges)) then badges := badges || 'daily-rival'; end if;
  if p_event_type = 'screenshot_analysis' and not ('vision-scout' = any(badges)) then badges := badges || 'vision-scout'; end if;
  if p_event_type = 'save_tactic' and not ('plan-keeper' = any(badges)) then badges := badges || 'plan-keeper'; end if;
  return badges[1:30];
end;
$$;

create or replace function public.award_competition_points(p_event_type text, p_meta jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p public.coach_competition_profiles;
  wk text := to_char(now(), 'IYYY-"W"IW');
  ssn text := to_char(now(), 'YYYY-MM');
  today date := current_date;
  cap integer;
  today_count integer;
  pts integer;
  streak integer;
  next_weekly integer;
  next_season integer;
  next_total integer;
  next_badges text[];
begin
  if uid is null then raise exception 'UNAUTHORIZED'; end if;
  if p_event_type is null or p_event_type not in ('generate_plan','save_tactic','rival_profile','daily_challenge','screenshot_analysis','match_analysis','share_card','board_scan','improve_tactic') then raise exception 'INVALID_EVENT'; end if;
  if pg_column_size(coalesce(p_meta, '{}'::jsonb)) > 8192 then raise exception 'META_TOO_LARGE'; end if;

  p := public.ensure_coach_competition_profile();
  perform 1 from public.coach_competition_profiles where user_id = uid for update;
  select * into p from public.coach_competition_profiles where user_id = uid;

  if p.week_key <> wk then p.weekly_points := 0; p.week_key := wk; end if;
  if p.season_key <> ssn then p.season_points := 0; p.season_key := ssn; end if;

  cap := public.competition_daily_cap(p_event_type);
  select count(*) into today_count from public.competition_events where user_id = uid and day_key = today and event_type = p_event_type;
  if today_count >= cap then
    return jsonb_build_object('ok', true, 'capped', true, 'gained', 0, 'weekly_points', p.weekly_points, 'season_points', p.season_points, 'total_points', p.total_points, 'current_streak', p.current_streak, 'badges', p.badges);
  end if;

  pts := public.competition_event_points(p_event_type);
  streak := case when p.last_active_date = today then p.current_streak when p.last_active_date = today - interval '1 day' then p.current_streak + 1 else 1 end;
  next_weekly := greatest(0, p.weekly_points) + pts;
  next_season := greatest(0, p.season_points) + pts;
  next_total := greatest(0, p.total_points) + pts;
  next_badges := public.next_competition_badges(p.badges, next_weekly, next_season, streak, p_event_type);

  insert into public.competition_events(user_id, event_type, points, meta, day_key, week_key, season_key)
  values(uid, p_event_type, pts, coalesce(p_meta, '{}'::jsonb), today, wk, ssn);

  update public.coach_competition_profiles set
    total_points = next_total,
    weekly_points = next_weekly,
    season_points = next_season,
    week_key = wk,
    season_key = ssn,
    current_streak = streak,
    last_active_date = today,
    badges = next_badges,
    updated_at = now()
  where user_id = uid;

  return jsonb_build_object('ok', true, 'capped', false, 'gained', pts, 'weekly_points', next_weekly, 'season_points', next_season, 'total_points', next_total, 'current_streak', streak, 'badges', next_badges);
end;
$$;

create or replace function public.ai_daily_cap(p_plan text, p_kind text)
returns integer
language sql
stable
as $$
  select case coalesce(p_plan, 'free')
    when 'elite' then case p_kind when 'vision_analysis' then 20 when 'match_analysis' then 20 when 'coach_tip' then 60 else 60 end
    when 'pro' then case p_kind when 'vision_analysis' then 5 when 'match_analysis' then 5 when 'coach_tip' then 20 else 15 end
    else case p_kind when 'vision_analysis' then 1 when 'match_analysis' then 1 when 'coach_tip' then 5 else 3 end
  end;
$$;

create or replace function public.consume_daily_ai_usage(p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p public.coach_competition_profiles;
  plan_name text := 'free';
  usage jsonb;
  today text := current_date::text;
  used integer;
  allowed integer;
begin
  if uid is null then raise exception 'UNAUTHORIZED'; end if;
  if p_kind not in ('text_generation','vision_analysis','match_analysis','coach_tip') then raise exception 'INVALID_USAGE_KIND'; end if;

  p := public.ensure_coach_competition_profile();
  perform 1 from public.coach_competition_profiles where user_id = uid for update;
  select * into p from public.coach_competition_profiles where user_id = uid;
  select coalesce(plan, 'free') into plan_name from public.subscriptions where user_id = uid and status in ('active','trialing') limit 1;
  plan_name := coalesce(plan_name, 'free');
  allowed := public.ai_daily_cap(plan_name, p_kind);

  usage := coalesce(p.daily_usage, '{}'::jsonb);
  if usage->>'date' is distinct from today then
    usage := jsonb_build_object('date', today, 'text_generation', 0, 'vision_analysis', 0, 'match_analysis', 0, 'coach_tip', 0);
  end if;
  used := coalesce((usage->>p_kind)::integer, 0);
  if used >= allowed then
    raise exception 'DAILY_AI_LIMIT_REACHED';
  end if;
  usage := jsonb_set(usage, array[p_kind], to_jsonb(used + 1), true);
  update public.coach_competition_profiles set daily_usage = usage, updated_at = now() where user_id = uid;
  return jsonb_build_object('ok', true, 'kind', p_kind, 'used', used + 1, 'limit', allowed, 'plan', plan_name, 'usage', usage);
end;
$$;

create or replace function public.get_weekly_coach_leaderboard(p_limit integer default 50)
returns table(user_id uuid, display_name text, weekly_points integer, rank_title text)
language sql
security definer
set search_path = public
as $$
  select p.user_id, coalesce(p.display_name, 'Coach') as display_name, p.weekly_points, public.rank_title_for_points(p.season_points) as rank_title
  from public.coach_competition_profiles p
  where p.week_key = to_char(now(), 'IYYY-"W"IW')
  order by p.weekly_points desc, p.updated_at asc
  limit least(greatest(coalesce(p_limit, 50), 1), 50);
$$;

-- ================================================================
-- 3) XP Feature Unlocks cloud sync, hardened to server-side XP
-- ================================================================
create table if not exists public.user_feature_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_id text not null,
  level_required integer not null default 1,
  xp_required integer not null default 0,
  title text,
  unlocked_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  primary key (user_id, feature_id),
  constraint user_feature_unlocks_feature_id_len check (char_length(feature_id) between 2 and 64),
  constraint user_feature_unlocks_level_check check (level_required between 1 and 100),
  constraint user_feature_unlocks_xp_check check (xp_required between 0 and 1000000)
);
create index if not exists user_feature_unlocks_user_level_idx on public.user_feature_unlocks(user_id, level_required, xp_required);

create or replace function public.sync_user_feature_unlocks(p_xp integer, p_unlocks jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  inserted_count integer := 0;
  server_xp integer := 0;
  req_xp integer;
begin
  if uid is null then raise exception 'UNAUTHORIZED'; end if;
  if jsonb_typeof(coalesce(p_unlocks, '[]'::jsonb)) <> 'array' then raise exception 'INVALID_UNLOCKS'; end if;
  if jsonb_array_length(coalesce(p_unlocks, '[]'::jsonb)) > 30 then raise exception 'TOO_MANY_UNLOCKS'; end if;
  if pg_column_size(coalesce(p_unlocks, '[]'::jsonb)) > 32768 then raise exception 'UNLOCKS_TOO_LARGE'; end if;

  perform public.ensure_user_progression();
  select coalesce(xp,0) into server_xp from public.user_progression where user_id = uid;
  -- Fallback for installs using only Coach League points.
  select greatest(server_xp, coalesce((select total_points from public.coach_competition_profiles where user_id = uid),0)) into server_xp;

  for item in select * from jsonb_array_elements(coalesce(p_unlocks, '[]'::jsonb)) loop
    req_xp := greatest(0, least(1000000, coalesce((item->>'xp_required')::integer, 0)));
    if coalesce(item->>'feature_id', '') <> '' and req_xp <= server_xp then
      insert into public.user_feature_unlocks(user_id, feature_id, level_required, xp_required, title, unlocked_at, last_synced_at)
      values(
        uid,
        left(item->>'feature_id', 64),
        greatest(1, least(100, coalesce((item->>'level_required')::integer, 1))),
        req_xp,
        left(coalesce(item->>'title', item->>'feature_id'), 160),
        now(),
        now()
      )
      on conflict (user_id, feature_id) do update set
        level_required = excluded.level_required,
        xp_required = excluded.xp_required,
        title = excluded.title,
        last_synced_at = now();
      inserted_count := inserted_count + 1;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'synced', inserted_count, 'client_xp_ignored', coalesce(p_xp,0), 'server_xp', server_xp);
end;
$$;

-- ================================================================
-- 4) RLS, grants, and safe backfills
-- ================================================================
alter table public.users_profile enable row level security;
alter table public.user_settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.saved_tactics enable row level security;
alter table public.rivals enable row level security;
alter table public.ai_requests enable row level security;
alter table public.user_progression enable row level security;
alter table public.coach_competition_profiles enable row level security;
alter table public.competition_events enable row level security;
alter table public.user_feature_unlocks enable row level security;

-- Own data policies.
drop policy if exists users_profile_select_own on public.users_profile;
drop policy if exists users_profile_insert_own on public.users_profile;
drop policy if exists users_profile_update_own on public.users_profile;
create policy users_profile_select_own on public.users_profile for select to authenticated using (auth.uid() = user_id);
create policy users_profile_insert_own on public.users_profile for insert to authenticated with check (auth.uid() = user_id);
create policy users_profile_update_own on public.users_profile for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_settings_select_own on public.user_settings;
drop policy if exists user_settings_insert_own on public.user_settings;
drop policy if exists user_settings_update_own on public.user_settings;
create policy user_settings_select_own on public.user_settings for select to authenticated using (auth.uid() = user_id);
create policy user_settings_insert_own on public.user_settings for insert to authenticated with check (auth.uid() = user_id);
create policy user_settings_update_own on public.user_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions for select to authenticated using (auth.uid() = user_id);

drop policy if exists saved_tactics_select_own on public.saved_tactics;
drop policy if exists saved_tactics_insert_own on public.saved_tactics;
drop policy if exists saved_tactics_update_own on public.saved_tactics;
drop policy if exists saved_tactics_delete_own on public.saved_tactics;
create policy saved_tactics_select_own on public.saved_tactics for select to authenticated using (auth.uid() = user_id);
create policy saved_tactics_insert_own on public.saved_tactics for insert to authenticated with check (auth.uid() = user_id);
create policy saved_tactics_update_own on public.saved_tactics for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy saved_tactics_delete_own on public.saved_tactics for delete to authenticated using (auth.uid() = user_id);

drop policy if exists rivals_select_own on public.rivals;
drop policy if exists rivals_insert_own on public.rivals;
drop policy if exists rivals_update_own on public.rivals;
drop policy if exists rivals_delete_own on public.rivals;
create policy rivals_select_own on public.rivals for select to authenticated using (auth.uid() = user_id);
create policy rivals_insert_own on public.rivals for insert to authenticated with check (auth.uid() = user_id);
create policy rivals_update_own on public.rivals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rivals_delete_own on public.rivals for delete to authenticated using (auth.uid() = user_id);

drop policy if exists ai_requests_select_own on public.ai_requests;
create policy ai_requests_select_own on public.ai_requests for select to authenticated using (auth.uid() = user_id);

drop policy if exists user_progression_select_own on public.user_progression;
drop policy if exists user_progression_insert_own on public.user_progression;
drop policy if exists user_progression_update_own on public.user_progression;
create policy user_progression_select_own on public.user_progression for select to authenticated using (auth.uid() = user_id);
create policy user_progression_insert_own on public.user_progression for insert to authenticated with check (auth.uid() = user_id);
create policy user_progression_update_own on public.user_progression for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists coach_competition_read_league on public.coach_competition_profiles;
create policy coach_competition_read_league on public.coach_competition_profiles for select to authenticated using (true);

drop policy if exists competition_events_select_own on public.competition_events;
create policy competition_events_select_own on public.competition_events for select to authenticated using (auth.uid() = user_id);

drop policy if exists user_feature_unlocks_select_own on public.user_feature_unlocks;
create policy user_feature_unlocks_select_own on public.user_feature_unlocks for select to authenticated using (auth.uid() = user_id);

revoke all on table public.ai_requests from anon, authenticated;
grant select on table public.ai_requests to authenticated;
grant select, insert, update, delete on table public.users_profile, public.user_settings, public.saved_tactics, public.rivals to authenticated;
grant select, insert, update on table public.user_progression to authenticated;
grant select on table public.subscriptions to authenticated;
grant select on table public.coach_competition_profiles, public.competition_events, public.user_feature_unlocks to authenticated;

revoke all on function public.ensure_user_progression() from public, anon;
revoke all on function public.ensure_coach_competition_profile() from public, anon;
revoke all on function public.award_competition_points(text,jsonb) from public, anon;
revoke all on function public.consume_daily_ai_usage(text) from public, anon;
revoke all on function public.get_weekly_coach_leaderboard(integer) from public, anon;
revoke all on function public.sync_user_feature_unlocks(integer,jsonb) from public, anon;
grant execute on function public.ensure_user_progression() to authenticated;
grant execute on function public.ensure_coach_competition_profile() to authenticated;
grant execute on function public.award_competition_points(text,jsonb) to authenticated;
grant execute on function public.consume_daily_ai_usage(text) to authenticated;
grant execute on function public.get_weekly_coach_leaderboard(integer) to authenticated;
grant execute on function public.sync_user_feature_unlocks(integer,jsonb) to authenticated;

insert into public.users_profile(user_id, display_name)
select id, coalesce(raw_user_meta_data->>'display_name', raw_user_meta_data->>'name', 'Coach') from auth.users
on conflict (user_id) do nothing;

insert into public.user_progression(user_id)
select id from auth.users
on conflict (user_id) do nothing;

insert into public.subscriptions(user_id, plan, status, ai_monthly_limit, saved_tactics_limit, rivals_limit)
select id, 'free', 'active', 30, 25, 5 from auth.users
on conflict (user_id) do nothing;

insert into public.coach_competition_profiles(user_id, display_name)
select u.id, coalesce(p.display_name, u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'name', 'Coach')
from auth.users u
left join public.users_profile p on p.user_id = u.id
on conflict (user_id) do nothing;

-- Healthcheck for launch verification.
create or replace function public.tactic_boss_v104_healthcheck()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'ok', true,
    'users_profile', to_regclass('public.users_profile') is not null,
    'user_progression', to_regclass('public.user_progression') is not null,
    'coach_competition_profiles', to_regclass('public.coach_competition_profiles') is not null,
    'competition_events', to_regclass('public.competition_events') is not null,
    'user_feature_unlocks', to_regclass('public.user_feature_unlocks') is not null,
    'consume_daily_ai_usage', to_regprocedure('public.consume_daily_ai_usage(text)') is not null,
    'sync_user_feature_unlocks', to_regprocedure('public.sync_user_feature_unlocks(integer,jsonb)') is not null,
    'version', 'v104-launch-candidate-stability-complete-product-qa'
  );
$$;

grant execute on function public.tactic_boss_v104_healthcheck() to authenticated;

-- Verification query after running:
-- select public.tactic_boss_v104_healthcheck();
