const CACHE_NAME = 'hotelsmart-v1.2.0';

// Liste des ressources critiques à mettre en cache immédiatement
const ASSETS_TO_CACHE = [
  './',
  './index.html', // Ajoutez ici le nom exact de votre fichier de connexion s'il est différent de index.html
  './logo maison.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Poppins:wght@300;400;600&family=Montserrat:wght@800&family=Orbitron:wght@700&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// Événement d'installation : mise en cache des ressources statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mise en cache des ressources critiques');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Événement d'activation : nettoyage des anciens caches si la version change
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie Réseau d'abord, repli sur le Cache (Network First, falling back to cache)
// Idéal pour votre application qui dépend de données dynamiques (LocalStorage/Firebase)
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non HTTP(S) comme les extensions de navigateur ou Firebase WebSocket
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la réponse réseau est valide, on la clone et on met à jour le cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas de panne réseau (Hors ligne), on cherche dans le cache local
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Optionnel : Vous pouvez retourner une page d'erreur offline spécifique ici si nécessaire
        });
      })
  );
});
