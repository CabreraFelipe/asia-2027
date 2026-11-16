// Asia 2027 V5.0.1 — coherent offline app shell; keep the existing registration.
const CACHE = 'asia-2027-v501-20261116';
const ROOT = self.registration.scope;
const url = path => new URL(path, ROOT).href;
const ENTRY = url('index.html');
const ASSETS = [ENTRY, ...['v4.css','push.js','exercise-images.js','v4.js','ai.js','health.js','v42.js','v43.js','v44.js','coach.js'].map(x=>url(x+'?v=501')), ...['manifest.json','asia-icon-v4-180.png','asia-icon-v4-192.png','asia-icon-v4-512.png'].map(url)];
const SHELL = new Set(ASSETS);
const HASHES = {"index.html": "32cea693ed7157f7f2fc5b6301617e72665866d0c2b7e04079dc75fc4aa6d32e", "v4.css": "f88c51481beca9b298672e3c8bcef45b01113ebc01f45b9af2798154ec706606", "push.js": "3e188fde35db3397e3beca7d12eb8d5b2fba967de5e2b7b6b01f90da8a3e90d2", "exercise-images.js": "f73d197863be42076d417c78d38618b3b3dc7d71b04315731e2ace29af7090fe", "v4.js": "8b6f619be0b944d103210939b86edde9ce2c5515cd607646cda6d546cc018115", "ai.js": "2784db66c542b78fd12422ff794d60f4fc61efaeb04dde61785655f1d3145d79", "health.js": "1dc7df778d56fb7061479e9438865e50e1b14f6c66d8933552e2ad1de35fca72", "v42.js": "23cabfd0e86077d05ba4639eb69427816fca22730eb11234105bb982d588bd96", "v43.js": "794d5477872109d768a05638a02dcebb1d9b93321375d4fceb2215d557bcabda", "v44.js": "f83371165375dd9b6e827c750b5b680be5f66a609ea328465036d5e8cf537f6e", "manifest.json": "0b309b0aafc889912bdc654e09528c2a9948618936c762f3c789e070dab1b79f", "asia-icon-v4-180.png": "06a1cf81a2ad003bcbf176284d352e8366829df84c323c46bc571e4a052a3cbc", "asia-icon-v4-192.png": "57dde001dc33d2f0345420b087975e290a8d22e124ca8070cd727731aaa8d82e", "asia-icon-v4-512.png": "2a3bd96ae2d39d21b5e0191ca92b4662bad123150e9eab9a701f234fab810d8b", "coach.js": "2113d5b166b2edb36fd2c8f8e4a53c457d76d1b3d0188c50b5cdbe61b6f480ba"};
const PREVIOUS = "asia-2027-v500-20261116";
self.addEventListener('install', event => event.waitUntil((async()=>{
  // Fetch without relying on the browser HTTP cache. Do not activate a partial release.
  const fetched = await Promise.all(ASSETS.map(async asset => {
    const response = await fetch(new Request(asset,{cache:'reload'}));
    if (!response.ok || response.redirected) throw new Error('Missing app asset: '+asset);
    const type = response.headers.get('content-type') || '';
    if (asset === ENTRY && !(await response.clone().text()).includes('ASIA 2027 · V5.0.1')) throw new Error('HTML not yet published');
    if (/\.js\?/.test(asset) && /text\/html/i.test(type)) throw new Error('Wrong JS response');
    const name=new URL(asset).pathname.split('/').pop();
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join('');
    if(hash!==HASHES[name])throw new Error('Asset version mismatch: '+name);
    return [asset,response];
  }));
  const cache = await caches.open(CACHE);
  await Promise.all(fetched.map(([asset,response])=>cache.put(asset,response)));
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(k=>k.startsWith('asia-2027-') && k!==CACHE && k!==PREVIOUS).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET'||!req.url.startsWith(ROOT)) return;
  const requestUrl=new URL(req.url);
  const entryPath=new URL(ENTRY).pathname;
  const rootPath=new URL(ROOT).pathname;
  const navigation=req.mode==='navigate' && (requestUrl.pathname===rootPath || requestUrl.pathname===entryPath);
  if(navigation||SHELL.has(req.url)) {
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const key=navigation?ENTRY:req.url;
      return (await cache.match(key)) || fetch(key,{cache:'reload'});
    })());
  } else {
    // Old clients or non-shell files: don't pollute the versioned cache.
    event.respondWith((async()=>{if(requestUrl.searchParams.get('v')==='500'){const old=await caches.open(PREVIOUS);const cached=await old.match(req.url);if(cached)return cached}return fetch(req,{cache:'no-cache'})})());
  }
});
self.addEventListener('push',e=>{let p={};try{p=e.data?.json()||{}}catch{}e.waitUntil(self.registration.showNotification(p.title||'Asia 2027 · Mi progreso',{body:p.body||'Es hora de pesarte y registrar tu progreso.',icon:'./asia-icon-v4-192.png',tag:'asia-daily',data:{url:'./'}}))});self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(let c of cs)if(c.url.startsWith(self.registration.scope))return c.focus();return self.clients.openWindow('./')}))});

