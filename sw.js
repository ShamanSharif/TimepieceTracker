const CACHE_NAME = 'timepiece-tracker-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/feather-icons',
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap'
];

// Install Event - Caches essential files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

// Activate Event - Cleans up old caches if version changes
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Serves from cache, falls back to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if found
                if (response) {
                    return response;
                }
                
                // Otherwise fetch from network
                return fetch(event.request).then(
                    function(networkResponse) {
                        // Check if valid response
                        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        let responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                // Only cache same-origin requests or allowed CDNs
                                if (event.request.url.startsWith(self.location.origin) || 
                                    event.request.url.includes('fonts.') || 
                                    event.request.url.includes('unpkg.com')) {
                                    cache.put(event.request, responseToCache);
                                }
                            });

                        return networkResponse;
                    }
                );
            })
    );
});