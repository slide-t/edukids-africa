const CACHE_NAME = "edukids-africa"; // fixed cache name
const urlsToCache = [
  "/", "/index.html", "/styles.css", "/script.js",
  "/logo.png", "/footer.html", "/about.html",
  "/subjects-curric.html", "/topics-details.html",
  "/topic-full.html", "/topics.json", "/classes.json",
  "/books.html", "/books.json", "/subjects.html",
  "/subjects.json", "/quiz.html", "/quiz.js",
  "/reg.html", "/student.html", "/questions.json",
  "/questions/", "/lessons/", "/FullNote/"
];

// Install & pre-cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(urlsToCache);
      self.skipWaiting();
    })()
  );
});

// Activate & clean any caches that don't match our fixed name
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
      self.clients.claim();
    })()
  );
});

// Fetch handler with auto-update
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResp = await cache.match(event.request);

      // Always fetch in background to update cache
      const fetchPromise = fetch(event.request)
        .then(async (networkResp) => {
          if (networkResp && networkResp.ok) {
            await cache.put(event.request, networkResp.clone());
          }
          return networkResp;
        })
        .catch(() => cachedResp); // fallback if offline

      // Return cached response immediately if exists, else wait for network
      return cachedResp || fetchPromise;
    })()
  );
});

// Optional: Manual cache update trigger (for dev/testing)
self.addEventListener("message", (event) => {
  if (event.data?.type === "UPDATE_CACHE") {
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        urlsToCache.map(async (url) => {
          try {
            const request = new Request(url, { cache: "reload" });
            const response = await fetch(request);
            if (response.ok) await cache.put(url, response.clone());
          } catch {}
        })
      );
    })();
  }
});
