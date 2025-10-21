// ✅ Nueva versión del caché
const CACHE = 'gastos-cache-v3';

// ✅ Archivos base que se guardan en caché
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 🔹 Instalar el Service Worker y guardar los archivos base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE))
  );
  self.skipWaiting();
});

// 🔹 Activar y limpiar versiones anteriores del caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 🔹 Estrategia de obtención:
//     - HTML → “network first” (descarga lo nuevo si hay conexión)
//     - Otros archivos → “cache first” (más rápido)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Si es una navegación o documento HTML
  const isHTML = req.mode === 'navigate' || req.destination === 'document';
  if (isHTML) {
    event.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(req) || caches.match('./index.html'))
    );
    return;
  }

  // Para imágenes, CSS, JS, etc.
  event.respondWith(
    caches.match(req).then(cached => {
      const fromNetwork = fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => cached);
      return cached || fromNetwork;
    })
  );
});

console.log('✅ Service Worker cargado correctamente — versión:', CACHE);
