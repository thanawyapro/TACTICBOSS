-- Tactic Boss AI V103 — Retention + Coach League + Free Cost Guard
-- Idempotent migration. Safe to run after V102. Adds real weekly competition and daily AI usage caps.

create extension if not exists pgcrypto;

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
  updated_at timestamptz not null default now()
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
  created_at timestamptz not null default now()
);

create index if not exists competition_events_user_day_type_idx on public.competition_events(user_id, day_key, event_type);
create index if not exists competition_events_week_points_idx on public.competition_events(week_key, points desc);
create index if not exists coach_competition_week_points_idx on public.coach_competition_profiles(week_key, weekly_points desc);

create or replace function public.ensure_coach_competition_profile()
returns public.coach_competition_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.coach_competition_profiles;
  display text;
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
  return badges;
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
  if p_event_type is null or length(p_event_type) > 48 then raise exception 'INVALID_EVENT'; end if;
  if pg_column_size(coalesce(p_meta, '{}'::jsonb)) > 32768 then raise exception 'META_TOO_LARGE'; end if;

  p := public.ensure_coach_competition_profile();
  perform 1 from public.coach_competition_profiles where user_id = uid for update;
  select * into p from public.coach_competition_profiles where user_id = uid;

  if p.week_key <> wk then p.weekly_points := 0; p.week_key := wk; end if;
  if p.season_key <> ssn then p.season_points := 0; p.season_key := ssn; end if;

  cap := public.competition_daily_cap(p_event_type);
  select count(*) into today_count from public.competition_events
    where user_id = uid and day_key = today and event_type = p_event_type;
  if today_count >= cap then
    return jsonb_build_object('ok', true, 'capped', true, 'gained', 0, 'weekly_points', p.weekly_points, 'season_points', p.season_points, 'total_points', p.total_points, 'current_streak', p.current_streak, 'badges', p.badges);
  end if;

  pts := public.competition_event_points(p_event_type);
  streak := case
    when p.last_active_date = today then p.current_streak
    when p.last_active_date = today - interval '1 day' then p.current_streak + 1
    else 1
  end;
  next_weekly := greatest(0, p.weekly_points) + pts;
  next_season := greatest(0, p.season_points) + pts;
  next_total := greatest(0, p.total_points) + pts;
  next_badges := public.next_competition_badges(p.badges, next_weekly, next_season, streak, p_event_type);

  insert into public.competition_events(user_id, event_type, points, meta, day_key, week_key, season_key)
  values(uid, left(p_event_type, 48), pts, coalesce(p_meta, '{}'::jsonb), today, wk, ssn);

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
  select coalesce(plan, 'free') into plan_name from public.subscriptions where user_id = uid;
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
  return jsonb_build_object('ok', true, 'kind', p_kind, 'used', used + 1, 'limit', allowed, 'usage', usage);
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

alter table public.coach_competition_profiles enable row level security;
alter table public.competition_events enable row level security;

drop policy if exists coach_competition_read_league on public.coach_competition_profiles;
create policy coach_competition_read_league on public.coach_competition_profiles for select to authenticated using (true);

drop policy if exists competition_events_select_own on public.competition_events;
create policy competition_events_select_own on public.competition_events for select to authenticated using (auth.uid() = user_id);

revoke all on table public.coach_competition_profiles, public.competition_events from anon, authenticated;
grant select on table public.coach_competition_profiles to authenticated;
grant select on table public.competition_events to authenticated;

revoke all on function public.ensure_coach_competition_profile() from public, anon;
revoke all on function public.award_competition_points(text,jsonb) from public, anon;
revoke all on function public.consume_daily_ai_usage(text) from public, anon;
revoke all on function public.get_weekly_coach_leaderboard(integer) from public, anon;
grant execute on function public.ensure_coach_competition_profile() to authenticated;
grant execute on function public.award_competition_points(text,jsonb) to authenticated;
grant execute on function public.consume_daily_ai_usage(text) to authenticated;
grant execute on function public.get_weekly_coach_leaderboard(integer) to authenticated;

-- Backfill existing users without changing their core app data.
insert into public.coach_competition_profiles(user_id, display_name)
select u.id, coalesce(p.display_name, u.raw_user_meta_data->>'display_name', 'Coach')
from auth.users u
left join public.users_profile p on p.user_id = u.id
on conflict (user_id) do nothing;
