# Tactic Boss AI V103 — Retention + Competition + Free Cost Guard

## هدف الإصدار
رفع الـ retention بسرعة وبأقل تكلفة ممكنة على الباقة المجانية، مع تحويل المنافسة من شكل محلي بسيط إلى نظام قابل للحفظ على Supabase، وإضافة حدود يومية لحماية Gemini / Vision AI من الاستهلاك العالي قبل أول ربح.

## أهم التعديلات

### 1. Coach League حقيقي + Local Fallback
- إضافة محرك منافسة جديد في `src/utils/competitionEngine.ts`.
- إضافة نقاط دوري المدربين عند الأفعال المفيدة:
  - توليد خطة.
  - حفظ خطة.
  - حفظ خصم.
  - تحدي الخصم اليومي.
  - تحليل صورة.
  - تحليل مباراة.
  - مشاركة كارت.
  - تحسين خطة.
- إضافة رتب تكتيكية مثل Rookie Coach / Smart Coach / Pro Analyst / Elite Tactician / Meta Master.
- إضافة Badges تكتيكية مثل Daily Rival Slayer / Vision Scout / Plan Keeper / Weekly Contender.
- لو SQL غير متركب، التطبيق يشتغل بنظام Local fallback بدون كسر التجربة.

### 2. Daily Rival Challenge
- تحدي يومي يظهر داخل صفحة المنافسة.
- الضغط على بدء التحدي يحتسب نقاط يومية مرة واحدة فقط.
- منع تكرار نفس مكافأة التحدي أكثر من مرة في اليوم.

### 3. Weekly Leaderboard
- إضافة قراءة leaderboard من Supabase RPC عند توفر SQL.
- عرض Top coaches أسبوعيًا بدون realtime لتقليل تكلفة Supabase.
- عدم استخدام Realtime أو Comments أو Feed ثقيل.

### 4. Daily AI Usage Guard
- إضافة limits يومية داخل التطبيق:
  - Free: 3 توليدات نصية، 1 تحليل صورة، 1 تحليل مباراة، 5 أسئلة مدرب يوميًا.
  - Pro/Elite لهم حدود أعلى.
- limits تعمل محليًا فورًا، وتعمل أيضًا عبر Supabase RPC عند تركيب SQL.
- الهدف: حماية Gemini API / Vision AI من الاستنزاف.

### 5. Netlify AI Function Protection
- إضافة Authorization Bearer token إلى طلبات Vision AI وAI Coach.
- تحديث Netlify Functions للتحقق من جلسة Supabase قبل استخدام Gemini/OpenAI.
- لو التحقق غير متاح، التطبيق يرجع للتحليل المحلي/fallback بدل فشل التجربة.
- تقليل حجم الصور المقبول إلى 1.5MB في الواجهة و1.8M base64 في Function.
- تقليل prompt/output tokens في Vision/Coach لتقليل التكلفة.

### 6. Supabase SQL جديد
تمت إضافة ملف:
`supabase-v103-retention-competition-free-cost-guard.sql`

يشمل:
- `coach_competition_profiles`
- `competition_events`
- `award_competition_points()`
- `consume_daily_ai_usage()`
- `get_weekly_coach_leaderboard()`
- RLS + revoke direct writes + RPC-only write model.

## التحقق
- `npm run lint` نجح.
- `npm test -- --run` نجح.
- `npm run build:web` نجح.
- 10 test files passed.
- 35 tests passed.
- Production build passed.

## ملاحظات مهمة للرفع
- لو هترفع ZIP Netlify Static فقط، هيتحدث الفرونت فقط.
- تحديث Netlify Functions الخاصة بحماية Gemini يحتاج نشر السورس عبر GitHub/Netlify build أو Netlify CLI، وليس مجرد Drag & Drop للـ dist فقط.
- يجب تشغيل SQL الجديد في Supabase قبل الاعتماد على leaderboard الحقيقي. بدون SQL سيعمل Local fallback.

## version.json
`v103-retention-competition-free-cost-guard`
