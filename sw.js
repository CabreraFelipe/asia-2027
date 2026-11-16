// Asia 2027 V5.6 — coherent offline app shell; keep the existing registration.
const CACHE = 'asia-2027-v56-20261116';
const ROOT = self.registration.scope;
const url = path => new URL(path, ROOT).href;
const ENTRY = url('index.html');
const ASSETS = [ENTRY, ...['v4.css','push.js','exercise-images.js','v4.js','ai.js','health.js','v42.js','v43.js','v44.js','coach.js','help.js','ux51.js','nutrition52.js','gym53.js','rest533.js','progress54.js','layout541.js','diag56.js'].map(x=>url(x+'?v=56')), ...['manifest.json','asia-icon-v4-180.png','asia-icon-v4-192.png','asia-icon-v4-512.png'].map(url)];
const SHELL = new Set(ASSETS);
const HASHES = {"nutrition52.js": "7c239d31eb0f1b98641e54b7972eb237e9e00c601bdf260f410419d090708a2f", "exercise-images.js": "f73d197863be42076d417c78d38618b3b3dc7d71b04315731e2ace29af7090fe", "v4.css": "a5ab0324c3e2b6af96d3ef22ad08c6c9f5963feffc6ad2e705979b75e1f39706", "v42.js": "d90e86906c5fb0bec65fabafc928b955327626e9f9ade8db8b6e84f70553b74c", "ux51.js": "6f1305b43155d970766d23d44b6d5496a0aa06b4cc020dd19655b6dc700e793a", "asia-icon-v4-180.png": "06a1cf81a2ad003bcbf176284d352e8366829df84c323c46bc571e4a052a3cbc", "coach.js": "0a96df394979997248f08787bd701729a5d81e7da67aa1d44ae22fae3de45968", "asia-icon-v4-192.png": "57dde001dc33d2f0345420b087975e290a8d22e124ca8070cd727731aaa8d82e", "asia-icon-v4-512.png": "2a3bd96ae2d39d21b5e0191ca92b4662bad123150e9eab9a701f234fab810d8b", "v44.js": "b919bb3ce2de7a224fa53fd1d5ca928bc1e45357a015c7c8fc78dbc512ca3f40", "v43.js": "9dcc486f1d5a5c336115f9cac20369b1dcf369dc4e4e755342d9e653c16040ef", "help.js": "5bb3d674cdd2d7835fc298e1ae5b634e9c0877a6610500781d5c20f47ce67f57", "health.js": "60c0e4e0590ba0a3ed4cfeb3de199c74742e96a35fd0e0b915a7182f7aa38ce0", "manifest.json": "0b309b0aafc889912bdc654e09528c2a9948618936c762f3c789e070dab1b79f", "v4.js": "5e4049a19da3e7f81d51bdcf888eaa33ade48adcc1aa529eb0c65268fc135c0c", "push.js": "3e188fde35db3397e3beca7d12eb8d5b2fba967de5e2b7b6b01f90da8a3e90d2", "ai.js": "8cc24eb59f267679686d8b4d5c81d7e2225a5d07c5f26017263d33e491bdfddc", "index.html": "b80150e5b3a3cade4e71a4a4ff930fc2a51bc941046af7aa0cc1308f50ab91d4", "gym53.js": "ba0038477a23fa3395665bcba9753d5acfa823b6a3e26a29680bcaa430f8287d", "rest533.js": "7acb9b5662d9150e920e50ce7a4554f66fac24c8caf106593110401297ca4047", "progress54.js": "fbc7877e75ab6f231729f59e8d56258d7abb6fe86f120327ff85b4bfbcc9cc83", "layout541.js": "f4eefd8bd693d03c4226a853ecf16cecb1a2c121137e8380aca6144ae1ce6e01", "diag56.js": "3b8f4210699a66d2c1adae4024835bd7691bd35bdafd1b10eaf6a37113829f7d"};
const PREVIOUS_55 = "asia-2027-v55-20261116";
const PREVIOUS_541 = "asia-2027-v541-20261116";
const PREVIOUS_54 = "asia-2027-v54-20261116";
const PREVIOUS_533 = "asia-2027-v533-20261116";
const PREVIOUS_532 = "asia-2027-v532-20261116";
const PREVIOUS = "asia-2027-v53-20261116";
const PREVIOUS_531B = "asia-2027-v531b-20261116";
const PREVIOUS_531 = "asia-2027-v531-20261116";
self.addEventListener('install', event => event.waitUntil((async()=>{
  // Fetch without relying on the browser HTTP cache. Do not activate a partial release.
  const fetched = await Promise.all(ASSETS.map(async asset => {
    const response = await fetch(new Request(asset,{cache:'reload'}));
    if (!response.ok || response.redirected) throw new Error('Missing app asset: '+asset);
    const type = response.headers.get('content-type') || '';
    if (asset === ENTRY && !(await response.clone().text()).includes('ASIA 2027 · V5.6')) throw new Error('HTML not yet published');
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
  await Promise.all((await caches.keys()).filter(k=>k.startsWith('asia-2027-') && k!==CACHE && k!==PREVIOUS_55 && k!==PREVIOUS_541 && k!==PREVIOUS_54 && k!==PREVIOUS_533 && k!==PREVIOUS_532 && k!==PREVIOUS && k!==PREVIOUS_531 && k!==PREVIOUS_531B).map(k=>caches.delete(k)));
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
    event.respondWith((async()=>{if(['53','531','531b','532','533','54','541','55'].includes(requestUrl.searchParams.get('v'))){const old=await caches.open(requestUrl.searchParams.get('v')==='55'?PREVIOUS_55:requestUrl.searchParams.get('v')==='541'?PREVIOUS_541:requestUrl.searchParams.get('v')==='54'?PREVIOUS_54:requestUrl.searchParams.get('v')==='533'?PREVIOUS_533:requestUrl.searchParams.get('v')==='532'?PREVIOUS_532:requestUrl.searchParams.get('v')==='531b'?PREVIOUS_531B:requestUrl.searchParams.get('v')==='531'?PREVIOUS_531:PREVIOUS);const cached=await old.match(req.url);if(cached)return cached}return fetch(req,{cache:'no-cache'})})());
  }
});
self.addEventListener('push',e=>{let p={};try{p=e.data?.json()||{}}catch{}e.waitUntil(self.registration.showNotification(p.title||'Asia 2027 · Mi progreso',{body:p.body||'Es hora de pesarte y registrar tu progreso.',icon:'./asia-icon-v4-192.png',tag:p.kind==='rest533'?'asia-rest':'asia-daily',data:{url:'./'}}))});self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(let c of cs)if(c.url.startsWith(self.registration.scope))return c.focus();return self.clients.openWindow('./')}))});


// Read-only cache status for V5.6 diagnostics.
self.addEventListener("message",event=>{if(event.data?.type!=="ASIA_DIAG_VERSION"||!event.ports?.[0])return;event.waitUntil((async()=>{const cache=await caches.open(CACHE);const keys=new Set((await cache.keys()).map(r=>r.url));event.ports[0].postMessage({cache:CACHE,count:ASSETS.filter(a=>keys.has(a)).length,complete:ASSETS.every(a=>keys.has(a))});})());});
