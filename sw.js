// Asia 2027 V5.4 — coherent offline app shell; keep the existing registration.
const CACHE = 'asia-2027-v54-20261116';
const ROOT = self.registration.scope;
const url = path => new URL(path, ROOT).href;
const ENTRY = url('index.html');
const ASSETS = [ENTRY, ...['v4.css','push.js','exercise-images.js','v4.js','ai.js','health.js','v42.js','v43.js','v44.js','coach.js','help.js','ux51.js','nutrition52.js','gym53.js','rest533.js','progress54.js'].map(x=>url(x+'?v=54')), ...['manifest.json','asia-icon-v4-180.png','asia-icon-v4-192.png','asia-icon-v4-512.png'].map(url)];
const SHELL = new Set(ASSETS);
const HASHES = {"nutrition52.js": "bacd8a79d01ed4b53483ccc6541a54ad6a73290c1b695ef851a28708bb3571cd", "exercise-images.js": "f73d197863be42076d417c78d38618b3b3dc7d71b04315731e2ace29af7090fe", "v4.css": "45e6602e17385aaeb9258b3f90df02192c8600ff827c433fbcb8f0934d2ae8df", "v42.js": "a4ff8e88b25df5def52127fbb69b33b6b790c64b487d467b19150ba4d905233b", "ux51.js": "6f1305b43155d970766d23d44b6d5496a0aa06b4cc020dd19655b6dc700e793a", "asia-icon-v4-180.png": "06a1cf81a2ad003bcbf176284d352e8366829df84c323c46bc571e4a052a3cbc", "coach.js": "8e2c44a7f671d6b43798a9c2d016b1f4c14dfa7e973df66fae361b7a292313bd", "asia-icon-v4-192.png": "57dde001dc33d2f0345420b087975e290a8d22e124ca8070cd727731aaa8d82e", "asia-icon-v4-512.png": "2a3bd96ae2d39d21b5e0191ca92b4662bad123150e9eab9a701f234fab810d8b", "v44.js": "f83371165375dd9b6e827c750b5b680be5f66a609ea328465036d5e8cf537f6e", "v43.js": "67e5660e08d0646a5ca369fd71f8bc66ff442e824c727714c85b79dde061178d", "help.js": "5bb3d674cdd2d7835fc298e1ae5b634e9c0877a6610500781d5c20f47ce67f57", "health.js": "60c0e4e0590ba0a3ed4cfeb3de199c74742e96a35fd0e0b915a7182f7aa38ce0", "manifest.json": "0b309b0aafc889912bdc654e09528c2a9948618936c762f3c789e070dab1b79f", "v4.js": "a187ddabe53063db4121e3521c8e96d2c3286155848a8e94a99f56acd4cd7c9a", "push.js": "3e188fde35db3397e3beca7d12eb8d5b2fba967de5e2b7b6b01f90da8a3e90d2", "ai.js": "10c22b8a9cfe40b0c4366c25965b13bb8dbf5be6aa648ec3a2d12b904d2c021b", "index.html": "664a220906d9b57c14f13d466f86806f98133e414bfd499caeb5e557b34dec37", "gym53.js": "45c75aba00a45d74e6ac6283956ec0db772b2a9974ba8d0a3c98ca9877fa9dab", "rest533.js": "7acb9b5662d9150e920e50ce7a4554f66fac24c8caf106593110401297ca4047", "progress54.js": "5ed6915f7c5a7a35fabb4d431140bd886da19120c6a45ed28c35deded1cda88f"};
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
    if (asset === ENTRY && !(await response.clone().text()).includes('ASIA 2027 · V5.4')) throw new Error('HTML not yet published');
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
  await Promise.all((await caches.keys()).filter(k=>k.startsWith('asia-2027-') && k!==CACHE && k!==PREVIOUS_533 && k!==PREVIOUS_532 && k!==PREVIOUS && k!==PREVIOUS_531 && k!==PREVIOUS_531B).map(k=>caches.delete(k)));
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
    event.respondWith((async()=>{if(['53','531','531b','532','533'].includes(requestUrl.searchParams.get('v'))){const old=await caches.open(requestUrl.searchParams.get('v')==='533'?PREVIOUS_533:requestUrl.searchParams.get('v')==='532'?PREVIOUS_532:requestUrl.searchParams.get('v')==='531b'?PREVIOUS_531B:requestUrl.searchParams.get('v')==='531'?PREVIOUS_531:PREVIOUS);const cached=await old.match(req.url);if(cached)return cached}return fetch(req,{cache:'no-cache'})})());
  }
});
self.addEventListener('push',e=>{let p={};try{p=e.data?.json()||{}}catch{}e.waitUntil(self.registration.showNotification(p.title||'Asia 2027 · Mi progreso',{body:p.body||'Es hora de pesarte y registrar tu progreso.',icon:'./asia-icon-v4-192.png',tag:p.kind==='rest533'?'asia-rest':'asia-daily',data:{url:'./'}}))});self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(let c of cs)if(c.url.startsWith(self.registration.scope))return c.focus();return self.clients.openWindow('./')}))});

