// 搞钱局 — offline-capable service worker (hand-rolled).
// Key rule: NEVER serve a stale index.html. HTML/navigations are network-first
// (so a redeploy's fresh HTML — with new hashed asset names — always wins);
// hashed assets are cache-first (immutable); Supabase/API always hit network.
const CACHE = 'gaoqian-v2'
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Never touch Supabase / API traffic.
  if (url.hostname.endsWith('supabase.co') || url.pathname.startsWith('/rest') || url.pathname.startsWith('/auth')) return

  const isDoc = req.mode === 'navigate' || req.destination === 'document' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')

  if (isDoc) {
    // network-first: always try to get the freshest HTML.
    e.respondWith(
      fetch(req)
        .then((res) => { caches.open(CACHE).then((c) => c.put('./index.html', res.clone())).catch(() => {}); return res })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html'))),
    )
    return
  }

  // hashed assets: cache-first, revalidate in background.
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') caches.open(CACHE).then((c) => c.put(req, res.clone())).catch(() => {})
        return res
      }).catch(() => cached)
      return cached || net
    }),
  )
})
