const CACHE_NAME = "mk-audio-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/index.json",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Shell: cache-first
  if (APP_SHELL.includes(url.pathname) || url.pathname === "/") {
    event.respondWith(caches.match(event.request).then((r) => r || fetch(event.request)));
    return;
  }

  // Audio: network only (без кэша, чтобы iOS не чистил всё)
  if (url.pathname.startsWith("/audio/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Остальное: network-first
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
