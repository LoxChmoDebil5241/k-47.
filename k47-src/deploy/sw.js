// Сброс старого сервис-воркера OBJ-4471. Он отдавал файлы из кэша и мог
// подсовывать устаревшую страницу вместо игры. Этот файл занимает его место,
// чистит кэш, снимает регистрацию и перезагружает открытые вкладки.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const tabs = await self.clients.matchAll({ type: 'window' });
    tabs.forEach(tab => tab.navigate(tab.url));
  })());
});
