# Tactic Boss AI v62 — Google Play Deployment Guide

## 1. Supabase
Run:

```sql
supabase-rewarded-ads-wallet-v62.sql
```

Then verify:

```sql
supabase-rewarded-ads-wallet-v62-verification.sql
```

## 2. Runtime config
Before building Android, make sure `public/runtime-config.js` or the built asset contains:

```js
window.__TACTIC_BOSS_SUPABASE__ = {
  url: 'https://YOUR_PROJECT.supabase.co',
  anonKey: 'YOUR_PUBLIC_ANON_KEY',
  googleOAuthEnabled: false,
  rewardedAdsEnabled: false
};
```

Do not place a `service_role` key in the app.

## 3. Build web assets and sync Android

```bash
npm ci
npm run lint
npm test
npm run build
npx cap sync android
```

## 4. Open Android Studio

```bash
npx cap open android
```

## 5. Create upload keystore
Use Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**.

Recommended:
- Keep the keystore offline.
- Save alias/passwords in a password manager.
- Never commit the keystore to GitHub.

## 6. Build signed AAB
In Android Studio:

```text
Build → Generate Signed Bundle / APK → Android App Bundle → release
```

Upload the generated `.aab` to Google Play Console.

## 7. Google Play Console forms
Complete:
- App access.
- Ads declaration.
- Data Safety.
- Content Rating.
- Target audience.
- Privacy Policy URL.
- Data deletion URL.
- Store listing.
- Screenshots.
- App category.
- Support email.

## 8. Rewarded ads note
The v62 economy is ready, but real rewarded ads require AdMob IDs and completion callbacks. Keep `rewardedAdsEnabled=false` until those are configured.
