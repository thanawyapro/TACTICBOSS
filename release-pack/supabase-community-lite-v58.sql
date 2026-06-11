-- Tactic Boss AI v58 Community Lite + Referral Lite
-- Low-load, additive, idempotent migration. No realtime, images, comments, or view-event tracking.

create extension if not exists pgcrypto;

create table if not exists public.community_tactics (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  source_saved_tactic_id uuid references public.saved_tactics(id) on delete set null,
  creator_name text not null default 'Coach',
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  game text not null default '',
  formation text not null default '',
  playstyle text not null default '',
  tactic_data jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('published','hidden','archived')),
  likes_count integer not null default 0 check (likes_count >= 0),
  saves_count integer not null default 0 check (saves_count >= 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  score integer not null default 0 check (score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  tactic_id uuid not null references public.community_tactics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tactic_id)
);

create table if not exists public.community_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  tactic_id uuid not null references public.community_tactics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tactic_id)
);

create table if not exists public.community_uses (
  user_id uuid not null references auth.users(id) on delete cascade,
  tactic_id uuid not null references public.community_tactics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tactic_id)
);

create table if not exists public.community_reports (
  user_id uuid not null references auth.users(id) on delete cascade,
  tactic_id uuid not null references public.community_tactics(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','reviewed','dismissed')),
  created_at timestamptz not null default now(),
  primary key (user_id, tactic_id)
);

create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed','revoked')),
  reward_xp integer not null default 50 check (reward_xp >= 0),
  created_at timestamptz not null default now()
);

create index if not exists community_tactics_feed_idx on public.community_tactics(status, score desc, created_at desc);
create index if not exists community_tactics_creator_idx on public.community_tactics(creator_id, created_at desc);
create index if not exists community_likes_created_idx on public.community_likes(user_id, created_at desc);
create index if not exists community_saves_created_idx on public.community_saves(user_id, created_at desc);
create index if not exists community_uses_created_idx on public.community_uses(user_id, created_at desc);
create index if not exists community_reports_status_idx on public.community_reports(status, created_at desc);
create index if not exists referral_events_referrer_idx on public.referral_events(referrer_id, created_at desc);

alter table public.community_tactics enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_saves enable row level security;
alter table public.community_uses enable row level security;
alter table public.community_reports enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_events enable row level security;

drop policy if exists community_tactics_read_published on public.community_tactics;
create policy community_tactics_read_published on public.community_tactics for select to authenticated using (status = 'published' or creator_id = auth.uid());
drop policy if exists community_likes_read_own on public.community_likes;
create policy community_likes_read_own on public.community_likes for select to authenticated using (user_id = auth.uid());
drop policy if exists community_saves_read_own on public.community_saves;
create policy community_saves_read_own on public.community_saves for select to authenticated using (user_id = auth.uid());
drop policy if exists community_uses_read_own on public.community_uses;
create policy community_uses_read_own on public.community_uses for select to authenticated using (user_id = auth.uid());
drop policy if exists community_reports_read_own on public.community_reports;
create policy community_reports_read_own on public.community_reports for select to authenticated using (user_id = auth.uid());
drop policy if exists referral_codes_read_own on public.referral_codes;
create policy referral_codes_read_own on public.referral_codes for select to authenticated using (user_id = auth.uid());
drop policy if exists referral_events_read_related on public.referral_events;
create policy referral_events_read_related on public.referral_events for select to authenticated using (referrer_id = auth.uid() or referred_user_id = auth.uid());

revoke all on public.community_tactics, public.community_likes, public.community_saves, public.community_uses, public.community_reports, public.referral_codes, public.referral_events from anon, authenticated;
grant select on public.community_tactics, public.community_likes, public.community_saves, public.community_uses, public.community_reports, public.referral_codes, public.referral_events to authenticated;

create or replace function public.recalculate_community_tactic_score_lite(p_tactic_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.community_tactics
  set score = likes_count * 2 + saves_count * 3 + uses_count * 5,
      updated_at = now()
  where id = p_tactic_id;
$$;

create or replace function public.publish_community_tactic_lite(
  p_saved_tactic_id uuid,
  p_title text,
  p_description text default '',
  p_creator_name text default 'Coach'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_saved public.saved_tactics%rowtype;
  v_id uuid;
  v_name text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if (select count(*) from public.community_tactics where creator_id = v_uid and created_at >= current_date) >= 1 then
    raise exception 'DAILY_PUBLISH_LIMIT_REACHED';
  end if;

  select * into v_saved from public.saved_tactics where id = p_saved_tactic_id and user_id = v_uid;
  if not found then raise exception 'SAVED_TACTIC_NOT_FOUND'; end if;

  select nullif(trim(display_name), '') into v_name from public.users_profile where user_id = v_uid order by updated_at desc nulls last limit 1;
  v_name := coalesce(v_name, nullif(trim(p_creator_name), ''), 'Coach');

  insert into public.community_tactics(
    creator_id, source_saved_tactic_id, creator_name, title, description, game, formation, playstyle, tactic_data
  ) values (
    v_uid,
    v_saved.id,
    left(coalesce(v_name, 'Coach'), 60),
    left(coalesce(nullif(trim(p_title), ''), coalesce(v_saved.title, 'Community Tactic')), 80),
    left(coalesce(p_description, ''), 500),
    coalesce(v_saved.game, ''),
    coalesce(v_saved.user_formation, ''),
    coalesce(v_saved.user_style, ''),
    jsonb_build_object(
      'myFormation', coalesce(v_saved.user_formation, ''),
      'oppFormation', coalesce(v_saved.opponent_formation, ''),
      'opponentStyle', coalesce(v_saved.opponent_style, ''),
      'myStyle', coalesce(v_saved.user_style, ''),
      'matchState', coalesce(v_saved.match_state, ''),
      'myTeam', coalesce(v_saved.team, ''),
      'oppTeam', coalesce(v_saved.opponent_team, ''),
      'notes', coalesce(v_saved.input_data->>'notes', ''),
      'result', coalesce(v_saved.result_data, '{}'::jsonb)
    )
  ) returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.community_feed_lite(p_limit integer default 12, p_offset integer default 0, p_mode text default 'trending')
returns table(
  id uuid,
  creator_id uuid,
  creator_name text,
  title text,
  description text,
  game text,
  formation text,
  playstyle text,
  tactic_data jsonb,
  likes_count integer,
  saves_count integer,
  uses_count integer,
  score integer,
  created_at timestamptz,
  liked_by_me boolean,
  saved_by_me boolean
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select t.id, t.creator_id, t.creator_name, t.title, t.description, t.game, t.formation, t.playstyle,
         t.tactic_data, t.likes_count, t.saves_count, t.uses_count, t.score, t.created_at,
         exists(select 1 from public.community_likes l where l.user_id = auth.uid() and l.tactic_id = t.id),
         exists(select 1 from public.community_saves s where s.user_id = auth.uid() and s.tactic_id = t.id)
  from public.community_tactics t
  where t.status = 'published'
    and (p_mode <> 'saved' or exists(select 1 from public.community_saves sm where sm.user_id = auth.uid() and sm.tactic_id = t.id))
  order by
    case when p_mode = 'new' then t.created_at end desc nulls last,
    case when p_mode <> 'new' then t.score end desc nulls last,
    t.created_at desc
  limit greatest(1, least(coalesce(p_limit, 12), 24))
  offset greatest(0, coalesce(p_offset, 0));
$$;

create or replace function public.community_tactic_by_id_lite(p_tactic_id uuid)
returns table(
  id uuid, creator_id uuid, creator_name text, title text, description text, game text, formation text, playstyle text,
  tactic_data jsonb, likes_count integer, saves_count integer, uses_count integer, score integer, created_at timestamptz,
  liked_by_me boolean, saved_by_me boolean
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select t.id, t.creator_id, t.creator_name, t.title, t.description, t.game, t.formation, t.playstyle,
         t.tactic_data, t.likes_count, t.saves_count, t.uses_count, t.score, t.created_at,
         exists(select 1 from public.community_likes l where l.user_id=auth.uid() and l.tactic_id=t.id),
         exists(select 1 from public.community_saves s where s.user_id=auth.uid() and s.tactic_id=t.id)
  from public.community_tactics t where t.id=p_tactic_id and t.status='published' limit 1;
$$;

create or replace function public.toggle_community_like_lite(p_tactic_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_uid uuid := auth.uid(); v_added boolean;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists(select 1 from public.community_likes where user_id=v_uid and tactic_id=p_tactic_id) then
    delete from public.community_likes where user_id=v_uid and tactic_id=p_tactic_id;
    update public.community_tactics set likes_count=greatest(0,likes_count-1) where id=p_tactic_id and status='published';
    v_added := false;
  else
    if (select count(*) from public.community_likes where user_id=v_uid and created_at >= current_date) >= 10 then raise exception 'DAILY_LIKE_LIMIT_REACHED'; end if;
    insert into public.community_likes(user_id,tactic_id) select v_uid,id from public.community_tactics where id=p_tactic_id and status='published';
    if not found then raise exception 'TACTIC_NOT_FOUND'; end if;
    update public.community_tactics set likes_count=likes_count+1 where id=p_tactic_id;
    v_added := true;
  end if;
  perform public.recalculate_community_tactic_score_lite(p_tactic_id);
  return v_added;
end;
$$;

create or replace function public.toggle_community_save_lite(p_tactic_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_uid uuid := auth.uid(); v_added boolean;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists(select 1 from public.community_saves where user_id=v_uid and tactic_id=p_tactic_id) then
    delete from public.community_saves where user_id=v_uid and tactic_id=p_tactic_id;
    update public.community_tactics set saves_count=greatest(0,saves_count-1) where id=p_tactic_id and status='published';
    v_added := false;
  else
    if (select count(*) from public.community_saves where user_id=v_uid and created_at >= current_date) >= 10 then raise exception 'DAILY_SAVE_LIMIT_REACHED'; end if;
    insert into public.community_saves(user_id,tactic_id) select v_uid,id from public.community_tactics where id=p_tactic_id and status='published';
    if not found then raise exception 'TACTIC_NOT_FOUND'; end if;
    update public.community_tactics set saves_count=saves_count+1 where id=p_tactic_id;
    v_added := true;
  end if;
  perform public.recalculate_community_tactic_score_lite(p_tactic_id);
  return v_added;
end;
$$;

create or replace function public.use_community_tactic_lite(p_tactic_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_uid uuid := auth.uid(); v_inserted integer := 0;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.community_tactics where id=p_tactic_id and status='published') then raise exception 'TACTIC_NOT_FOUND'; end if;
  insert into public.community_uses(user_id,tactic_id) values(v_uid,p_tactic_id) on conflict (user_id,tactic_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then
    update public.community_tactics set uses_count=uses_count+1 where id=p_tactic_id;
    perform public.recalculate_community_tactic_score_lite(p_tactic_id);
    return true;
  end if;
  return false;
end;
$$;

create or replace function public.report_community_tactic_lite(p_tactic_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.community_reports(user_id,tactic_id) values(auth.uid(),p_tactic_id) on conflict (user_id,tactic_id) do nothing;
end;
$$;

create or replace function public.get_my_referral_code()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_uid uuid := auth.uid(); v_code text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select code into v_code from public.referral_codes where user_id=v_uid;
  if v_code is null then
    loop
      v_code := 'BOSS-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,7));
      begin
        insert into public.referral_codes(user_id,code) values(v_uid,v_code);
        exit;
      exception when unique_violation then null;
      end;
    end loop;
  end if;
  return v_code;
end;
$$;

create or replace function public.claim_referral_lite(p_code text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_uid uuid := auth.uid(); v_referrer uuid; v_code text := upper(trim(coalesce(p_code,'')));
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select user_id into v_referrer from public.referral_codes where code=v_code;
  if v_referrer is null then raise exception 'INVALID_REFERRAL_CODE'; end if;
  if v_referrer = v_uid then raise exception 'SELF_REFERRAL_NOT_ALLOWED'; end if;
  if exists(select 1 from public.referral_events where referred_user_id=v_uid) then raise exception 'REFERRAL_ALREADY_CLAIMED'; end if;
  if not exists(select 1 from public.saved_tactics where user_id=v_uid) and not exists(select 1 from public.ai_requests where user_id=v_uid and success=true) then
    raise exception 'COMPLETE_FIRST_TACTICAL_ACTION';
  end if;

  insert into public.referral_events(referrer_id,referred_user_id) values(v_referrer,v_uid);
  if to_regclass('public.user_progression') is not null then
    execute 'update public.user_progression set xp=xp+50, updated_at=now() where user_id=$1' using v_uid;
    execute 'update public.user_progression set xp=xp+50, updated_at=now() where user_id=$1' using v_referrer;
  end if;
end;
$$;

revoke all on function public.recalculate_community_tactic_score_lite(uuid) from public, anon, authenticated;
revoke all on function public.publish_community_tactic_lite(uuid,text,text,text) from public, anon;
revoke all on function public.community_feed_lite(integer,integer,text) from public, anon;
revoke all on function public.community_tactic_by_id_lite(uuid) from public, anon;
revoke all on function public.toggle_community_like_lite(uuid) from public, anon;
revoke all on function public.toggle_community_save_lite(uuid) from public, anon;
revoke all on function public.use_community_tactic_lite(uuid) from public, anon;
revoke all on function public.report_community_tactic_lite(uuid) from public, anon;
revoke all on function public.get_my_referral_code() from public, anon;
revoke all on function public.claim_referral_lite(text) from public, anon;

grant execute on function public.publish_community_tactic_lite(uuid,text,text,text) to authenticated;
grant execute on function public.community_feed_lite(integer,integer,text) to authenticated;
grant execute on function public.community_tactic_by_id_lite(uuid) to authenticated;
grant execute on function public.toggle_community_like_lite(uuid) to authenticated;
grant execute on function public.toggle_community_save_lite(uuid) to authenticated;
grant execute on function public.use_community_tactic_lite(uuid) to authenticated;
grant execute on function public.report_community_tactic_lite(uuid) to authenticated;
grant execute on function public.get_my_referral_code() to authenticated;
grant execute on function public.claim_referral_lite(text) to authenticated;
