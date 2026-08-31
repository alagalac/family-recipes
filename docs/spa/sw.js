const CACHE_NAME = 'cookbook-spa';
const appShell = [
  './',
  './index.html',
  './app.js',
  './foreword.md',
  './recipes.json',
  './styles.css',
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      const urls = appShell.map(path => new URL(path, self.registration.scope).href);
      return cache.addAll(urls).catch(err => {
        console.log('Cache addAll error:', err);
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for app assets, cache-first for other requests
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const isRecipesJson = url.pathname.includes('recipes.json');
  const isAppAsset = appShell.some(path => {
    return new URL(path, self.registration.scope).pathname === url.pathname;
  });

  event.respondWith(
    (isRecipesJson || isAppAsset ? networkFirstStrategy(event.request) : cacheFirstStrategy(event.request))
  );
});

// Network-first strategy for recipes.json
function networkFirstStrategy(request) {
  return fetch(request, { cache: 'no-cache' })
    .then(response => {
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, responseToCache);
      });
      return response;
    })
    .catch(() => {
      return caches.match(request);
    });
}

// Cache-first strategy for other assets
function cacheFirstStrategy(request) {
  return caches.match(request).then(response => {
    if (response) {
      return response;
    }
    return fetch(request).then(response => {
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, responseToCache);
      });
      return response;
    });
  }).catch(() => {
    return caches.match(new URL('./index.html', self.registration.scope).href);
  });
}
