// Service Worker pour Propre Eco
const CACHE_NAME = 'propre-eco-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/index.css',
  '/js/index.js',
  '/js/config.js',
  '/img/logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
