// Hub Delivery PWA Service Worker v1
var CACHE_NAME = 'hub-delivery-v4.1';
var urlsToCache = [
  '/Hub-Delivery-MX/',
  '/Hub-Delivery-MX/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Network first for API calls (Google Sheets data)
  if (event.request.url.indexOf('hub-delivery.angelhubamzl.workers.dev') !== -1) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(JSON.stringify({success: false, error: 'Offline'}), {
          headers: {'Content-Type': 'application/json'}
        });
      })
    );
    return;
  }
  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) return response;
      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function() {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/Hub-Delivery-MX/index.html');
        }
      });
    })
  );
});
