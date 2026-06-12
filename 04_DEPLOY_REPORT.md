# Tactic Boss AI V105.5 — GitHub Netlify Web Clean Deploy Report

## الهدف
حل فشل Netlify المتكرر عند `npm install` أو `vite build` بسبب تعارض Node/npm مع أدوات Capacitor الخاصة بالموبايل.

## المشكلة التي ظهرت في Netlify
آخر Log أظهر:

```txt
@capacitor/cli@8.4.0 required: node >=22.0.0
current: node v20.19.0
npm error Exit handler never called!
ERROR: Vite is still missing after install.
```

المعنى: نسخة الويب كانت تحمل أدوات موبايل غير مطلوبة على Netlify. هذه الأدوات أجبرت build environment على صراع بين Node 20 المستقر وNode 22 المطلوب لـ Capacitor CLI.

## الإصلاح في V105.5

### 1. إزالة Capacitor من Web Deploy
تم حذف الحزم التالية من `dependencies` في نسخة Netlify Web:

```txt
@capacitor/android
@capacitor/cli
@capacitor/core
```

هذه الحزم غير مستخدمة داخل كود الويب، ووجودها كان سبب تعارض بناء Netlify.

### 2. حذف سكريبتات Android من نسخة الويب
تم حذف:

```txt
android:add
android:sync
android:open
```

نسخة الويب لا تحتاج هذه السكريبتات.

### 3. ضمان وجود Vite في Production Dependencies
تم الإبقاء على `vite` و`@vitejs/plugin-react` و`typescript` داخل `dependencies` حتى لو Netlify عمل production install فقط.

### 4. Build Script أخف وأثبت
تم تعديل:

```txt
scripts/netlify-guaranteed-build.sh
```

ليعمل production install فقط إذا كان Vite غير موجود:

```bash
npm ci --omit=dev --legacy-peer-deps --no-audit --no-fund
./node_modules/.bin/vite build
```

### 5. تنظيف `.npmrc`
تم حذف إعداد `production=false` القديم لأنه كان يسبب تحذيرات npm. بقي فقط:

```txt
engine-strict=false
audit=false
fund=false
legacy-peer-deps=true
```

### 6. تحديث version.json
النسخة الجديدة:

```txt
v105.5-github-netlify-web-clean-no-capacitor
```

## التحقق المحلي
تم اختبار production install نظيف:

```bash
rm -rf node_modules dist
npm ci --omit=dev --legacy-peer-deps --no-audit --no-fund
npm run build
```

النتيجة:

```txt
Production install: Passed
Production build: Passed
```

وتم اختبار QA كامل:

```bash
npm ci --include=dev --legacy-peer-deps --no-audit --no-fund
npm run lint
npm test -- --run
npm run build
npm audit --audit-level=high --omit=dev
```

النتيجة:

```txt
TypeScript: Passed
Unit Tests: Passed — 10 files / 35 tests
Production Build: Passed
Security Audit: 0 vulnerabilities
```

## ملاحظات مهمة
- هذه نسخة Web/Netlify فقط.
- لو احتجت Android/Capacitor مستقبلاً، يجب عمل package منفصل للموبايل بعيدًا عن Netlify web deploy.
- لا يوجد SQL جديد مطلوب في V105.5.
- يجب تشغيل SQL V104 إذا لم يتم تشغيله مسبقًا.

## إعدادات Netlify المطلوبة

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

## Environment Variables

```txt
NODE_VERSION=20.19.0
NPM_VERSION=10.8.2
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash-lite
REQUIRE_AUTH_FOR_AI=true
ALLOW_AI_WITHOUT_USAGE_GUARD=false
MAX_VISION_IMAGE_CHARS=1800000
```
