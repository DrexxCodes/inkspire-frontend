/*
 * Inkspire service worker.
 *
 * It does two small things and nothing else:
 *  1. Keeps a fetch handler, which keeps Chromium browsers offering their native "Install app" prompt
 *     (the in-app Install button depends on it).
 *  2. When a PAGE load fails because there is no internet (opening or refreshing the app offline), it answers
 *     with the friendly /offline.html page instead of the browser's error.
 *
 * Everything else (scripts, images, API calls, pages that load fine) goes straight to the network, so there is
 * no way for it to serve a stale page or a stale API response, and a deploy is picked up immediately.
 *
 * If you edit public/offline.html, bump CACHE so phones fetch the new copy.
 */
const CACHE = "inkspire-offline-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/mark.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // One missing file must not stop the worker installing (that would also break the Install prompt).
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  // Only full page loads. No respondWith() for anything else: the browser handles those normally.
  if (request.mode !== "navigate") return;
  event.respondWith(
    fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error()),
  );
});
