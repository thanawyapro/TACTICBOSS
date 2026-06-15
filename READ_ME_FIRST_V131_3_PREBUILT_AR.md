# Tactic Boss AI V131.3 — GitHub / Netlify Prebuilt

ارفع محتويات هذا الملف إلى جذر Repository في GitHub مباشرة.

المحتويات المطلوبة:

```text
dist/
netlify/
netlify.toml
READ_ME_FIRST_V131_3_PREBUILT_AR.md
```

إعدادات Netlify:

```text
Build command:
echo 'Tactic Boss AI V131.3 prebuilt deploy: no npm install/build required'

Publish directory:
dist

Functions directory:
netlify/functions
```

بعد الرفع استخدم:

```text
Deploys → Trigger deploy → Clear cache and deploy site
```

تحقق من النسخة:

```text
/version.json?check=1313
```
