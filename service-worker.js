const CACHE_NAME = 'atal-sagar-dam-v1';
const urlsToCache = [
  './',
  'index.html',
  'inflow.html',
  'outflow.html',
  'prediction.html',
  'css/style.css',
  'js/config.js',
  'js/api.js',
  'js/main.js',
  'js/dashboard.js',
  'js/inflow.js',
  'js/outflow.js',
  'js/prediction.js',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});