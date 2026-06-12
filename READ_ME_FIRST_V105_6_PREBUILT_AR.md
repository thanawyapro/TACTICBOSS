# Tactic Boss AI V105.6 — GitHub Netlify Prebuilt No-NPM Deploy

هذه النسخة معمولة مخصوص لحل مشكلة Netlify التي ظهرت عندك:

- `npm error Exit handler never called`
- `vite: not found`
- فشل تثبيت dependencies على Netlify

## الفكرة

هذه النسخة لا تجعل Netlify يعمل `npm install` ولا `vite build`.
هي تحتوي على مجلد `dist` مبني وجاهز + `netlify/functions`.

لذلك لا يوجد `package.json` في الجذر، وهذا مقصود.
لا تضفه ولا تنسخ ملفات من النسخ القديمة فوق هذه النسخة.

## ماذا ترفع على GitHub؟

ارفع محتويات هذه النسخة كما هي إلى جذر الريبو.
لازم الجذر يحتوي على:

```txt
dist/
netlify/
netlify.toml
READ_ME_FIRST_V105_6_PREBUILT_AR.md
```

ولا يحتوي على:

```txt
package.json
package-lock.json
node_modules/
src/
public/
scripts/
```

## إعدادات Netlify

Build command:

```bash
echo 'Tactic Boss AI V105.6 prebuilt deploy: no npm install/build required'
```

Publish directory:

```txt
dist
```

Functions directory:

```txt
netlify/functions
```

أو اترك Netlify يقرأ هذه الإعدادات من `netlify.toml`.

## Environment Variables المطلوبة

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
```

## بعد الرفع

افتح:

```txt
/version.json
```

لازم يظهر:

```txt
v105.6-github-netlify-prebuilt-no-npm
```

## ملاحظة مهمة

هذه نسخة Deploy فقط، وليست نسخة تطوير.
لو عايز تعدل الكود لاحقًا، استخدم نسخة Source كاملة ثم ابني dist محليًا، وبعدها ارفع نسخة prebuilt جديدة.
