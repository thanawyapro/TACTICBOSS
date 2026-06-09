# v58 Deployment Guide

1. Run `supabase-community-lite-v58.sql` in Supabase SQL Editor.
2. Run `supabase-community-lite-v58-verification.sql` and confirm all Community tables and RPC functions exist.
3. Deploy the v58 source through the existing Netlify Git workflow with `SUPABASE_URL` and `SUPABASE_ANON_KEY` configured.
4. Test with two accounts:
   - Save a tactic, publish it, and confirm the other account can see it.
   - Like, save, use, share, and report the tactic.
   - Open the generated shared link in another browser.
   - Complete one tactical action on the referred account, then claim the referral code.
   - Confirm a user cannot publish more than one tactic in the same day.
5. Confirm Tactical Board role menus display labels such as `قلب دفاع (CB)` and `مهاجم صريح قناص (CF)`.

Rollback: disable access by revoking execute on the v58 RPC functions. Do not drop tables unless all Community data is intentionally being discarded.
