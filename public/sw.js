// Offline play (design doc §10.5): the page is fetched from the network when there is one and
// from the cache otherwise; the hashed build files never change, so they are served from the
// cache once fetched. The game itself saves in localStorage and needs no server.
const CACHE = 'heliotrope-v1';
const SHELL = ['./', './manifest.webmanifest', './favicon.svg', './icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Build files kept; the oldest go first, so the files of past versions do not pile up. */
const MAX_FILES = 80;

async function keep(request, response) {
  const cache = await caches.open(CACHE);
  await cache.put(request, response);
  const keys = await cache.keys();
  for (const old of keys.slice(0, Math.max(0, keys.length - MAX_FILES))) {
    if (!SHELL.some((path) => new URL(path, self.location.href).href === old.url)) {
      await cache.delete(old);
    }
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) await (await caches.open(CACHE)).put('./', response.clone());
          return response;
        })
        .catch(async () => (await caches.match('./')) ?? Response.error()),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then(async (response) => {
          if (response.ok) await keep(request, response.clone());
          return response;
        }),
    ),
  );
});
