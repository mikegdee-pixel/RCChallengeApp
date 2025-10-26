const CACHE = "rc-trivia-v1";
const ASSETS = [
  "./index.html",
  "./styles/app.css",
  "./js/main.js", "./js/ui.js", "./js/filters.js", "./js/gameEngine.js", "./js/dataLoader.js",
  "./data/questions.csv"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(net => {
      if (e.request.method === "GET") caches.open(CACHE).then(c => c.put(e.request, net.clone()));
      return net;
    }).catch(() => res))
  );
});