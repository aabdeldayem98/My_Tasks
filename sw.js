/* My Tasks — service worker
 * Makes the app installable and opens it instantly (even on a weak connection).
 * Your data always comes live from Google Apps Script — it is never cached here.
 * When you upload a new index.html, change VERSION below so phones pick up the update.
 */
const VERSION = 'v1';
const CACHE = 'mytasks-' + VERSION;
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('mytasks-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // API calls go straight to Google

  // Pages: try the network first (so updates show up), fall back to the saved copy when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy));
      return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  // Icons & manifest: saved copy first
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
