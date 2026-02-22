// Service Worker pour Propre Eco
const CACHE_VERSION = 'v10'; // ← Incrémenter à chaque déploiement
const CACHE_NAME = `propre-eco-${CACHE_VERSION}`;

const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/index.css',
  '/js/index.js',
  '/js/config.js',
  '/img/logo.png'
];

// ─── INSTALL : Mise en cache + activation immédiate ───────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Force l'activation sans attendre la fermeture des onglets
  );
});

// ─── ACTIVATE : Purge des anciens caches ──────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(name => name.startsWith('propre-eco-') && name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim()) // Prend le contrôle de tous les onglets ouverts immédiatement
  );
});

// ─── FETCH : Network-first pour HTML, Cache-first pour assets ─────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore les requêtes non-HTTP (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Ignore Firebase, ImgBB et autres API externes → toujours réseau
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('imgbb.com') ||
    url.hostname.includes('googleapis.com')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML → Network-first (garantit la fraîcheur du shell applicatif)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request)) // Fallback cache si hors-ligne
    );
    return;
  }

  // Assets (JS, CSS, images) → Cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      });
    })
  );
});

// ─── MESSAGE : Commande skipWaiting depuis l'UI ───────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});