// Tactic Boss V132.1 recovery service worker.
// This release intentionally removes previous offline caches to prevent mixed-version rendering.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.registration.unregister();
    const clientsList = await self.clients.matchAll({ type: 'window' });
    for (const client of clientsList) {
      try { await client.navigate(client.url); } catch (_) {}
    }
  })());
});
