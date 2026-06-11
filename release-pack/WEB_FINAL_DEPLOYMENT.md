# Web Final Deployment

## 1. Supabase

1. Keep the successfully applied v56 core-safe bootstrap.
2. Run `release-pack/supabase-v56-launch-verification.sql` in SQL Editor.
3. In Authentication URL Configuration, set the Netlify production domain as Site URL and add it to Redirect URLs.
4. Use two separate accounts to verify users cannot read each other's saved tactics, rivals, progression, screenshot analyses, or match analyses.

## 2. Build

From the source directory:

```bash
npm ci
SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
SUPABASE_ANON_KEY="YOUR_PUBLIC_ANON_KEY" \
npm run build:web-launch
```

A successful run must report 8/8 web launch gates passed.

## 3. Netlify

Upload the contents of `dist/`, not the source directory. Confirm HTTPS is active.

Test from an incognito window and a second device:

- Create account and sign in.
- Generate and save a tactic.
- Create a rival.
- Complete a daily challenge and confirm XP.
- Run Screenshot Analyzer and Match Analyst.
- Sign out, sign back in, and confirm cloud restoration.
- Refresh every main screen and confirm no 404.
- Submit an account deletion request with a test account.

## 4. Go live

Launch to a small initial group first. Keep paid checkout disabled until secure web billing and server-side subscription verification are implemented.

### Git-connected Netlify deployment

The included `netlify.toml` runs `npm run build:web-launch`. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Netlify Site configuration → Environment variables. A deploy will fail safely if either value is missing.
