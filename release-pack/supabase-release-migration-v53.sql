-- Tactic Boss AI v52 production migration
-- Idempotent, preserves existing user data, and enables user-scoped RLS.

create extension if not exists pgcrypto;

create table if not exists public.users_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  favorite_game text,
  tactic_dna jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.users_profile add column if not exists updated_at timestamptz default now();

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  theme text default 'theme-dark',
  language text default 'ar',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
alter table public.saved_tactics add column if not exists updated_at timestamptz default now();

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
alter table public.rivals add column if not exists favorite_team text;
alter table public.rivals add column if not exists board_data jsonb;
alter table public.rivals add column if not exists updated_at timestamptz default now();

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
alter table public.ai_requests add column if not exists provider text;
alter table public.ai_requests add column if not exists success boolean default true;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plan text default 'free',
  status text default 'active',
  ai_monthly_limit integer default 5,
  saved_tactics_limit integer default 10,
  rivals_limit integer default 3,
  started_at timestamptz default now(),
  expires_at timestamptz,
  updated_at timestamptz default now()
);
alter table public.subscriptions add column if not exists ai_monthly_limit integer default 5;
alter table public.subscriptions add column if not exists saved_tactics_limit integer default 10;
alter table public.subscriptions add column if not exists rivals_limit integer default 3;
alter table public.subscriptions add column if not exists updated_at timestamptz default now();

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  status text default 'pending',
  requested_at timestamptz default now(),
  processed_at timestamptz,
  notes text
);

create table if not exists public.tactic_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  saved_tactic_id uuid references public.saved_tactics(id) on delete set null,
  rating integer check (rating between 1 and 5),
  result text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.game_versions (
  id text primary key,
  name text not null,
  family text,
  year integer,
  is_active boolean default true,
  created_at timestamptz default now()
);
create table if not exists public.game_tactical_profiles (
  id uuid primary key default gen_random_uuid(),
  game_version_id text references public.game_versions(id) on delete cascade,
  profile_key text,
  content jsonb not null default '{}'::jsonb,
  verification_status text default 'draft',
  last_verified_at timestamptz,
  created_at timestamptz default now()
);
create table if not exists public.formation_templates (
  id uuid primary key default gen_random_uuid(),
  game_version_id text references public.game_versions(id) on delete cascade,
  team_key text,
  formation text,
  board_data jsonb not null default '{}'::jsonb,
  verification_status text default 'recommended_template',
  last_verified_at timestamptz,
  created_at timestamptz default now()
);
create table if not exists public.meta_tactics (
  id uuid primary key default gen_random_uuid(),
  game_version_id text references public.game_versions(id) on delete cascade,
  title text,
  content jsonb not null default '{}'::jsonb,
  verification_status text default 'draft',
  last_verified_at timestamptz,
  created_at timestamptz default now()
);

-- Unique ownership rows required by upsert and automatic provisioning.
create unique index if not exists users_profile_user_id_uidx on public.users_profile(user_id);
create unique index if not exists user_settings_user_id_uidx on public.user_settings(user_id);
create unique index if not exists subscriptions_user_id_uidx on public.subscriptions(user_id);
create unique index if not exists account_deletion_requests_user_id_uidx on public.account_deletion_requests(user_id);
create index if not exists saved_tactics_user_id_created_idx on public.saved_tactics(user_id, created_at desc);
create index if not exists rivals_user_id_created_idx on public.rivals(user_id, created_at desc);
create index if not exists ai_requests_user_id_created_idx on public.ai_requests(user_id, created_at desc);

-- Keep updated_at current.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_profile_set_updated_at on public.users_profile;
create trigger users_profile_set_updated_at before update on public.users_profile for each row execute function public.set_updated_at();
drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at before update on public.user_settings for each row execute function public.set_updated_at();
drop trigger if exists saved_tactics_set_updated_at on public.saved_tactics;
create trigger saved_tactics_set_updated_at before update on public.saved_tactics for each row execute function public.set_updated_at();
drop trigger if exists rivals_set_updated_at on public.rivals;
create trigger rivals_set_updated_at before update on public.rivals for each row execute function public.set_updated_at();
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

-- Automatic profile/settings/free subscription on sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users_profile(user_id, display_name, favorite_game)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Coach'), new.raw_user_meta_data->>'favorite_game')
  on conflict (user_id) do nothing;

  insert into public.user_settings(user_id, theme, language)
  values (new.id, 'theme-dark', 'ar')
  on conflict (user_id) do nothing;

  insert into public.subscriptions(user_id, plan, status, ai_monthly_limit, saved_tactics_limit, rivals_limit)
  values (new.id, 'free', 'active', 5, 10, 3)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Enforce plan limits at the database layer.
create or replace function public.enforce_saved_tactics_limit()
returns trigger language plpgsql security definer set search_path=public as $$
declare allowed integer; used integer;
begin
  if auth.uid() is null or new.user_id <> auth.uid() then raise exception 'UNAUTHORIZED'; end if;
  select coalesce(saved_tactics_limit, 10) into allowed from public.subscriptions where user_id = auth.uid();
  allowed := coalesce(allowed, 10);
  select count(*) into used from public.saved_tactics where user_id = auth.uid();
  if used >= allowed then raise exception 'SAVED_TACTICS_LIMIT_REACHED'; end if;
  return new;
end;
$$;
drop trigger if exists enforce_saved_tactics_limit_trigger on public.saved_tactics;
create trigger enforce_saved_tactics_limit_trigger before insert on public.saved_tactics for each row execute function public.enforce_saved_tactics_limit();

create or replace function public.enforce_rivals_limit()
returns trigger language plpgsql security definer set search_path=public as $$
declare allowed integer; used integer;
begin
  if auth.uid() is null or new.user_id <> auth.uid() then raise exception 'UNAUTHORIZED'; end if;
  select coalesce(rivals_limit, 3) into allowed from public.subscriptions where user_id = auth.uid();
  allowed := coalesce(allowed, 3);
  select count(*) into used from public.rivals where user_id = auth.uid();
  if used >= allowed then raise exception 'RIVALS_LIMIT_REACHED'; end if;
  return new;
end;
$$;
drop trigger if exists enforce_rivals_limit_trigger on public.rivals;
create trigger enforce_rivals_limit_trigger before insert on public.rivals for each row execute function public.enforce_rivals_limit();

-- Secure AI usage logging. The browser cannot insert directly into ai_requests.
create or replace function public.log_ai_request(
  p_request_type text,
  p_game text,
  p_provider text,
  p_input_data jsonb,
  p_result_data jsonb,
  p_success boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  allowed integer;
  used integer;
  request_id uuid;
begin
  if uid is null then raise exception 'UNAUTHORIZED'; end if;
  select coalesce(ai_monthly_limit, 5) into allowed from public.subscriptions where user_id = uid;
  allowed := coalesce(allowed, 5);
  select count(*) into used from public.ai_requests
    where user_id = uid and success = true and created_at >= date_trunc('month', now());
  if p_success and used >= allowed then raise exception 'AI_LIMIT_REACHED'; end if;
  insert into public.ai_requests(user_id, request_type, game, provider, input_data, result_data, success)
  values(uid, p_request_type, p_game, p_provider, coalesce(p_input_data, '{}'::jsonb), coalesce(p_result_data, '{}'::jsonb), p_success)
  returning id into request_id;
  if p_success then used := used + 1; end if;
  return jsonb_build_object('id', request_id, 'used', used, 'limit', allowed);
end;
$$;

create or replace function public.request_account_deletion()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare uid uuid := auth.uid(); req_id uuid;
begin
  if uid is null then raise exception 'UNAUTHORIZED'; end if;
  insert into public.account_deletion_requests(user_id, status, requested_at)
  values(uid, 'pending', now())
  on conflict (user_id) do update set status='pending', requested_at=now(), processed_at=null
  returning id into req_id;
  return jsonb_build_object('id', req_id, 'status', 'pending');
end;
$$;

revoke all on function public.log_ai_request(text,text,text,jsonb,jsonb,boolean) from public;
grant execute on function public.log_ai_request(text,text,text,jsonb,jsonb,boolean) to authenticated;
revoke all on function public.request_account_deletion() from public;
grant execute on function public.request_account_deletion() to authenticated;

-- Row Level Security.
alter table public.users_profile enable row level security;
alter table public.user_settings enable row level security;
alter table public.saved_tactics enable row level security;
alter table public.rivals enable row level security;
alter table public.ai_requests enable row level security;
alter table public.subscriptions enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.tactic_feedback enable row level security;
alter table public.game_versions enable row level security;
alter table public.game_tactical_profiles enable row level security;
alter table public.formation_templates enable row level security;
alter table public.meta_tactics enable row level security;

-- Replace policies safely.
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
-- No direct INSERT/UPDATE/DELETE policy for ai_requests; use log_ai_request().

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions for select to authenticated using (auth.uid() = user_id);
-- No browser write policy for subscriptions.

drop policy if exists deletion_requests_select_own on public.account_deletion_requests;
create policy deletion_requests_select_own on public.account_deletion_requests for select to authenticated using (auth.uid() = user_id);
-- Requests are created through request_account_deletion().

drop policy if exists tactic_feedback_all_own on public.tactic_feedback;
create policy tactic_feedback_all_own on public.tactic_feedback for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists game_versions_read on public.game_versions;
create policy game_versions_read on public.game_versions for select to authenticated using (is_active = true);
drop policy if exists game_profiles_read on public.game_tactical_profiles;
create policy game_profiles_read on public.game_tactical_profiles for select to authenticated using (verification_status = 'published');
drop policy if exists formation_templates_read on public.formation_templates;
create policy formation_templates_read on public.formation_templates for select to authenticated using (verification_status in ('published','recommended_template'));
drop policy if exists meta_tactics_read on public.meta_tactics;
create policy meta_tactics_read on public.meta_tactics for select to authenticated using (verification_status = 'published');

-- Backfill missing ownership companion rows for existing Auth users.
insert into public.users_profile(user_id, display_name)
select u.id, coalesce(u.raw_user_meta_data->>'display_name','Coach') from auth.users u
where not exists (select 1 from public.users_profile p where p.user_id=u.id)
on conflict (user_id) do nothing;
insert into public.user_settings(user_id) select u.id from auth.users u
where not exists (select 1 from public.user_settings s where s.user_id=u.id)
on conflict (user_id) do nothing;
insert into public.subscriptions(user_id, plan, status, ai_monthly_limit, saved_tactics_limit, rivals_limit)
select u.id, 'free', 'active', 5, 10, 3 from auth.users u
where not exists (select 1 from public.subscriptions s where s.user_id=u.id)
on conflict (user_id) do nothing;

-- v53 hardening: serialize plan-limit checks and restrict direct table privileges.
create or replace function public.enforce_saved_tactics_limit()
returns trigger language plpgsql security definer set search_path=public as $$
declare allowed integer; used integer;
begin
  if auth.uid() is null or new.user_id is distinct from auth.uid() then raise exception 'UNAUTHORIZED'; end if;
  perform 1 from public.subscriptions where user_id = auth.uid() for update;
  select coalesce(saved_tactics_limit, 10) into allowed from public.subscriptions where user_id = auth.uid();
  allowed := greatest(coalesce(allowed, 10), 0);
  select count(*) into used from public.saved_tactics where user_id = auth.uid();
  if used >= allowed then raise exception 'SAVED_TACTICS_LIMIT_REACHED'; end if;
  return new;
end;
$$;

create or replace function public.enforce_rivals_limit()
returns trigger language plpgsql security definer set search_path=public as $$
declare allowed integer; used integer;
begin
  if auth.uid() is null or new.user_id is distinct from auth.uid() then raise exception 'UNAUTHORIZED'; end if;
  perform 1 from public.subscriptions where user_id = auth.uid() for update;
  select coalesce(rivals_limit, 3) into allowed from public.subscriptions where user_id = auth.uid();
  allowed := greatest(coalesce(allowed, 3), 0);
  select count(*) into used from public.rivals where user_id = auth.uid();
  if used >= allowed then raise exception 'RIVALS_LIMIT_REACHED'; end if;
  return new;
end;
$$;

create or replace function public.log_ai_request(
  p_request_type text,
  p_game text,
  p_provider text,
  p_input_data jsonb,
  p_result_data jsonb,
  p_success boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  allowed integer;
  used integer;
  request_id uuid;
begin
  if uid is null then raise exception 'UNAUTHORIZED'; end if;
  if length(coalesce(p_request_type,'')) > 64 or length(coalesce(p_game,'')) > 120 or length(coalesce(p_provider,'')) > 80 then
    raise exception 'INVALID_REQUEST';
  end if;
  if pg_column_size(coalesce(p_input_data, '{}'::jsonb)) > 524288 or pg_column_size(coalesce(p_result_data, '{}'::jsonb)) > 524288 then
    raise exception 'REQUEST_TOO_LARGE';
  end if;
  perform 1 from public.subscriptions where user_id = uid for update;
  select coalesce(ai_monthly_limit, 5) into allowed from public.subscriptions where user_id = uid;
  allowed := greatest(coalesce(allowed, 5), 0);
  select count(*) into used from public.ai_requests
    where user_id = uid and success = true and created_at >= date_trunc('month', now());
  if p_success and used >= allowed then raise exception 'AI_LIMIT_REACHED'; end if;
  insert into public.ai_requests(user_id, request_type, game, provider, input_data, result_data, success)
  values(uid, left(coalesce(p_request_type,'generate_tactic'),64), left(coalesce(p_game,''),120), left(coalesce(p_provider,''),80), coalesce(p_input_data, '{}'::jsonb), coalesce(p_result_data, '{}'::jsonb), p_success)
  returning id into request_id;
  if p_success then used := used + 1; end if;
  return jsonb_build_object('id', request_id, 'used', used, 'limit', allowed);
end;
$$;

-- Validate bounded plan values without changing existing rows.
do $$ begin
  if not exists (select 1 from pg_constraint where conname='subscriptions_plan_check') then
    alter table public.subscriptions add constraint subscriptions_plan_check check (plan in ('free','pro','elite')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='subscriptions_status_check') then
    alter table public.subscriptions add constraint subscriptions_status_check check (status in ('active','expired','canceled','trialing')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='subscriptions_limits_check') then
    alter table public.subscriptions add constraint subscriptions_limits_check check (ai_monthly_limit >= 0 and saved_tactics_limit >= 0 and rivals_limit >= 0) not valid;
  end if;
end $$;

-- Defense in depth: sensitive tables are not directly writable where RPCs are required.
revoke all on table public.ai_requests from anon, authenticated;
grant select on table public.ai_requests to authenticated;
revoke all on table public.subscriptions from anon, authenticated;
grant select on table public.subscriptions to authenticated;
revoke all on table public.account_deletion_requests from anon, authenticated;
grant select on table public.account_deletion_requests to authenticated;

revoke all on table public.users_profile, public.user_settings, public.saved_tactics, public.rivals, public.tactic_feedback from anon;
grant select, insert, update, delete on table public.users_profile, public.user_settings, public.saved_tactics, public.rivals, public.tactic_feedback to authenticated;
revoke all on table public.game_versions, public.game_tactical_profiles, public.formation_templates, public.meta_tactics from anon;
grant select on table public.game_versions, public.game_tactical_profiles, public.formation_templates, public.meta_tactics to authenticated;

revoke all on function public.log_ai_request(text,text,text,jsonb,jsonb,boolean) from public, anon;
grant execute on function public.log_ai_request(text,text,text,jsonb,jsonb,boolean) to authenticated;
revoke all on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
