const CACHE = 'guitarra-v1';
const ASSETS = [
  './guitar_trainer.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;500;700&display=swap',
  'https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRYEF8RQ.woff2',
  'https://fonts.gstatic.com/s/syne/v22/8vIS7w4qzmVxsWxjBZRjr0FKM_04uQ.woff2'
];

// Instalar: cachear archivos locales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cachear assets locales (críticos) y externos por separado
      const local = ASSETS.filter(a => a.startsWith('./'));
      const external = ASSETS.filter(a => !a.startsWith('./'));
      return cache.addAll(local).then(() =>
        Promise.allSettled(external.map(url =>
          fetch(url).then(r => cache.put(url, r)).catch(() => {})
        ))
      );
    })
  );
  self.skipWaiting();
});

// Activar: limpiar caches antiguos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first, fallback a red
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cachear nuevas respuestas válidas
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Sin red y sin caché: devolver la app principal
        if (e.request.destination === 'document') {
          return caches.match('./guitar_trainer.html');
        }
      });
    })
  );
});
