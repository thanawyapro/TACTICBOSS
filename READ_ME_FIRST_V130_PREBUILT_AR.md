# رفع Tactic Boss AI V130 من GitHub إلى Netlify

هذه نسخة Prebuilt جاهزة، ولا تحتاج npm install أو npm run build.

## ترتيب الملفات الصحيح في جذر GitHub

```text
dist/
netlify/
netlify.toml
READ_ME_FIRST_V130_PREBUILT_AR.md
```

مهم: لا ترفع مجلدًا خارجيًا يحتوي هذه الملفات. يجب أن يظهر `dist` و`netlify.toml` مباشرة في الصفحة الرئيسية للـRepository.

## خطوات الرفع

1. امسح محتويات الـRepository القديمة مع الحفاظ على مجلد `.git` إذا كنت تعمل محليًا.
2. فك ضغط ملف V130 وانسخ الملفات الأربعة إلى جذر الـRepository مباشرة.
3. ارفع التغييرات إلى GitHub.
4. في Netlify استخدم:

```text
Build command:
echo 'Tactic Boss AI V130 prebuilt deploy: no npm install/build required'

Publish directory:
dist

Functions directory:
netlify/functions
```

5. من Netlify اختر **Clear cache and deploy site** مرة واحدة.
6. بعد نجاح النشر افتح:

```text
/version.json?check=130
```

المفروض يظهر إصدار V130.
