-- Tactic Boss AI V103.1 — XP Feature Unlocks
-- Run this AFTER V103. It is idempotent and safe to re-run.
-- Adds optional cloud persistence for the XP-based feature unlock system.

create extension if not exists pgcrypto;

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

create index if not exists user_feature_unlocks_user_level_idx
  on public.user_feature_unlocks(user_id, level_required, xp_required);

alter table public.user_feature_unlocks enable row level security;

drop policy if exists "Users can read own feature unlocks" on public.user_feature_unlocks;
create policy "Users can read own feature unlocks"
  on public.user_feature_unlocks
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own feature unlocks" on public.user_feature_unlocks;
create policy "Users can insert own feature unlocks"
  on public.user_feature_unlocks
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own feature unlocks" on public.user_feature_unlocks;
create policy "Users can update own feature unlocks"
  on public.user_feature_unlocks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
begin
  if uid is null then raise exception 'UNAUTHORIZED'; end if;
  if p_xp is null or p_xp < 0 or p_xp > 1000000 then raise exception 'INVALID_XP'; end if;
  if jsonb_typeof(coalesce(p_unlocks, '[]'::jsonb)) <> 'array' then raise exception 'INVALID_UNLOCKS'; end if;
  if jsonb_array_length(coalesce(p_unlocks, '[]'::jsonb)) > 30 then raise exception 'TOO_MANY_UNLOCKS'; end if;
  if pg_column_size(coalesce(p_unlocks, '[]'::jsonb)) > 32768 then raise exception 'UNLOCKS_TOO_LARGE'; end if;

  for item in select * from jsonb_array_elements(coalesce(p_unlocks, '[]'::jsonb)) loop
    if coalesce(item->>'feature_id', '') <> '' then
      insert into public.user_feature_unlocks(user_id, feature_id, level_required, xp_required, title, unlocked_at, last_synced_at)
      values(
        uid,
        left(item->>'feature_id', 64),
        greatest(1, least(100, coalesce((item->>'level_required')::integer, 1))),
        greatest(0, least(1000000, coalesce((item->>'xp_required')::integer, 0))),
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

  return jsonb_build_object('ok', true, 'synced', inserted_count, 'xp', p_xp);
end;
$$;

grant execute on function public.sync_user_feature_unlocks(integer, jsonb) to authenticated;

-- Optional lightweight verification:
-- select public.sync_user_feature_unlocks(0, '[]'::jsonb);
