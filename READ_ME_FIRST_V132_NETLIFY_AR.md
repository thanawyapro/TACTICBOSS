# Tactic Boss V132 — رفع GitHub ثم Netlify (نسخة Prebuilt مصححة)

هذه الحزمة لا تحتاج `package.json` ولا `npm install` ولا `npm run build`.

## الرفع الصحيح

ارفع محتويات ZIP مباشرة إلى جذر مستودع GitHub، بحيث يظهر في الجذر:

- `dist/`
- `netlify/`
- `netlify.toml`
- ملفات التعليمات والتقرير

لا ترفع المجلد الأب نفسه، ولا تضع الملفات داخل مجلد إضافي.

## بعد الـPush

في Netlify اختر:

`Deploys → Trigger deploy → Clear cache and deploy site`

الإعدادات الصحيحة:

- Build command: رسالة فقط، بدون npm
- Publish directory: `dist`
- Functions directory: `netlify/functions`

إذا ظهر في سجل Netlify الأمر `npm run build`، فهذا يعني أن المستودع ما زال يحتوي نسخة قديمة من `netlify.toml` أو أن ملفات ZIP لم تُرفع إلى جذر المستودع.

## التحقق

بعد نجاح النشر افتح:

`/version.json?check=13200`
