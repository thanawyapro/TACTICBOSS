# ارفع Tactic Boss AI V130 على Netlify

## 1. Supabase
شغّل الملف التالي مرة واحدة داخل SQL Editor:

```text
supabase-v130-coach-os-cloud-state.sql
```

ثم شغّل:

```text
supabase-v130-coach-os-cloud-state-verification.sql
```

التطبيق يعمل محليًا بدون الـSQL، لكن تشغيله يجعل بيانات Coach OS تنتقل بين الأجهزة.

## 2. متغيرات Netlify

```text
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash
REQUIRE_AUTH_FOR_AI=true
ALLOW_AI_WITHOUT_USAGE_GUARD=false
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 3. إعداد Netlify للحزمة الجاهزة

```text
Build command:
echo 'Tactic Boss AI V130 prebuilt deploy: no npm install/build required'

Publish directory:
dist

Functions directory:
netlify/functions
```

## 4. التحقق
بعد النشر افتح:

```text
/version.json?check=130
```

ويجب أن يظهر:

```text
v130-web-production-final-coach-os-instant-rescue-memory-rival-passport-arena
```
