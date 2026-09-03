const CACHE_NAME = "moviio-v7";

const urlsToCache = [
  "/",
  "/index.html",
  "/app.html",
  "/trailer.html",
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
  "/styles/favourites.css",
  "/styles/dropdown.css",
  "/scripts/config.js",
  "/scripts/state.js",
  "/scripts/utils.js",
  "/scripts/api.js",
  "/scripts/favourites.js",
  "/scripts/ui.js",
  "/scripts/carousel.js",
  "/scripts/controls.js",
  "/scripts/trailer-page.js",
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
  // Never intercept API calls
  if (event.request.url.includes("/api/")) return;

  // For navigation requests (HTML), use network-first, falling back to cache
  if (event.request.mode === "navigate") {
    const url = new URL(event.request.url);
    // Cache/match by pathname only, so query strings like
    // ?filter=top_rated&genre=16 or ?movie_id=... don't fragment the cache
    // into entries that were never precached.
    const shellRequest = new Request(url.pathname, {
      headers: event.request.headers,
    });

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(shellRequest, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(shellRequest);
          return (
            cached || caches.match("/app.html") || caches.match("/index.html")
          );
        }),
    );
    return;
  }

  // For other assets (CSS, JS, images), use cache-first, then network
  event.respondWith(
    caches
      .match(event.request)
      .then(
        (response) =>
          response ||
          fetch(event.request).catch(
            () => new Response("", { status: 504, statusText: "Offline" }),
          ),
      ),
  );
});
