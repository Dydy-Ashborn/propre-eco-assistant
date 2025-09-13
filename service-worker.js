// Nom du cache
const CACHE_NAME = "propre-eco-cache-v1";

// Fichiers à mettre en cache
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/img/logo.png",
  "/manifest.json"
];

// Installation du SW et mise en cache
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Interception des requêtes
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
