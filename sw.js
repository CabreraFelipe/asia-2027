// Asia 2027 V6.0 — coherent offline app shell; keep the existing registration.
const CACHE = 'asia-2027-v600-20261116';
const PREVIOUS_573='asia-2027-v573-20261116';
const PREVIOUS_572 = 'asia-2027-v572-20261116';
const ROOT = self.registration.scope;
const url = path => new URL(path, ROOT).href;
const ENTRY = url('index.html');
const ASSETS = [ENTRY, ...['v4.css','push.js','exercise-images.js','v4.js','ai.js','health.js','v42.js','v43.js','v44.js','coach.js','help.js','ux51.js','nutrition52.js','gym53.js','rest533.js','progress54.js','layout541.js','diag56.js','gym571.js'].map(x=>url(x+'?v=600')), ...['manifest.json','asia-icon-v4-180.png','asia-icon-v4-192.png','asia-icon-v4-512.png'].map(url)];
const SHELL = new Set(ASSETS);
const HASHES = {"nutrition52.js": "157ae72dacff6184a744258641ac74a459c35fcb0c04bdf929f0a0c81296c038", "exercise-images.js": "f73d197863be42076d417c78d38618b3b3dc7d71b04315731e2ace29af7090fe", "v4.css": "738ae5963cec1a94d06eef3b020e684e8da3dd02fec9ed0301f47653dc9ae23c", "v42.js": "398ffe1d39d2399e5390e549fd0d2f8a32670ad9a79106ac30c7d75d9012cd02", "ux51.js": "6f1305b43155d970766d23d44b6d5496a0aa06b4cc020dd19655b6dc700e793a", "asia-icon-v4-180.png": "06a1cf81a2ad003bcbf176284d352e8366829df84c323c46bc571e4a052a3cbc", "coach.js": "bcab534b2e7916ec4946a6b828903a9db90b595301da6e31637c7aa43789b916", "asia-icon-v4-192.png": "57dde001dc33d2f0345420b087975e290a8d22e124ca8070cd727731aaa8d82e", "asia-icon-v4-512.png": "2a3bd96ae2d39d21b5e0191ca92b4662bad123150e9eab9a701f234fab810d8b", "v44.js": "b919bb3ce2de7a224fa53fd1d5ca928bc1e45357a015c7c8fc78dbc512ca3f40", "v43.js": "9dcc486f1d5a5c336115f9cac20369b1dcf369dc4e4e755342d9e653c16040ef", "help.js": "73510f54424ec35b1e429f1afb6ff3db59f93167d1d7e60d868bd1c3f974296c", "health.js": "6cc48af0429d9d42def922b60d13ae5d3b429c80f670fab6f7269a422c40c146", "manifest.json": "0b309b0aafc889912bdc654e09528c2a9948618936c762f3c789e070dab1b79f", "v4.js": "f136da31d04d8f92e7f0a6a9fac3f7874c446ac2ec4128357affa61c18267464", "push.js": "3e188fde35db3397e3beca7d12eb8d5b2fba967de5e2b7b6b01f90da8a3e90d2", "ai.js": "8cc24eb59f267679686d8b4d5c81d7e2225a5d07c5f26017263d33e491bdfddc", "index.html": "a8dca8490cca09ecd65774c94c18fbcee2e7d9aeceecd1cd7ea017651b5e1ef6", "gym53.js": "ca12b39249c7f7ef1cf0643a4237ea4b718e0c3a04d4dec2e7b8610616477aee", "rest533.js": "7acb9b5662d9150e920e50ce7a4554f66fac24c8caf106593110401297ca4047", "progress54.js": "1d624253c38ea7bbf1037c5d4e485806d2b08336131e51225913b65a4d13a1d3", "layout541.js": "f4eefd8bd693d03c4226a853ecf16cecb1a2c121137e8380aca6144ae1ce6e01", "diag56.js": "cd03b2a72b46289fe1cfb82f1fe261bc5b433b2ea6ca75e223a32e37c4ab1765", "gym571.js": "5e5b00b6e135c06f28b89ea7c913b351d1696dd7b078677195930f637fb43b29"};
self.addEventListener('install', event => event.waitUntil((async()=>{
  // Fetch without relying on the browser HTTP cache. Do not activate a partial release.
  const fetched = await Promise.all(ASSETS.map(async asset => {
    const response = await fetch(new Request(asset,{cache:'reload'}));
    if (!response.ok || response.redirected) throw new Error('Missing app asset: '+asset);
    const type = response.headers.get('content-type') || '';
    if (asset === ENTRY && !(await response.clone().text()).includes('ASIA 2027 · V6.0')) throw new Error('HTML not yet published');
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
  // Retain prior shells while clients may still be using them. Prune only when there are no other app windows.
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  if(clients.length<=1)await Promise.all((await caches.keys()).filter(k=>/^asia-2027-v[0-9a-z]+-\d{8}$/.test(k)&&k!==CACHE&&k!==PREVIOUS_573&&k!==PREVIOUS_572).map(k=>caches.delete(k)));
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
    event.respondWith((async()=>{const v=requestUrl.searchParams.get('v');if(v&&/^[0-9a-z]+$/.test(v)){const name='asia-2027-v'+v+'-20261116';if((await caches.keys()).includes(name)){const cached=await (await caches.open(name)).match(req.url);if(cached)return cached}}return fetch(req,{cache:'no-cache'})})());
  }
});
self.addEventListener('push',e=>{let p={};try{p=e.data?.json()||{}}catch{}e.waitUntil(self.registration.showNotification(p.title||'Asia 2027 · Mi progreso',{body:p.body||'Es hora de pesarte y registrar tu progreso.',icon:'./asia-icon-v4-192.png',tag:p.kind==='rest533'?'asia-rest':'asia-daily',data:{url:'./'}}))});self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(let c of cs)if(c.url.startsWith(self.registration.scope))return c.focus();return self.clients.openWindow('./')}))});


// Read-only cache status for V6.0 diagnostics.
self.addEventListener("message",event=>{if(event.data?.type!=="ASIA_DIAG_VERSION"||!event.ports?.[0])return;event.waitUntil((async()=>{const cache=await caches.open(CACHE);const keys=new Set((await cache.keys()).map(r=>r.url));event.ports[0].postMessage({cache:CACHE,count:ASSETS.filter(a=>keys.has(a)).length,complete:ASSETS.every(a=>keys.has(a))});})());});
