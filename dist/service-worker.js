// Tactic Boss V132.3 SW KILLER
// No fetch handler. This file only removes old broken service workers and caches.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (_) {}

    try {
      await self.clients.claim();
    } catch (_) {}

    try {
      await self.registration.unregister();
    } catch (_) {}

    try {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientsList) {
        try { client.postMessage({ type: 'TB_SW_KILLED', version: '132.3' }); } catch (_) {}
      }
    } catch (_) {}
  })());
});
