const CACHE_NAME = "moviio-v4";
const urlsToCache = [
  "/",
  "/index.html",
  "/app.html",
  "/landing.css",
  "/theme.js",
  "/manifest.json",
  "/styles/main.css",
  "/styles/variables.css",
  "/styles/base.css",
  "/styles/header.css",
  "/styles/hero.css",
  "/styles/carousel.css",
  "/styles/trailer.css",
  "/styles/modal.css",
  "/styles/favorites.css",
  "/scripts/config.js",
  "/scripts/state.js",
  "/scripts/utils.js",
  "/scripts/api.js",
  "/scripts/favorites.js",
  "/scripts/ui.js",
  "/scripts/carousel.js",
  "/scripts/controls.js",
  "/scripts/trailer.js",
  "/scripts/modal.js",
  "/scripts/main.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});
