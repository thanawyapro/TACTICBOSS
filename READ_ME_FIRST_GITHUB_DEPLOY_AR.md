# Tactic Boss AI V105.3 — GitHub + Netlify Deploy Ready

هذه النسخة مخصصة لطريقة النشر الصحيحة:

GitHub Repo → Netlify Build → Live Site + Netlify Functions

## لماذا هذه النسخة؟
تم إصلاح مشاكل Netlify السابقة:

- تثبيت Node على 20.19.0 بدل Node 22.
- تثبيت npm على 10.8.2.
- جعل Vite وأدوات البناء الأساسية متاحة أثناء Netlify build.
- تحديث package-lock.json بعد إضافة dependency ناقصة للاختبارات.
- تبسيط netlify.toml وإزالة build scripts المعقدة.
- تثبيت build command على: npm run build
- تثبيت publish directory على: dist
- تثبيت functions directory على: netlify/functions

## خطوات الرفع على GitHub

1. فك ضغط الملف.
2. ارفع محتويات الفولدر كلها إلى GitHub repo.
3. لازم يكون package.json و netlify.toml في جذر الريبو، وليس داخل فولدر فرعي.
4. لا ترفع node_modules.
5. لا ترفع dist إلا لو أنت فاهم إن ده static preview فقط. Netlify سيبني dist بنفسه.

## إعداد Netlify

Build command:

```bash
npm run build
```

Publish directory:

```txt
dist
```

Functions directory:

```txt
netlify/functions
```

Node version:

```txt
20.19.0
```

## Environment Variables المطلوبة في Netlify

أضف هذه القيم من:
Site configuration → Environment variables

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash-lite
REQUIRE_AUTH_FOR_AI=true
ALLOW_AI_WITHOUT_USAGE_GUARD=false
MAX_VISION_IMAGE_CHARS=1800000
NODE_VERSION=20.19.0
NPM_VERSION=10.8.2
NPM_CONFIG_PRODUCTION=false
```

## مهم جدًا

قبل أول Deploy بهذه النسخة:

Netlify → Deploys → Clear cache and deploy site

لو عندك Environment Variable قديمة باسم NODE_VERSION وقيمتها 22، غيّرها إلى 20.19.0.

لو عندك Environment Variable باسم NPM_CONFIG_PRODUCTION وقيمتها true، غيّرها إلى false أو احذفها.

## التحقق بعد النشر

افتح:

```txt
/version.json
```

يجب أن يظهر:

```txt
v105.3-github-netlify-deploy-ready
```

## SQL

لا يوجد SQL جديد في V105.3.
استخدم SQL الأساسي V104 إذا لم تكن شغلته من قبل:

```txt
supabase-v104-launch-candidate.sql
```
