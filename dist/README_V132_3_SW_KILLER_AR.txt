Tactic Boss V132.3 — إصلاح Service Worker

استخدم هذه الحزمة عندما يظهر التطبيق بشكل مكسور أو تظهر أخطاء service-worker.js في Console.

طريقة Direct Deploy:
- Netlify > Deploys > Deploy manually
- ارفع هذا ZIP كما هو.

بعد النشر افتح:
/version.json?check=1323

ثم من المتصفح نفذ مرة واحدة:
1) F12
2) Application > Service Workers > Unregister
3) Application > Storage > Clear site data
4) افتح الرابط مع ?fresh=1323

أو من Console نفذ:
navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))); caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))); localStorage.clear(); sessionStorage.clear(); setTimeout(()=>location.href='/?fresh=1323',500);
