select 'user_reward_wallets' as check_name, to_regclass('public.user_reward_wallets') as value
union all
select 'reward_events', to_regclass('public.reward_events')
union all
select 'claim_rewarded_ad_coins', to_regprocedure('public.claim_rewarded_ad_coins(text)')::text
union all
select 'redeem_coins_for_generation_credit', to_regprocedure('public.redeem_coins_for_generation_credit()')::text;
