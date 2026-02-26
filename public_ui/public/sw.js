/**
 * 📱 Service Worker for PREDATOR Analytics
 *
 * Provides:
 * - Offline support
 * - Cache-first strategy for static assets
 * - Network-first strategy for API calls
 * - Background sync for offline actions
 */

const CACHE_NAME = 'predator-v1';
const STATIC_CACHE = 'predator-static-v1';
const API_CACHE = 'predator-api-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Self reference for TypeScript avoiding compiler errors implicitly
const sw = self;

// ========================
// Install Event
// ========================

sw.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE_ASSETS);
      console.log('[SW] Precached static assets');

      // Activate immediately
      await sw.skipWaiting();
    })()
  );
});

// ========================
// Activate Event
// ========================

sw.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== API_CACHE)
          .map(name => caches.delete(name))
      );

      // Take control of all pages immediately
      await sw.clients.claim();
    })()
  );
});

// ========================
// Fetch Event
// ========================

sw.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirstStrategy(event.request, API_CACHE));
    return;
  }

  // Static assets - Cache first with network fallback
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(event.request, STATIC_CACHE));
    return;
  }

  // Navigation requests - Network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      networkFirstStrategy(event.request, STATIC_CACHE).catch(() => {
        return caches.match('/index.html') || fetch(event.request);
      })
    );
    return;
  }

  // Default - Network first
  event.respondWith(networkFirstStrategy(event.request, CACHE_NAME));
});

// ========================
// Caching Strategies
// ========================

/**
 * Cache first - Try cache, fallback to network
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    // Update cache in background
    fetchAndCache(request, cacheName);
    return cached;
  }

  return fetchAndCache(request, cacheName);
}

/**
 * Network first - Try network, fallback to cache
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetchWithTimeout(request, 5000);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

/**
 * Fetch and update cache
 */
async function fetchAndCache(request, cacheName) {
  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }

  return response;
}

/**
 * Fetch with timeout
 */
function fetchWithTimeout(request, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout);

    fetch(request).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

// ========================
// Helper Functions
// ========================

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.ico', '.webp'
  ];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// ========================
// Message Handler
// ========================

sw.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    sw.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
    );
  }
});

// ========================
// Background Sync
// ========================

sw.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  // Implement background sync for offline actions
  console.log('[SW] Syncing pending requests');
}

// Required for TypeScript - export empty object
export { };
