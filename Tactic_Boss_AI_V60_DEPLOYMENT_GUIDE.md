# Tactic Boss AI v60 Deployment Guide

No new Supabase SQL is required for v60.

Deploy exactly like v59:

1. Upload the v60 source to your repo or Netlify project.
2. Keep the same environment variables:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
3. Build command:
   - npm run build:web-launch
4. After deploy, clear old PWA cache on first test device or open in incognito.
5. Test these flows:
   - Generate EA FC 25 plan and confirm Official DNA = EA FC IQ.
   - Generate EA FC 24 plan and confirm PlayStyles basis appears.
   - Generate FIFA 23 plan and confirm HyperMotion2/AcceleRATE basis appears.
   - Generate eFootball plan with Guardiola/Xabi/Capello and confirm board changes.
   - Generate PES 2021 plan and confirm Team Spirit/Advanced Instructions basis appears.
   - Save tactic, publish to Community Lite, use shared tactic.

Do not run any new SQL for this release.
