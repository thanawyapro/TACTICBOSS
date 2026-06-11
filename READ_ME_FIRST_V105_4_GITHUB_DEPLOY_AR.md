# اقرأني أولًا — V105.4 GitHub → Netlify

هذه نسخة مخصوصة لتجنب خطأ:

```txt
sh: 1: vite: not found
```

## ارفع أي ملف؟
ارفع محتوى الملف:

```txt
01_UPLOAD_THIS_TO_GITHUB_tactic-boss-ai-v105-4.zip
```

إلى GitHub repository، ثم اربطه بـ Netlify.

## إعدادات Netlify

Build command:

```bash
bash scripts/netlify-guaranteed-build.sh
```

Publish directory:

```txt
dist
```

Functions directory:

```txt
netlify/functions
```

## مهم جدًا
قبل Deploy اعمل:

```txt
Deploys → Clear cache and deploy site
```

ولو عندك Environment Variables باسم:

```txt
NPM_CONFIG_PRODUCTION
NPM_CONFIG_INCLUDE
```

احذفهم من Netlify أو خلّي:

```txt
NPM_CONFIG_PRODUCTION=false
NPM_CONFIG_INCLUDE=dev
```

لكن النسخة نفسها فيها سكريبت بيحاول يتغلب عليهم.

## GEMINI_MODEL
هذا المتغير لا علاقة له بخطأ Vite.
ضعه هكذا:

```txt
GEMINI_MODEL=gemini-2.5-flash-lite
```

## بعد النشر
افتح:

```txt
/version.json
```

لازم يظهر:

```txt
v105.4-github-netlify-vite-hard-lock
```
