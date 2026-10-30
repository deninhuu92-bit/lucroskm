/* LucroKM: arquivos do app disponíveis offline; URLs de terceiros não são armazenadas. */
const VERSION='lucrokm-v2.6.0';
const CACHE_FILES=['./','./index.html','./styles.css?v=2.6.0','./app.js?v=2.6.0','./manifest.webmanifest?v=2.6.0','./icons/favicon-64.png?v=2.6.0','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png',
  './assets/icons/arrow-right-arrow-left.svg',
  './assets/icons/arrow-trend-down.svg',
  './assets/icons/arrow-trend-up.svg',
  './assets/icons/calendar-days.svg',
  './assets/icons/car-side.svg',
  './assets/icons/car.svg',
  './assets/icons/chart-column.svg',
  './assets/icons/chart-pie.svg',
  './assets/icons/circle-check.svg',
  './assets/icons/circle-plus.svg',
  './assets/icons/clock.svg',
  './assets/icons/cloud-arrow-down.svg',
  './assets/icons/coins.svg',
  './assets/icons/download.svg',
  './assets/icons/file-arrow-down.svg',
  './assets/icons/file-csv.svg',
  './assets/icons/flag-checkered.svg',
  './assets/icons/floppy-disk.svg',
  './assets/icons/gas-pump.svg',
  './assets/icons/gauge-high.svg',
  './assets/icons/gear.svg',
  './assets/icons/hand-holding-dollar.svg',
  './assets/icons/house-chimney.svg',
  './assets/icons/info.svg',
  './assets/icons/list-ul.svg',
  './assets/icons/location-dot.svg',
  './assets/icons/mobile-screen-button.svg',
  './assets/icons/money-bill-wave.svg',
  './assets/icons/pause.svg',
  './assets/icons/pen.svg',
  './assets/icons/piggy-bank.svg',
  './assets/icons/play.svg',
  './assets/icons/plus.svg',
  './assets/icons/receipt.svg',
  './assets/icons/road.svg',
  './assets/icons/rotate-left.svg',
  './assets/icons/sack-dollar.svg',
  './assets/icons/shield-halved.svg',
  './assets/icons/shield.svg',
  './assets/icons/square-parking.svg',
  './assets/icons/stopwatch.svg',
  './assets/icons/ticket.svg',
  './assets/icons/trash-can.svg',
  './assets/icons/upload.svg',
  './assets/icons/utensils.svg',
  './assets/icons/wallet.svg',
  './assets/icons/wrench.svg',
  './assets/icons/xmark.svg'];
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
