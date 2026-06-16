# Tactic Boss V131.10 — GitHub إلى Netlify

ارفع العناصر الموجودة داخل هذه الحزمة مباشرة إلى جذر مستودع GitHub:

- `dist/`
- `netlify/`
- `netlify.toml`
- هذا الملف

لا تضعها داخل مجلد إضافي.

بعد الـPush اختر في Netlify:

`Deploys → Trigger deploy → Clear cache and deploy site`

إعدادات النشر يقرأها Netlify تلقائيًا من `netlify.toml`:

- Build command: رسالة فقط؛ لا يوجد npm install أو build.
- Publish directory: `dist`
- Functions directory: `netlify/functions`

بعد النشر افتح:

`/version.json?check=13110`
