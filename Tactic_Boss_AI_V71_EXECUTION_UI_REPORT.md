# Tactic Boss AI V71 — Execution UI Refactor

## What changed
- Result screen no longer behaves like a tactics encyclopedia.
- In-game settings now show direct executable values only.
- Attack, defence, and advanced instructions are split into clean sections.
- Explanations are moved behind the existing "Explain tactic" control.
- PES/eFootball/EA FC outputs avoid vague ranges and slash-heavy text on the main result.
- Player instructions are now simplified into direct assignments.

## No Supabase migration
No SQL change required.

## Deploy
Use the Netlify-ready package. If deploying via GitHub, use the source package and set:
- Build command: npm run build
- Publish directory: dist
- Functions directory: netlify/functions
