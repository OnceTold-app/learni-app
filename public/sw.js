// Learni Service Worker — offline shell
// Caches the app shell for instant load and basic offline fallback
const CACHE_NAME = 'learni-v1'
const OFFLINE_URL = '/'

// Assets to pre-cache (app shell)
const PRECACHE_URLS = [
  '/',
  '/login',
  '/signup',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // Non-fatal — some URLs may require auth
        console.warn('[SW] Pre-cache partial failure:', err)
      })
    }).then(() => self.skipWaiting())
  )
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch: network-first for API/dynamic, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API routes — always network, never cache
  if (url.pathname.startsWith('/api/')) return

  // _next/static assets — cache-first (they're content-hashed)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
      )
    )
    return
  }

  // Pages and other assets — network-first with offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for pages
        if (response.ok && request.destination === 'document') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        // Offline fallback: try cache, then offline page
        return caches.match(request).then((cached) =>
          cached || caches.match(OFFLINE_URL)
        )
      })
  )
})
