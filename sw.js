// BUG FIX: bump this on every deploy that changes cached files, so old
// clients pick up new assets instead of being stuck on a stale cache-first
// response forever.
const CACHE_NAME = "moviio-v3";
const urlsToCache = [
  "/",
  "/style.css",
  "/script.js",
  "/theme.js",
  "/landing.css",
  "/landing.js",
  "/index.html",
  "/app.html",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
  // BUG FIX: activate the new SW immediately instead of waiting for all.
  self.skipWaiting();
});

// BUG FIX: this was missing in previous code entirely so  - without it, moviio accumulates forever and the browser
// never knows to serve from the newest one first.
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
  // BUG FIX: never intercept API calls
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});
