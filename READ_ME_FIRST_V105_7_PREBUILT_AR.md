# Tactic Boss AI V105.7 — Prebuilt No-NPM

هذه هي النسخة المخصصة للرفع على GitHub ثم Netlify بدون أن يدخل Netlify في npm install أو vite build.

## ارفع على GitHub
ضع هذه الملفات في جذر الريبو مباشرة:

- dist/
- netlify/
- netlify.toml
- READ_ME_FIRST_V105_7_PREBUILT_AR.md

## إعدادات Netlify

Build command:

```bash
echo 'Tactic Boss AI V105.7 prebuilt deploy: no npm install/build required'
```

Publish directory:

```txt
dist
```

Functions directory:

```txt
netlify/functions
```

بعد النشر افتح:

```txt
/version.json
```

لازم يظهر:

```txt
v105.7-true-daily-challenge-game-dna
```
