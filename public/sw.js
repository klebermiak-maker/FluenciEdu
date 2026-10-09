// FluenciEdu - Service Worker para suporte PWA e visualização Offline
const CACHE_NAME = 'fluenciedu-cache-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Instalação do Service Worker e pré-cache de recursos vitais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Limpeza de caches antigos na ativação
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Fetch com suporte completo a visualização offline
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorar requisições não GET (ex: POST, PUT, DELETE)
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requisições com scheme especial como chrome-extension://
  if (!request.url.startsWith('http')) {
    return;
  }

  // Requisições de navegação HTML (Páginas do SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Requisições de recursos estáticos (JS, CSS, Imagens, Fontes): Cache com fallback de rede e atualização em segundo plano
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Em caso de falha de rede e sem cache, responde com fallback seguro
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
