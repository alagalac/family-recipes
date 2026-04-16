const CACHE_NAME = 'cookbook-spa-v2';
const urlsToCache = [
  '/',
  '/family-recipes/spa/',
  '/index.html',
  '/family-recipes/spa/index.html',
  '/app.js',
  '/family-recipes/spa/app.js',
  '/recipes.json',
  '/family-recipes/spa/recipes.json',
  '/styles.css',
  '/family-recipes/spa/styles.css',
  '/manifest.json',
  '/family-recipes/spa/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache).catch(err => {
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

// Fetch event - network-first for recipes.json, cache-first for others
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const isRecipesJson = url.pathname.includes('recipes.json');

  event.respondWith(
    (isRecipesJson ? networkFirstStrategy(event.request) : cacheFirstStrategy(event.request))
  );
});

// Network-first strategy for recipes.json
function networkFirstStrategy(request) {
  return fetch(request)
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
    return caches.match('/index.html');
  });
}
