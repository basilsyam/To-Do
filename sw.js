const cacheName = 'todo-v3';
const assets = [
  './',
  'index.html',
  'style.css',
  'script.js',
  './image/icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700;800&display=swap'
];

// Install event
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('caching shell assets');
      cache.addAll(assets);
    })
  );
});

// Activate event
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== cacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {
      return cacheRes || fetch(evt.request).then(fetchRes => {
        return caches.open(cacheName).then(cache => {
          // Only cache same-origin resources to avoid CORS issues
          if (evt.request.url.startsWith(self.location.origin)) {
            cache.put(evt.request.url, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    }).catch(() => {
        if(evt.request.url.indexOf('.html') > -1){
            return caches.match('/index.html');
        }
    })
  );
});
