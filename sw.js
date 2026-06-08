// Lylou-Vely Service Worker
// Change ce numéro à chaque mise à jour du site pour forcer le rechargement
const CACHE_VERSION = 'lylou-vely-v15';

const FICHIERS_A_CACHER = [
  '/',
  '/index.html',
  '/fidelite.html',
  '/qrcode-fidelite.html',
  '/manifest.json',
  '/images/logo.png',
  '/images/post-facebook.png',
  '/images/collage-stand.png',
  '/images/marche-vaux.png',
  '/images/marche-ninane.png',
  '/images/marche-rouvreux.png',
  '/images/marche-boncelles.png',
  '/images/marche-tilff.png',
  '/images/marche-theux.png',
];

// ===== INSTALLATION : mise en cache de tous les fichiers =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(FICHIERS_A_CACHER);
    }).then(() => self.skipWaiting())
  );
});

// ===== ACTIVATION : supprime les anciens caches =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ===== STRATÉGIE : Network First avec fallback cache =====
// Essaie toujours le réseau en premier (pour avoir le contenu à jour)
// Si pas de réseau, sert depuis le cache (fonctionne hors ligne)
self.addEventListener('fetch', event => {
  // Ignore les requêtes non-GET et externes (Facebook, Google Fonts...)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mise en cache de la réponse fraîche
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Réseau indisponible → on sert depuis le cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback vers index.html pour les pages inconnues
          return caches.match('/index.html');
        });
      })
  );
});

// ===== NOTIFICATION DE MISE À JOUR =====
// Quand une nouvelle version est disponible, on notifie le site
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
