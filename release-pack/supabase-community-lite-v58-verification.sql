-- Read-only verification for v58 Community Lite
select table_name
from information_schema.tables
where table_schema='public' and table_name in (
  'community_tactics','community_likes','community_saves','community_uses','community_reports','referral_codes','referral_events'
)
order by table_name;

select routine_name
from information_schema.routines
where routine_schema='public' and routine_name in (
  'publish_community_tactic_lite','community_feed_lite','community_tactic_by_id_lite','toggle_community_like_lite','toggle_community_save_lite',
  'use_community_tactic_lite','report_community_tactic_lite','get_my_referral_code','claim_referral_lite'
)
order by routine_name;

select schemaname, tablename, policyname
from pg_policies
where schemaname='public' and tablename like 'community_%' or (schemaname='public' and tablename like 'referral_%')
order by tablename, policyname;
