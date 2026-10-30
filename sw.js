/* LucroKM: arquivos do app disponíveis offline; URLs de terceiros não são armazenadas. */
const VERSION='lucrokm-v2.8.0';
const CACHE_FILES=['./','./index.html','./styles.css?v=2.8.0','./app.js?v=2.8.0','./manifest.webmanifest?v=2.8.0','./lkm-favicon-64-v28.png','./lkm-apple-180-v28.png','./lkm-app-192-v28.png','./lkm-app-512-v28.png','./lkm-maskable-512-v28.png','./lkm-logo-oficial-v28.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CACHE_FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('lucrokm-')&&key!==VERSION).map(key=>caches.delete(key)))),self.clients.claim()]));});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(VERSION).then(cache=>cache.put('./index.html',copy)).catch(()=>{});}return res;}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok&&res.type==='basic'){const copy=res.clone();caches.open(VERSION).then(cache=>cache.put(req,copy)).catch(()=>{});}return res;})));
});
