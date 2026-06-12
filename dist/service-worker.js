const CACHE = 'tactic-boss-v120-trap-arena';
const APP_SHELL = ['/', '/index.html', '/manifest.json?v=120', '/offline.html', '/version.json'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  const url = new URL(req.url);
  if (url.pathname === '/runtime-config.js' || url.pathname === '/version.json' || url.pathname === '/manifest.json') {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put('/index.html', copy));
      return response;
    }).catch(async () => (await caches.match('/index.html')) || (await caches.match('/offline.html'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(response => {
    if (response.ok && url.pathname.startsWith('/assets/')) caches.open(CACHE).then(cache => cache.put(req, response.clone()));
    return response;
  })));
});

self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
