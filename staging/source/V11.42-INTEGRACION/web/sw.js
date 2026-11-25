// Only public offline notice is cached. Never cache diary, auth, API or private assets.
const CACHE='asia-v1142-public-notice-v1',OFFLINE='/v11.42/offline.html';
self.addEventListener('install',event=>event.waitUntil((async()=>{const r=await fetch(OFFLINE,{cache:'no-store',credentials:'omit'});if(!r.ok)throw Error('Aviso no disponible');await (await caches.open(CACHE)).put(OFFLINE,r)})()));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||event.request.mode!=='navigate'||!['/v11.42/','/v11.42/index.html'].includes(u.pathname)||u.search)return;event.respondWith(fetch(event.request).catch(async()=>await (await caches.open(CACHE)).match(OFFLINE)||Response.error()))});

self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
