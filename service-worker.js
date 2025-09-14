const CACHE_NAME = "edukids-africa-v5"; // bump version on deploy
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/logo.png",
  "/footer.html",
  "/about.html",
  "/subjects-curric.html",
  "/topics-details.html",
  "/topic-full.html",
  "/topics.json",
  "/classes.json",
  "/books.html",
  "/books.json",
  "/subjects.html",
  "/subjects.json",
  "/quiz.html",
  "/quiz.js",
  "/reg.html",
  "/student.html",
  "/questions.json",
  "/questions/",   // cache folder
  "/lessons/"      // cache folder
  "/FullNote/"
];

// Install & cache immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate & clean old cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network-first for JSON, JS, questions & lessons
  if (
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".json") ||
    url.pathname.includes("/questions") ||
    url.pathname.includes("/lessons")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request)) // fallback offline
    );
    return;
  }

  // Stale-while-revalidate for HTML, CSS, images
  event.respondWith(
    caches.match(event.request).then((cachedResp) => {
      const fetchPromise = fetch(event.request).then((networkResp) => {
        if (networkResp && networkResp.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResp.clone()));
        }
        return networkResp;
      }).catch(() => cachedResp); // fallback if offline
      return cachedResp || fetchPromise;
    })
  );
});

// Manual cache update trigger
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
