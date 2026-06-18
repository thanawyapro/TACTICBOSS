# Tactic Boss V132.2 — GitHub Deploy

ارفع محتويات هذه الحزمة مباشرة إلى جذر المستودع، بحيث يظهر `dist/` و`netlify/` و`netlify.toml` في الجذر.

في Netlify:
- Base directory: اتركه فارغًا
- Build command: يقرأ تلقائيًا من `netlify.toml`
- Publish directory: `dist`

ثم: Deploys → Trigger deploy → Clear cache and deploy site.

التحقق: افتح `/version.json?check=1322`.
