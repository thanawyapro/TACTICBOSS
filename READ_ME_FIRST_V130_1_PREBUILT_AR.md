# Tactic Boss AI V130.1 — نسخة GitHub → Netlify الجاهزة

هذه نسخة Prebuilt لا تحتاج `npm install` ولا `npm run build` داخل Netlify.

## ترتيب الملفات المطلوب في جذر GitHub

```text
dist/
netlify/
netlify.toml
READ_ME_FIRST_V130_1_PREBUILT_AR.md
```

لا ترفع مجلدًا خارجيًا يحتوي هذه الملفات. يجب أن يظهر `dist` و`netlify.toml` مباشرة في الصفحة الرئيسية للـRepository.

## إعداد Netlify

```text
Build command:
echo 'Tactic Boss AI V130.1 prebuilt deploy: no npm install/build required'

Publish directory:
dist

Functions directory:
netlify/functions
```

بعد رفع الملفات إلى GitHub اختر في Netlify:

```text
Deploys → Trigger deploy → Clear cache and deploy site
```

## التأكد من النسخة

افتح بعد النشر:

```text
/version.json?check=1301
```

ويجب أن ترى:

```text
v130.1-web-production-final-stability-ui-core-flows-game-dna-clean-player-ui
```

## أهم إصلاحات V130.1

- إعادة اللوجو والهوية الموحدة في الرئيسية وكل الأقسام.
- إعادة شاشة تحميل احترافية تحمل شعار Tactic Boss AI.
- إعادة المسارات الأساسية بوضوح: مدربك الذكي، اضرب خصمك، ابنِ خطتك.
- إزالة رسائل SQL وMigration وSupabase وأرقام النسخ من واجهة اللاعب.
- فصل إعدادات PES الكلاسيكية عن eFootball.
- فصل FC IQ في FC25/FC26 عن Custom Tactics في FC24 وFIFA القديمة.
- توضيح الفرق بين إعداد داخل اللعبة وتوصية تكتيكية من المدرب.
- إضافة كشف تعارضات مرتبط بنظام كل لعبة داخل البناء اليدوي.
