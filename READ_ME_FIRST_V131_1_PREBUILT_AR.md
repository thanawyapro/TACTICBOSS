# Tactic Boss AI V131.1 — Hard Verification Fix

هذه نسخة GitHub → Netlify جاهزة بدون npm.

## محتوى ZIP المطلوب في جذر الريبو

```text
dist/
netlify/
netlify.toml
READ_ME_FIRST_V131_1_PREBUILT_AR.md
```

## إعداد Netlify

Build command:
```text
echo 'Tactic Boss AI V131.1 prebuilt deploy: no npm install/build required'
```

Publish directory:
```text
dist
```

Functions directory:
```text
netlify/functions
```

بعد النشر افتح:

```text
/version.json?check=1311
```

المتوقع:

```text
v131.1-web-production-final-hard-verification-ui-meta-language-fixes
```

## مهم
استخدم Clear cache and deploy site بعد رفع النسخة، لأن هذه النسخة تغير كاش الـPWA.
