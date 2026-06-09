-- Tactic Boss AI v62 Rewarded Ads + Boss Coins Wallet
-- Safe additive migration. Does not delete existing user data.

create table if not exists public.user_reward_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  boss_coins integer not null default 0 check (boss_coins >= 0),
  extra_generation_credits integer not null default 0 check (extra_generation_credits >= 0),
  ad_rewards_claimed_today integer not null default 0 check (ad_rewards_claimed_today >= 0),
  last_ad_reward_date date not null default current_date,
  total_ad_rewards_claimed integer not null default 0 check (total_ad_rewards_claimed >= 0),
  events jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('ad_reward','redeem_generation','consume_generation','rejected')),
  amount integer not null default 0,
  provider text not null default 'manual_launch_placeholder',
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'accepted' check (status in ('accepted','rejected','pending')),
  created_at timestamptz not null default now()
);

create index if not exists reward_events_user_created_idx on public.reward_events(user_id, created_at desc);
create index if not exists reward_events_user_type_day_idx on public.reward_events(user_id, event_type, created_at desc);

alter table public.user_reward_wallets enable row level security;
alter table public.reward_events enable row level security;

drop policy if exists reward_wallet_select_own on public.user_reward_wallets;
create policy reward_wallet_select_own on public.user_reward_wallets for select to authenticated using (auth.uid() = user_id);

drop policy if exists reward_events_select_own on public.reward_events;
create policy reward_events_select_own on public.reward_events for select to authenticated using (auth.uid() = user_id);

revoke all on public.user_reward_wallets, public.reward_events from anon;
grant select on public.user_reward_wallets, public.reward_events to authenticated;

create or replace function public.ensure_reward_wallet(p_user_id uuid default auth.uid())
returns public.user_reward_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.user_reward_wallets;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'NOT_ALLOWED';
  end if;
  insert into public.user_reward_wallets(user_id) values (p_user_id)
  on conflict (user_id) do nothing;
  select * into v_wallet from public.user_reward_wallets where user_id = p_user_id;
  return v_wallet;
end;
$$;

create or replace function public.claim_rewarded_ad_coins(p_provider text default 'admob')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet public.user_reward_wallets;
  v_today date := current_date;
  v_daily_limit integer := 4;
  v_reward integer := 25;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  insert into public.user_reward_wallets(user_id) values (v_uid)
  on conflict (user_id) do nothing;

  select * into v_wallet from public.user_reward_wallets where user_id = v_uid for update;

  if v_wallet.last_ad_reward_date <> v_today then
    update public.user_reward_wallets
      set ad_rewards_claimed_today = 0, last_ad_reward_date = v_today, updated_at = now()
      where user_id = v_uid
      returning * into v_wallet;
  end if;

  if v_wallet.ad_rewards_claimed_today >= v_daily_limit then
    insert into public.reward_events(user_id, event_type, amount, provider, status, metadata)
    values (v_uid, 'rejected', 0, coalesce(p_provider,'admob'), 'rejected', jsonb_build_object('reason','DAILY_AD_LIMIT_REACHED'));
    raise exception 'DAILY_AD_LIMIT_REACHED';
  end if;

  update public.user_reward_wallets
    set boss_coins = boss_coins + v_reward,
        ad_rewards_claimed_today = ad_rewards_claimed_today + 1,
        total_ad_rewards_claimed = total_ad_rewards_claimed + 1,
        events = jsonb_build_array(jsonb_build_object('type','ad_reward','amount',v_reward,'createdAt',now())) || events,
        updated_at = now()
    where user_id = v_uid
    returning * into v_wallet;

  insert into public.reward_events(user_id, event_type, amount, provider, metadata)
  values (v_uid, 'ad_reward', v_reward, coalesce(p_provider,'admob'), jsonb_build_object('daily_count', v_wallet.ad_rewards_claimed_today));

  return jsonb_build_object('boss_coins', v_wallet.boss_coins, 'extra_generation_credits', v_wallet.extra_generation_credits, 'ad_rewards_claimed_today', v_wallet.ad_rewards_claimed_today);
end;
$$;

create or replace function public.redeem_coins_for_generation_credit()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_wallet public.user_reward_wallets;
  v_cost integer := 100;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  insert into public.user_reward_wallets(user_id) values (v_uid)
  on conflict (user_id) do nothing;

  select * into v_wallet from public.user_reward_wallets where user_id = v_uid for update;
  if v_wallet.boss_coins < v_cost then
    raise exception 'NOT_ENOUGH_COINS';
  end if;

  update public.user_reward_wallets
    set boss_coins = boss_coins - v_cost,
        extra_generation_credits = extra_generation_credits + 1,
        events = jsonb_build_array(jsonb_build_object('type','redeem_generation','amount',-v_cost,'createdAt',now())) || events,
        updated_at = now()
    where user_id = v_uid
    returning * into v_wallet;

  insert into public.reward_events(user_id, event_type, amount, provider)
  values (v_uid, 'redeem_generation', -v_cost, 'boss_coins');

  return jsonb_build_object('boss_coins', v_wallet.boss_coins, 'extra_generation_credits', v_wallet.extra_generation_credits);
end;
$$;

insert into public.user_reward_wallets(user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- Verification helper output
select 'user_reward_wallets' as required_table, to_regclass('public.user_reward_wallets') as exists
union all
select 'reward_events', to_regclass('public.reward_events');
