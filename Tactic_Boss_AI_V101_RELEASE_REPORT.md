# Tactic Boss AI V101 — Tactical Accuracy + Brand Identity Hard Fix

## Release goal
V101 turns the result into a locked tactical source of truth so the same plan is used by the result screen, tactical board, share card and saved tactics.

## Main changes
- Added `utils/finalPlan.ts` with `FINAL_PLAN_VERSION = v101-tactical-accuracy-brand-lock`.
- Added Final Plan Lock metadata to `TacticResult`.
- Generation now creates one locked `finalResult` and one locked `finalBoard`.
- Result screen, share card and save flow now use the locked board/result instead of recalculating from formation text.
- TacticalBoard no longer rebuilds player positions from formation text when a locked board/value already exists.
- Saved tactics now store `finalPlanVersion` in `input_data` and the locked result in `result_data`.
- Official game DNA evidence is now attached to generated tactics.
- Home branding now uses the wide Tactic Boss AI logo image.
- PWA branding and cache busting updated with `?v=101`.
- Service worker cache updated to `tactic-boss-v101-final-plan-brand-lock`.
- `version.json` updated to `v101-tactical-accuracy-brand-lock`.

## Validation
- `npm run lint` passed.
- `npm test -- --run` passed: 10 files / 35 tests.
- `npm run build:web` passed.
- Production bundle checked for removed V100 clutter text.
- Production bundle checked for `NaN%`.

## Supabase
No SQL migration is required for V101.
The existing `saved_tactics.input_data` and `saved_tactics.result_data` JSON fields are used for the new final-plan metadata.

## Deployment note
After uploading to Netlify, open `/version.json` and confirm:
`v101-tactical-accuracy-brand-lock`.
If the old icon or old screen appears, clear site/PWA cache or unregister the old service worker once.
