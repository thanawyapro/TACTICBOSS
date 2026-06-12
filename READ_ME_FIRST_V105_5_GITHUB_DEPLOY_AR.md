# Tactic Boss AI V105.5 — GitHub Netlify Web Clean Deploy

هذه النسخة مخصصة للرفع على GitHub ثم الربط مع Netlify.

## لماذا هذه النسخة؟

فشل Netlify سابقًا بسبب تعارض في بيئة البناء:
- `vite: not found`
- `@capacitor/cli@8.4.0 requires node >=22`
- npm error: `Exit handler never called`

في V105.5 تم فصل Build الويب عن أدوات الموبايل/Capacitor، لأن Capacitor غير مطلوب لنشر موقع الويب على Netlify.

## طريقة الرفع

1. افتح GitHub Desktop.
2. افتح repo التطبيق.
3. امسح الملفات القديمة من الريبو، ولا تمسح فولدر `.git` إن ظهر.
4. فك ضغط ملف V105.5.
5. انسخ محتويات فولدر V105.5 إلى جذر الريبو.
6. تأكد أن الملفات التالية موجودة مباشرة في جذر الريبو:
   - package.json
   - package-lock.json
   - netlify.toml
   - index.html
   - src/
   - public/
   - netlify/
   - scripts/
7. Commit ثم Push origin.

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

Environment variables المهمة:
```txt
NODE_VERSION=20.19.0
NPM_VERSION=10.8.2
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
REQUIRE_AUTH_FOR_AI=true
ALLOW_AI_WITHOUT_USAGE_GUARD=false
MAX_VISION_IMAGE_CHARS=1800000
```

## مهم جدًا

قبل أول Deploy:
```txt
Deploys → Clear cache and deploy site
```

لو عندك Environment Variables قديمة:
- `NPM_CONFIG_PRODUCTION=true`
- `NPM_CONFIG_INCLUDE=dev`

لم تعد ضرورية في V105.5. الأفضل حذفها، لكن حتى لو موجودة فالنسخة مصممة تكون آمنة لأن Vite أصبح ضمن dependencies الإنتاجية.

## بعد النشر

افتح:
```txt
/version.json
```

يجب أن يظهر:
```txt
v105.5-github-netlify-web-clean-no-capacitor
```
