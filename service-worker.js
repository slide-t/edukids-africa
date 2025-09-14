const CACHE_NAME = "edukids-africa-v7"; // bump version on deploy
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

// Activate & delete only outdated caches
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

// Fetch handler with network-first & stale-while-revalidate
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network-first for dynamic content
  if (
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".json") ||
    url.pathname.includes("/questions") ||
    url.pathname.includes("/lessons")
  ) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, response.clone());
          }
          return response;
        } catch {
          return caches.match(event.request);
        }
      })()
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResp = await cache.match(event.request);
      const fetchPromise = fetch(event.request)
        .then(async (networkResp) => {
          if (networkResp && networkResp.ok) await cache.put(event.request, networkResp.clone());
          return networkResp;
        })
        .catch(() => cachedResp);
      return cachedResp || fetchPromise;
    })()
  );
});

// Manual cache update trigger (only updates files that changed)
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
