const CACHE_NAME = "nido-shell-v11";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./firebase-config.js",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
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

// Solo cachea el "shell" estático. Nunca intercepta llamadas a Firebase,
// para que los datos siempre viajen en vivo y no se sirvan viejos desde caché.
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (event.request.method !== "GET" || url.includes("firebaseio.com") || url.includes("googleapis.com")) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
