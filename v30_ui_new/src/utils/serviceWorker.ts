/**
 * 🔒 Service Worker Registration
 *
 * Handles PWA service worker registration with:
 * - Offline support
 * - Cache management
 * - Update notifications
 */

// Types for service worker events
interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

// Check if service workers are supported
const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator;
};

// Check if we're in localhost
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

/**
 * Register the service worker
 */
export const registerServiceWorker = async (config?: ServiceWorkerConfig): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    console.log('[SW] Service workers are not supported');
    return;
  }

  // Don't register in development unless explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_SW) {
    console.log('[SW] Skipping registration in development');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[SW] Service worker registered');

    // Handle updates
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New content is available
            console.log('[SW] New content available, please refresh');
            config?.onUpdate?.(registration);
          } else {
            // Content is cached for offline use
            console.log('[SW] Content cached for offline use');
            config?.onSuccess?.(registration);
          }
        }
      };
    };

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[SW] Back online');
      config?.onOnline?.();
    });

    window.addEventListener('offline', () => {
      console.log('[SW] Offline');
      config?.onOffline?.();
    });

  } catch (error) {
    console.error('[SW] Registration failed:', error);
  }
};

/**
 * Unregister all service workers
 */
export const unregisterServiceWorker = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
  }
  console.log('[SW] All service workers unregistered');
};

/**
 * Check for service worker updates
 */
export const checkForUpdates = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) return false;

  const registration = await navigator.serviceWorker.ready;
  await registration.update();

  return registration.waiting !== null;
};

/**
 * Skip waiting and activate new service worker
 */
export const skipWaiting = async (): Promise<void> => {
  const registration = await navigator.serviceWorker.ready;

  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
};

/**
 * Clear all caches
 */
export const clearCaches = async (): Promise<void> => {
  if (!('caches' in window)) return;

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
};

export default registerServiceWorker;
