/*
 * Jester Service Worker
 * Copyright (c) 2025 Nick Bevins. All rights reserved.
 */

const CACHE_NAME = 'jester-v1';
// Determine base path (works both locally and on GitHub Pages)
const basePath = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/'));
const urlsToCache = [
  basePath + '/',
  basePath + '/index.html',
  basePath + '/styles.css',
  basePath + '/script.js',
  basePath + '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});