# v58 Required Manual Actions

1. Run `supabase-community-lite-v58.sql` once in Supabase SQL Editor.
2. Run `supabase-community-lite-v58-verification.sql` and confirm the expected tables/functions.
3. Deploy the v58 source through Netlify with the existing public `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables.
4. Add the production Netlify URL to Supabase Auth Site URL and Redirect URLs if the URL changed.
5. Test Community Lite and referrals with two accounts before announcing the release.
6. Review `community_reports` periodically from Supabase until the Admin moderation screen is added.
