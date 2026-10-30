// Offline support for the home-screen app. Pages are network-first (the plan
// itself lives in localStorage), build assets and photos cache-first.
const CACHE = "budapest-v1";
const PAGES = ["/", "/map", "/explore", "/money", "/info", "/esim"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([...PAGES, "/icon.svg", "/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const hit = (await cache.match(request)) ?? (await cache.match(request, { ignoreSearch: true }));
    if (hit) return hit;
    if (request.mode === "navigate") return (await cache.match("/")) ?? Response.error();
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/static/") || /^\/(places|esim)\//.test(url.pathname) || /\.(png|svg|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  // Photos redirect to Wikimedia; leave them to the browser's own cache.
  if (url.pathname.startsWith("/api/photo")) return;
  event.respondWith(networkFirst(request));
});
