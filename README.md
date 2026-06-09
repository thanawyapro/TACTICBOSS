# Tactic Boss AI — Web Production Final v1.5.0

This is the finalized web/PWA release line for Tactic Boss AI. Google Play and Android distribution are intentionally outside this release scope.

## Launch model

The current web launch is free. Pro and Elite are displayed only as upcoming plans and cannot be purchased until secure web billing and backend entitlement verification are implemented.

Screenshot Analyzer and Match Analyst are labeled beta tactical estimates. Uploaded image previews remain on the user's device; only derived reports and filenames are saved.

## Build the final Netlify package

Use only your public Supabase Project URL and anon/public key:

```bash
npm ci
SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
SUPABASE_ANON_KEY="YOUR_PUBLIC_ANON_KEY" \
npm run build:web-launch
```

Never place a service-role key, JWT secret, database password, or private key in frontend assets.

After the command passes, upload the contents of `dist/` to Netlify.

## Final verification

```bash
npm run check
npm run audit:release
npm run check:web-launch
npm run verify:live-supabase
```

The web-launch check intentionally blocks while `public/runtime-config.js` is blank.

Read first:

- `WEB_FINAL_DEPLOYMENT.md`
- `WEB_FINAL_RELEASE_REPORT.md`
- `WEB_OPERATIONS_PLAYBOOK.md`
- `release-pack/supabase-v56-launch-verification.sql`
