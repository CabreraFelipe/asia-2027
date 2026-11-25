/* Asia V11.8 LAB — never intercept requests outside this local same-origin app. */
const VERSION='asia-v118-lab-static-1';
const FILES=['./index.html','./styles.css','./app.mjs','./vault117.mjs','./icon.svg','./manifest.webmanifest','../coach115-client.mjs','../wellness116-client.mjs'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('asia-v117-lab-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 const u=new URL(e.request.url),isHome=u.pathname===new URL('./',self.registration.scope).pathname;
 if(!isHome&&!FILES.some(f=>new URL(f,self.registration.scope).pathname===u.pathname))return;
 const lookup=isHome?new URL('./index.html',self.registration.scope):e.request;
 e.respondWith(caches.match(lookup).then(hit=>hit||fetch(e.request)));
});
