# Tactic Boss AI V131.2 — نسخة GitHub/Netlify الجاهزة

هذه نسخة Prebuilt لا تحتاج npm install ولا build على Netlify.

## ترتيب الملفات داخل ZIP

```
dist/
netlify/
netlify.toml
READ_ME_FIRST_V131_2_PREBUILT_AR.md
```

## طريقة الرفع

1. فك الضغط.
2. ارفع العناصر الأربعة إلى جذر Repository في GitHub مباشرة.
3. تأكد أن `dist` و `netlify.toml` ظاهرين في الصفحة الرئيسية للـRepository.
4. في Netlify اختر: Clear cache and deploy site.
5. بعد النشر افتح:

```
/version.json?check=1312
```

القيمة المتوقعة:

```
v131.2-web-production-final-tactics-settings-ux-hardfix
```

## ما تم إصلاحه

- إعادة تصميم شاشة إعدادات بناء الخطة إلى تبويبات: الأساسيات، الدفاع، التعليمات، السبورة.
- تبسيط اختيار الإعدادات بدل السلايدرز الطويلة والشكل المزدحم.
- مراجعة إعدادات PES/eFootball/EA FC/FIFA داخل شاشة البناء.
- إبقاء السبورة اختيارية بدل فرضها في كل لحظة.
- ربط التعليمات الفردية بلاعب/مركز واضح.
- الحفاظ على اللعبة المفضلة كمصدر الحقيقة لكل الأقسام.
