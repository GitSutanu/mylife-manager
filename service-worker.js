const C='mylife-v7',F=['./','index.html','manifest.json','css/style.css','js/config.js','js/db.js','js/reminders.js','js/app.js','assets/icon.svg','assets/icon-180.png','assets/icon-192.png','assets/icon-512.png','assets/favicon-32.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('index.html'))));});
