// Offline werken: de app-bestanden worden op de telefoon bewaard.
// Strategie: direct uit de opslag tonen, op de achtergrond een nieuwe versie ophalen
// (een update is dus bij de volgende keer openen zichtbaar).
// Verzoeken naar Claude (andere website) gaan altijd gewoon via internet.

const CACHE = 'ironfuel-v1';
const FILES = [
  './', 'index.html', 'styles.css', 'meals.js', 'store.js', 'claude.js', 'app.js',
  'manifest.webmanifest', 'credits.json', 'icon-180.png', 'icon-192.png', 'icon-512.png',
  ...['brinta', 'skyr', 'banaan', 'kiwi', 'mandarijn', 'broodje', 'stokbrood', 'bolognese',
    'broccoli', 'spinazie', 'wortelen', 'bloemkool', 'snijbonen'].map(n => `img/${n}.jpg`),
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request)
      .then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; })
      .catch(() => hit);
    if (hit) { e.waitUntil(fresh); return hit; }
    return fresh;
  }));
});
