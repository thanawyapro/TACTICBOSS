# Tactic Boss AI V76 — Targeted AI + eFootball Flow Fix

## Scope
- Keep V73/V75 visual identity.
- Update tools only.
- No Supabase SQL changes.

## Changes
1. eFootball Build flow starts with Playstyle/Manager first.
2. Recommended formations appear from the selected manager/playstyle.
3. eFootball in-game instructions now show the target position:
   - Anchoring → DMF/CMF
   - Counter Target → CF or fastest LWF/RWF
   - Deep Line → DMF
   - Defensive → RB/LB or DMF depending on threat
4. AI Coach fallback now reads the user note and responds to keywords such as wide danger, pressure, fast opponent, AMF/playmaker.
5. Netlify function prompt now prioritizes the user note before generic tips.
6. Build and TypeScript hard check passed.

## Verification
- npm run lint: PASS
- npm run build: PASS
