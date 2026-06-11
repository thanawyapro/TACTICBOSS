# Tactic Boss AI v62 — Google Play Release Candidate 1

## Scope
This release restores the Android/Google Play path on top of the latest user app lineage and adds the safe Rewarded Ads / Boss Coins economy foundation.

## Product changes
- Added Boss Coins wallet.
- Added Rewarded Ads economy model:
  - 25 Boss Coins per completed rewarded ad.
  - 100 Boss Coins = 1 extra tactic generation credit.
  - Free daily cap: 4 rewarded-ad claims.
  - Pro daily cap: 2 rewarded-ad claims.
  - Elite default cap: 0, because Elite should not need ad watching.
- Added extra generation credits that can be consumed when the monthly AI plan-generation limit is reached.
- Added Supabase wallet migration and RPC protection.
- Added runtime flag `rewardedAdsEnabled: false` so ad rewards are not exposed as real ads until real AdMob IDs and completion callbacks are configured.

## Android / Google Play changes
- Recreated Android project using Capacitor.
- App ID: `com.tacticboss.ai`.
- Version name: `1.10.0`.
- Version code: `62`.
- Minimum SDK: 24.
- Compile SDK: 36.
- Target SDK: 36.
- Internet permission only.
- `allowBackup=false`.
- `usesCleartextTraffic=false`.
- PWA/web assets synced into Android.

## Verification
- TypeScript: PASS.
- Vitest: 35/35 PASS.
- Production build: PASS.
- Release audit: PASS.
- npm audit: 0 vulnerabilities.
- Capacitor Android sync: PASS.
- Android Gradle project generated: PASS.
- AAB local build in this environment: BLOCKED because Gradle distribution download from `services.gradle.org` is unavailable in the sandbox network.

## Important honesty note
A final Play Store upload requires a signed `.aab`. I cannot generate your production signed AAB without your private upload keystore and access to Google Play Console. This package is ready to open/build/sign in Android Studio or a machine with Gradle network/cache access.

## Manual actions still required
1. Run Supabase migration `supabase-rewarded-ads-wallet-v62.sql`.
2. Add production `SUPABASE_URL` and `SUPABASE_ANON_KEY` into runtime config before Android build.
3. Generate or provide an Android upload keystore.
4. Build a signed release AAB in Android Studio.
5. Create Google Play app listing.
6. Complete Data Safety, Ads, Content Rating, Privacy Policy, and App Access forms.
7. If rewarded ads are enabled later, create real AdMob App ID and Rewarded Ad Unit ID and enable `rewardedAdsEnabled` only after real ad completion callbacks are wired.
