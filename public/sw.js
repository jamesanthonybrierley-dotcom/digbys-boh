// Minimal service worker: its only job is to make the app installable to a
// phone's home screen. It intentionally does NOT cache dynamic app data —
// shifts, timesheets, and rates must always be loaded fresh. Static assets
// still benefit from the browser's normal HTTP cache.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: every request is handled normally by the network.
});
