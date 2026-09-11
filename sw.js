const CACHE_NAME = "moviio-v9";

const urlsToCache = [
  "/",
  "/index.html",
  "/trailer.html",
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
  if (event.request.url.includes("/api/")) return;

  if (event.request.mode === "navigate") {
    const url = new URL(event.request.url);
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
          return cached || caches.match("/index.html");
        }),
    );
    return;
  }

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
