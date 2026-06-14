-- Tactic Boss AI V130 — Coach OS verification
select jsonb_build_object(
  'coach_os_state_exists', to_regclass('public.coach_os_state') is not null,
  'rls_enabled', coalesce((select relrowsecurity from pg_class where oid = 'public.coach_os_state'::regclass), false),
  'policies', coalesce((select count(*) from pg_policies where schemaname = 'public' and tablename = 'coach_os_state'), 0),
  'authenticated_grants', coalesce((
    select count(*) from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'coach_os_state' and grantee = 'authenticated'
  ), 0)
) as v130_coach_os_verification;
