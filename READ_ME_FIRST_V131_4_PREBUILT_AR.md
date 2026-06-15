# Tactic Boss V131.4 — رفع GitHub ثم Netlify

هذه حزمة **Prebuilt**؛ لا تحتاج npm install أو npm build داخل Netlify.

## ترتيب الملفات في جذر GitHub

ارفع محتويات ZIP مباشرة، بحيث يظهر في الصفحة الرئيسية للـRepository:

```text
dist/
netlify/
netlify.toml
READ_ME_FIRST_V131_4_PREBUILT_AR.md
```

لا ترفع مجلدًا خارجيًا يحتوي هذه العناصر؛ العناصر نفسها يجب أن تكون في جذر الـRepository.

## Netlify

الحزمة تحتوي إعداداتها داخل `netlify.toml`:

```text
Build command:
echo 'Tactic Boss V131.4 prebuilt deploy: no npm install/build required'

Publish directory:
dist

Functions directory:
netlify/functions
```

بعد Push إلى GitHub:

1. افتح Netlify.
2. ادخل إلى Deploys.
3. اختر Trigger deploy.
4. اختر Clear cache and deploy site.

## التحقق بعد النشر

افتح:

```text
/version.json?check=1314
```

يجب أن ترى:

```text
v131.4-web-production-final-authentic-game-dna
```

## Smoke Test سريع قبل الإعلان

- تسجيل الدخول.
- تغيير اللعبة الحالية من الشريط العلوي ثم التأكد أن الأقسام تتغير معها.
- تجربة مولد الخطة في eFootball والتأكد من ظهور أساليب اللعب المختلفة.
- فتح ابنِ خطتك في PES والتأكد من 2 تعليمات هجومية + 2 دفاعية.
- التأكد أن اختيار اللاعب لا يظهر في PES إلا مع دفاعي وهجوم ضاغط.
- تجربة eFootball Individual Instructions.
- فتح الميتا والدخول إلى تفاصيل خطة.
- حفظ خطة، عمل Refresh، والتأكد من استعادة البيانات.
