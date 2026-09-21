// PITA Service Worker Stub
// Enables browser PWA installability without aggressive stale-while-revalidate caching

const CACHE_NAME = "pita-cache-v1";

self.addEventListener("install", (event) => {
  // Activate worker immediately without waiting
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim control of open clients
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through to network: ensures dashboard and APIs are always fresh and real-time
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() => {
      // Fallback response if offline
      return new Response(
        "Estás sin conexión a internet. Reconéctate para seguir gestionando tus reservas.",
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
          status: 503,
          statusText: "Offline",
        }
      );
    })
  );
});
