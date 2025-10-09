self.addEventListener("install", (e) => {
  console.log("[ServiceWorker] Install");
  e.waitUntil(
    caches.open("charlie-cache").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/manifest.json",
        "/favicon.ico",
        "/static/js/bundle.js", // adjust if build outputs differently
      ]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
