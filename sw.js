const CACHE_NAME = 'obj4471-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/main.js',
  './src/config.js',
  './src/core/state.js',
  './src/core/timers.js',
  './src/core/focus-trap.js',
  './src/core/save.js',
  './src/core/audio.js',
  './src/core/dialog-audio.js',
  './src/content/chapters.js',
  './src/scene/renderer.js',
  './src/scene/room.js',
  './src/scene/terminal.js',
  './src/scene/desk.js',
  './src/scene/transitions.js',
  './src/ui/telemetry.js',
  './src/ui/photo-wall.js',
  './src/ui/reader.js',
  './src/ui/notebook.js',
  './src/ui/dialog47.js',
  './src/ui/cracks.js',
  './src/ui/thoughts.js',
  './src/styles/base.css',
  './src/styles/terminal.css',
  './src/styles/walls.css',
  './src/styles/reader.css',
  './src/styles/dialog47.css',
  './src/styles/notebook.css',
  './src/styles/overlays.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Некоторые файлы не удалось кэшировать:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});
