# Tactic Boss AI v58 — Community Lite & Referral Lite

## Implemented
- Lightweight Community Tactics screen connected through secure Supabase RPC functions.
- Publish one saved tactic per day without duplicating images or tactical-board drawings.
- Trending, newest, and saved feeds limited to 12 items and cached locally for 15 minutes.
- Likes, saves, unique tactic uses, reports, and basic rankings.
- Local share-card generation in the browser; cards are never uploaded to Supabase Storage.
- Direct shared tactic links and lightweight referral codes.
- Referral reward confirmed only after the referred user completes a tactical action.
- Arabic and multilingual player-role labels now include familiar abbreviations such as CB, CDM, CAM, and CF.
- Named players show their position abbreviation on the tactical board.

## Supabase load controls
- No Realtime subscriptions.
- No comments, messages, notifications feed, view tracking, or share-event rows.
- No uploaded Community images.
- No duplicated board drawings in Community tactic data.
- Feed limit capped server-side at 24; UI requests 12.
- One Community publish, ten new likes, and ten new saves per user per day.
- A unique `community_uses` row prevents repeated use-count inflation.
- Client-side feed cache avoids repeated reads for 15 minutes.
- Like/save actions update the UI optimistically without reloading the feed.

## Honest limitations
- Community moderation is report-based; reports must currently be reviewed from Supabase or a later Admin update.
- Referral rewards are XP only and require `user_progression` to exist.
- No comments, follows, creator analytics, or realtime updates in this low-cost release.
