const CACHE_NAME = "edukids-africa-v4"; // bump version on deploy
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/logo.png",
  "/footer.html",
  "/about.html",
  "/subjects.html",
  "/subjects.json",
  "/quiz.html",
  "/quiz.js",
  "/reg.html",
  "/student.html",
  "/questions.json"
];

// Install & Cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate & Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network-first for JS/JSON and questions folder
  if (
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".json") ||
    url.pathname.includes("/questions")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Check version only for JSON in questions folder
          if (url.pathname.includes("/questions") && response.ok) {
            response.clone().json().then((data) => {
              const cacheKey = event.request.url;
              caches.open(CACHE_NAME).then((cache) => {
                cache.match(cacheKey).then((cachedResp) => {
                  if (cachedResp) {
                    cachedResp.json().then((cachedData) => {
                      if (data.version !== cachedData.version) {
                        cache.put(cacheKey, response.clone());
                      }
                    });
                  } else {
                    cache.put(cacheKey, response.clone());
                  }
                });
              });
            });
          } else {
            // cache JS and other JSON normally
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for other assets
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  }
});

// Optional: Force cache update from page
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "UPDATE_CACHE") {
    caches.open(CACHE_NAME).then((cache) => {
      urlsToCache.forEach((url) => {
        fetch(url).then((response) => {
          if (response.ok) cache.put(url, response.clone());
        });
      });
    });
  }
});
