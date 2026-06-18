# Tactic Boss V132.1 — إصلاح فتح التطبيق

هذه نسخة Flat Deploy: ملفات التطبيق موجودة مباشرة في جذر الحزمة، ولا يوجد مجلد `dist` مطلوب للنشر.

## مهم جدًا قبل الرفع

1. احذف ملفات النسخة السابقة من مستودع GitHub، خصوصًا:
   - `dist/`
   - `assets/`
   - `index.html`
   - `service-worker.js`
   - `netlify.toml`
2. فك هذه الحزمة.
3. ارفع **كل المحتويات الموجودة بداخلها مباشرة** إلى جذر مستودع GitHub.
4. يجب أن ترى في جذر GitHub مباشرة:
   - `index.html`
   - `assets/`
   - `manifest.json`
   - `runtime-config.js`
   - `netlify/`
   - `netlify.toml`
5. في Netlify اختر:
   - Deploys
   - Trigger deploy
   - Clear cache and deploy site

## ما يجب أن يظهر في Build log

`Tactic Boss V132.1 flat recovery: verified prebuilt files — no npm build required`

ولا يجب أن يظهر `npm run build`.

## التحقق بعد النشر

افتح:

`/version.json?check=1321`

ويجب أن ترى:

`v132.1-recovery-flat`

افتح رابط الموقع في نافذة خاصة أول مرة، ثم حدّث الصفحة مرة واحدة. النسخة تنظف Service Worker والكاش القديم تلقائيًا.
