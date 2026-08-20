/* Radar Diário — Patrimar
   Estratégia: cache apenas do casco do aplicativo (HTML, ícones, manifest).
   As notícias NUNCA são cacheadas aqui — sempre vão à rede, para não
   correr o risco de a tela abrir com manchete velha achando que é a do dia. */

const CACHE = "radar-casco-v2";
const CASCO = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo-patrimar.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", evento => {
  evento.waitUntil(
    caches.open(CACHE)
      // Item a item: um arquivo ausente não pode impedir a instalação inteira
      .then(c => Promise.all(CASCO.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", evento => {
  const req = evento.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);

  // Feeds e pontes: sempre rede, nunca cache.
  if(url.origin !== self.location.origin) return;

  // Casco: rede primeiro, cache como reserva quando estiver offline.
  evento.respondWith(
    fetch(req)
      .then(resposta => {
        const copia = resposta.clone();
        caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
        return resposta;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
