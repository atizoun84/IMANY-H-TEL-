const CACHE_NAME = 'imany-hotel-v1.0.0';

// Ressources à mettre en cache (structure à plat)
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.webmanifest',
    './logo.png'
];

// Installation : mise en cache des ressources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Mise en cache initiale');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Suppression ancien cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Stratégie de fetch
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non-HTTP (firebase websocket, etc.)
    if (!event.request.url.startsWith('http')) return;
    
    // Ignorer les requêtes Firebase (laisser passer au réseau)
    if (event.request.url.includes('firebaseio.com') || 
        event.request.url.includes('googleapis.com') ||
        event.request.url.includes('gstatic.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Cache d'abord (pour les assets)
                return cachedResponse;
            }
            
            // Sinon, réseau puis mise en cache
            return fetch(event.request).then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            }).catch(() => {
                // Si offline et pas en cache, on renvoie index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
