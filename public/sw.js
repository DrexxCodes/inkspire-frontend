/*
 * Inkspire service worker.
 *
 * It deliberately caches nothing and never answers a request itself. Its only job is to exist with a
 * fetch handler, which keeps Chromium browsers offering their native "Install app" prompt (the in-app
 * Install button depends on it). Every request still goes straight to the network, so there is no way
 * for it to serve a stale page or a stale API response, and a deploy is picked up immediately.
 *
 * If offline support is added later, do it here (and delete old caches in the activate handler).
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No respondWith(): the browser handles the request normally.
self.addEventListener("fetch", () => {});
