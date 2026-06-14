# Tactic Boss AI V131 — نسخة GitHub → Netlify الجاهزة

## محتوى النسخة
ارفع محتويات ملف ZIP إلى جذر GitHub مباشرة:

```text
dist/
netlify/
netlify.toml
READ_ME_FIRST_V131_PREBUILT_AR.md
```

## إعدادات Netlify

```text
Build command:
echo 'Tactic Boss AI V131 prebuilt deploy: no npm install/build required'

Publish directory:
dist

Functions directory:
netlify/functions
```

## بعد النشر
افتح:

```text
/version.json?check=131
```

القيمة المتوقعة:

```text
v131-web-production-final-preferred-game-smart-board-session-resume-language-clean
```

## ملاحظات مهمة
- لا تحتاج هذه النسخة إلى npm install أو build داخل Netlify.
- غيّر اللعبة من الشريط العلوي أو الإعدادات فقط؛ كل الأقسام ستتبع اللعبة الحالية تلقائيًا.
- استخدم Clear cache and deploy site بعد رفع النسخة.
