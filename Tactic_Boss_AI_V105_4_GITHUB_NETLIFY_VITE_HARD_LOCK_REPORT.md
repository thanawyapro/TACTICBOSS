# Tactic Boss AI V105.4 — GitHub Netlify Vite Hard Lock

## السبب الحقيقي للخطأ
Netlify كان يصل إلى مرحلة `npm run build` ثم يفشل بسبب:

```txt
sh: 1: vite: not found
```

هذا يحدث عندما يتم تثبيت المشروع بدون devDependencies أو عندما يكون Cache Netlify ناقصًا/مكسورًا. ظهور هذا السطر في اللوج يؤكد أن إعدادات الإنتاج ما زالت مؤثرة:

```txt
npm warn config production Use `--omit=dev` instead.
```

## ما الذي تم إصلاحه في V105.4

- نقل/تثبيت أدوات البناء الأساسية داخل production-safe dependencies:
  - `vite`
  - `@vitejs/plugin-react`
  - `@tailwindcss/vite`
  - `typescript`
- تنظيف `package-lock.json` بحيث لا يتم اعتبار `vite` dependency تطويرية فقط.
- إضافة سكريبت بناء مضمون:
  - `scripts/netlify-guaranteed-build.sh`
- تغيير `netlify.toml` ليستخدم:

```toml
[build]
  command = "bash scripts/netlify-guaranteed-build.sh"
  publish = "dist"
```

- السكريبت يقوم بالآتي:
  - يطبع إصدار Node/npm.
  - يجبر npm على include=dev أثناء البناء.
  - يلغي تأثير production install داخل السكريبت.
  - لو `vite` غير موجود، يعمل install داخلي آمن.
  - بعدها يشغل `./node_modules/.bin/vite build` مباشرة.

## التحقق المحلي
تم التشغيل بنجاح:

```bash
bash scripts/netlify-guaranteed-build.sh
npm run lint
npm test -- --run
npm audit --audit-level=high --omit=dev
```

النتائج:

- Build: Passed
- TypeScript: Passed
- Unit Tests: Passed — 10 files / 35 tests
- Security Audit: 0 vulnerabilities

## تعليمات Netlify المهمة

قبل أول Deploy بهذه النسخة:

1. ارفع محتوى ZIP إلى GitHub repository.
2. في Netlify اضغط:
   - Deploys → Clear cache and deploy site
3. الأفضل حذف هذه المتغيرات من Netlify لو كانت موجودة:
   - `NPM_CONFIG_PRODUCTION`
   - `NPM_CONFIG_INCLUDE`
4. تأكد أن `NODE_VERSION=20.19.0`.
5. إعدادات Build:
   - Build command: `bash scripts/netlify-guaranteed-build.sh`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

## ملاحظة عن GEMINI_MODEL
`GEMINI_MODEL` لا يسبب خطأ `vite: not found`. هذا المتغير يخص Netlify Functions بعد النشر، وليس مرحلة Vite build. يمكن ضبطه على:

```txt
GEMINI_MODEL=gemini-2.5-flash-lite
```

أو تركه فارغًا لو الدوال عندها default داخلي.
