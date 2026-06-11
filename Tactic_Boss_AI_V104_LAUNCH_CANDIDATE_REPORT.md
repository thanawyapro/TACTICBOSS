# Tactic Boss AI V104 — Launch Candidate Stability + Complete Product QA

## Version
- **Name:** V104 — Launch Candidate Stability + Complete Product QA
- **version.json:** `v104-launch-candidate-stability-complete-product-qa`
- **Final Plan Version:** `v104-launch-candidate-stability`

## Executive Decision
V104 is the first Launch Candidate that addresses the critical blockers found in the V103.1 Hard Launch Audit.
It is suitable for **source-based Netlify deployment** with Supabase SQL applied and environment variables configured.

Do **not** rely on a pure static Drag & Drop deployment for the final AI launch because Netlify Functions must be deployed from source/Git or Netlify CLI.

## Critical fixes implemented

### 1. Netlify Functions are now launch-ready
Updated:
- `netlify/functions/vision-analysis.mjs`
- `netlify/functions/tactical-coach.mjs`

Fixes:
- Added CORS preflight headers for `Authorization`.
- Auth verification is required by default.
- No AI provider call is made before user verification.
- No Vision AI call is made before server-side quota consumption.
- No coach/tactical AI call is made before server-side quota consumption.
- Direct function calls with a valid user token are now still protected by Supabase daily limits.

### 2. Server-side AI usage guard
Vision and coach AI limits are now consumed inside Netlify Functions through:

```sql
public.consume_daily_ai_usage(p_kind text)
```

Protected usage kinds:
- `vision_analysis`
- `match_analysis`
- `coach_tip`
- `text_generation` is still available for future server-based generation flows.

Free daily caps remain:
- 3 text generations
- 1 vision analysis
- 1 match analysis
- 5 coach tips

### 3. Frontend double-charge removed for Vision/Coach
Updated:
- `App.tsx`
- `src/App.tsx`

Changes:
- Coach tips no longer consume quota client-side before calling the function.
- Screenshot/match analysis no longer consumes quota client-side before calling the function.
- The server function is now the source of truth for expensive AI quota.
- UI still blocks by daily saved-history limits for good UX.

### 4. Authorization header fixed for AI plan override
Updated:
- `fetchAiPlanOverride` in both `App.tsx` and `src/App.tsx`

Fix:
- Added Supabase session token to `/tactical-coach` requests.
- This removes the V103.1 issue where Build/Counter AI override could silently fall back because the function required auth.

### 5. PWA/cache/version consistency
Updated:
- `public/version.json`
- `public/service-worker.js`
- `public/manifest.json`
- `index.html`
- Share-card logo cache busting

Fixes:
- Removed old `v=103` / `v103.1` cache keys from active launch files.
- Updated service worker cache name to `tactic-boss-v104-launch-candidate`.
- Updated manifest/icon cache params to `v=104`.
- Updated `version.json` to V104.

### 6. Runtime AI endpoint is now local
Updated:
- `public/runtime-config.js`

Fix:
- Removed old external Netlify function URL.
- Default coach endpoint is now:

```txt
/.netlify/functions/tactical-coach
```

### 7. Security headers cleaned
Updated:
- `public/_headers`

Fix:
- Removed old external Netlify AI proxy from CSP `connect-src`.
- Browser connects only to the current site, Supabase, and required safe public resources.

### 8. Supabase launch SQL pack created
Created:
- `supabase-v104-launch-candidate.sql`

Includes:
- Core user tables if missing.
- Coach League tables.
- AI daily usage guard.
- XP feature unlocks.
- Hardened `sync_user_feature_unlocks` that ignores client XP and uses server XP.
- RLS policies.
- Grants.
- Backfills for existing users.
- Healthcheck function:

```sql
select public.tactic_boss_v104_healthcheck();
```

### 9. Final Plan Lock remains active
Updated final plan version:

```txt
v104-launch-candidate-stability
```

The app still locks:
- Result
- Board
- Share card
- Saved tactic payload

### 10. Netlify build safety
`netlify.toml` still declares:

```toml
[functions]
  directory = "netlify/functions"
```

This is required for AI functions to deploy.

## Files changed

Frontend:
- `App.tsx`
- `src/App.tsx`
- `utils/finalPlan.ts`
- `src/utils/finalPlan.ts`
- `public/runtime-config.js`
- `public/version.json`
- `public/service-worker.js`
- `public/manifest.json`
- `public/_headers`
- `index.html`
- `.env.example`

Functions:
- `netlify/functions/vision-analysis.mjs`
- `netlify/functions/tactical-coach.mjs`

Database:
- `supabase-v104-launch-candidate.sql`

## Validation results

### TypeScript
```bash
npm run lint
```
Result: **Passed**

### Unit tests
```bash
npm test -- --run
```
Result: **Passed**
- 10 test files passed
- 35 tests passed

### Production build
```bash
npm run build:web
```
Result: **Passed**

Build warning:
- Main app chunk is ~525 kB after minification.
- This is not a blocker for launch, but should be optimized later with more code splitting.

### Package audit
```bash
npm audit --audit-level=high --omit=dev
```
Result: **0 vulnerabilities**

### E2E tests
```bash
npm run test:e2e
```
Result: **Environment blocked**

Reason:
- Playwright could not open local preview because the execution environment blocks `127.0.0.1:4173` with `ERR_BLOCKED_BY_ADMINISTRATOR`.
- One static policy-file test passed.
- The three browser navigation tests could not run due environment restriction, not application build failure.

## Deployment instructions

### Required Supabase SQL
Run this file in Supabase SQL Editor:

```txt
supabase-v104-launch-candidate.sql
```

Then verify:

```sql
select public.tactic_boss_v104_healthcheck();
```

Expected:

```json
{"ok": true, "version": "v104-launch-candidate-stability-complete-product-qa", ...}
```

### Required Netlify environment variables
Set in Netlify Site configuration → Environment variables:

```txt
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
REQUIRE_AUTH_FOR_AI=true
ALLOW_AI_WITHOUT_USAGE_GUARD=false
MAX_VISION_IMAGE_CHARS=1800000
```

Optional fallback provider:

```txt
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

### Deployment method
Recommended:

```txt
GitHub → Netlify build
```

or:

```txt
Netlify CLI deploy from the source folder
```

Do not use static Drag & Drop as the final AI deployment method because static deployment does not reliably deploy `netlify/functions`.

## Launch readiness after V104

| Area | Status |
|---|---|
| TypeScript | Passed |
| Unit tests | Passed |
| Build | Passed |
| Server-side AI guard | Passed in code |
| Auth headers for AI | Passed in code |
| Supabase final SQL | Ready |
| PWA/cache/version | Passed |
| Final Plan Lock | Passed |
| Netlify Functions | Source-deploy ready |
| Static ZIP | UI preview only |
| E2E browser smoke | Blocked by environment |

## Remaining non-blocking improvements for V105

1. Split the main app chunk below 500 kB.
2. Add server-authoritative competition event proof for a fully official paid leaderboard.
3. Add real-device Arabic share-card QA screenshots before public marketing.
4. Add admin dashboard to monitor AI usage and leaderboard abuse.
5. Add analytics events for funnel/drop-off tracking.

## Final recommendation
Proceed to **source-based staging deployment** first.

If staging verifies:
- Functions are live.
- SQL healthcheck passes.
- Gemini requests are capped after daily limits.
- Arabic share card looks correct on real phone.
- Board UX is visually clean on 390px and 430px devices.

Then V104 can be promoted to public launch.
