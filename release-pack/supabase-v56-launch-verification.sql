-- Tactic Boss AI v56 launch verification (read-only)
-- Run after the v56 core-only safe bootstrap. This file does not change data.

select table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'users_profile','user_settings','saved_tactics','rivals','ai_requests','subscriptions',
    'account_deletion_requests','user_progression','daily_challenges','user_challenge_progress',
    'screenshot_analyses','match_analyses'
  )
order by table_name;

select tablename, rowsecurity
from pg_tables
where schemaname='public'
  and tablename in (
    'users_profile','user_settings','saved_tactics','rivals','ai_requests','subscriptions',
    'account_deletion_requests','user_progression','daily_challenges','user_challenge_progress',
    'screenshot_analyses','match_analyses'
  )
order by tablename;

select tablename, policyname, roles, cmd
from pg_policies
where schemaname='public'
  and tablename in (
    'saved_tactics','rivals','subscriptions','user_progression','daily_challenges',
    'user_challenge_progress','screenshot_analyses','match_analyses'
  )
order by tablename, policyname;

select routine_name, security_type
from information_schema.routines
where routine_schema='public'
  and routine_name in (
    'handle_new_user','log_ai_request','request_account_deletion',
    'enforce_saved_tactics_limit','enforce_rivals_limit','provision_user_progression'
  )
order by routine_name;

select
  to_regclass('public.user_progression') is not null as user_progression_ready,
  to_regclass('public.daily_challenges') is not null as daily_challenges_ready,
  to_regclass('public.screenshot_analyses') is not null as screenshot_analyses_ready,
  to_regclass('public.match_analyses') is not null as match_analyses_ready;
