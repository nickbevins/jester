/*
 * Jester Service Worker
 * Copyright (c) 2025 Nick Bevins. All rights reserved.
 */

// Network-first: always fetch the latest files and fall back to the cache when offline,
// so updates reach users without bumping this name. Change it only if the caching scheme changes.
const CACHE_NAME = 'jester-v3';
// Determine base path (works both locally and on GitHub Pages)
const basePath = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/'));
const urlsToCache = [
  basePath + '/',
  basePath + '/index.html',
  basePath + '/styles.css',
  basePath + '/script.js',
  basePath + '/manifest.json',
  basePath + '/apple-touch-icon.png',
  basePath + '/favicon-32.png',
  basePath + '/icon-192.png',
  basePath + '/icon-512.png'
];

// Install event - cache resources for offline use and activate right away
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches and take control of open pages
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME).map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch event - try the network first, fall back to the cache when offline
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    // 'no-cache' revalidates with the server so a new deploy is picked up immediately
    fetch(request, { cache: 'no-cache' })
      .then(response => {
        // Keep the cache current (skip one-off URLs like roster import links)
        if (response.ok && !url.search) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request, { ignoreSearch: true })
          .then(cached => cached || (request.mode === 'navigate' ? caches.match(basePath + '/index.html') : null))
          .then(cached => cached || Response.error())
      )
  );
});
