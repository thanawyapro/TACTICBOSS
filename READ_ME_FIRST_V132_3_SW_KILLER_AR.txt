Tactic Boss V132.3 GitHub — إصلاح Service Worker

ارفع محتويات هذه الحزمة إلى جذر GitHub مباشرة.
يجب أن ترى في جذر المستودع:
- dist/
- netlify/
- netlify.toml
- هذا الملف

بعد الرفع: Netlify > Deploys > Trigger deploy > Clear cache and deploy site.

بعد النشر افتح:
/version.json?check=1323

ثم امسح Service Worker القديم من المتصفح مرة واحدة:
F12 > Application > Service Workers > Unregister
Application > Storage > Clear site data
ثم افتح /?fresh=1323
