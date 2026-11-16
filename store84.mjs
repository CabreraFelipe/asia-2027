// Development prototype, not loaded by the V6.0.1 app.
// Separate local namespace. No legacy writes, network, credentials or automatic migration.
export const DB_NAME = 'asia2027-v84-dev';
export const MODULES = Object.freeze(['gym','nutrition','progress','security','automation','preferences','planner','recovery','coach','adaptive','visual','simulator']);
const allowed = new Set(MODULES);
const MAX_BYTES = 512 * 1024;
function assertModule(name) { if (!allowed.has(name)) throw new Error('Módulo desconocido'); }
export function clonePayload(x) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) throw new Error('Se requiere un objeto');
  const visited=new WeakSet(), queue=[[x,0]];
  let count=0;
  while(queue.length) {
    const [v,d]=queue.pop(); if (++count>50000 || d>24) throw new Error('Estructura demasiado grande');
    if (v===null || ['string','boolean'].includes(typeof v) || (typeof v==='number'&&Number.isFinite(v))) continue;
    if (typeof v!=='object' || visited.has(v) || (!Array.isArray(v) && ![Object.prototype,null].includes(Object.getPrototypeOf(v)))) throw new Error('Valor no admitido');
    visited.add(v);
    for (const [k,a] of Object.entries(v)) {
      if (['__proto__','prototype','constructor'].includes(k) || /token|secret|password|api.?key|authorization|vapid|credential/i.test(k)) throw new Error('Campo no permitido');
      queue.push([a,d+1]);
    }
  }
  const s=JSON.stringify(x); if (new TextEncoder().encode(s).length>MAX_BYTES) throw new Error('Módulo demasiado grande');
  return JSON.parse(s);
}
export function openStore(factory=globalThis.indexedDB) {
  return new Promise((resolve,reject)=>{
    if(!factory) return reject(new Error('IndexedDB no disponible'));
    const r=factory.open(DB_NAME,1);
    r.onupgradeneeded=()=>r.result.createObjectStore('modules',{keyPath:'name'});
    r.onerror=()=>reject(r.error); r.onblocked=()=>reject(new Error('Cerrá las otras ventanas de desarrollo'));
    r.onsuccess=()=>{const db=r.result; db.onversionchange=()=>db.close(); resolve({
      close:()=>db.close(),
      readPair(){return new Promise((ok,fail)=>{const t=db.transaction('modules','readonly'),s=t.objectStore('modules'),names=['preferences','gym'],out={};t.oncomplete=()=>ok(out);t.onabort=()=>fail(t.error||new Error('Lectura abortada'));for(const name of names){const q=s.get(name);q.onsuccess=()=>{out[name]=q.result||{name,revision:0,payload:{}}}}})},
      replacePair(expected,payloads){const names=['preferences','gym'];for(const name of names){if(!Number.isSafeInteger(expected[name])||expected[name]<0||expected[name]===Number.MAX_SAFE_INTEGER)throw Error('Revisión inválida')};const safe=Object.fromEntries(names.map(name=>[name,clonePayload(payloads[name])]));return new Promise((ok,fail)=>{const t=db.transaction('modules','readwrite'),s=t.objectStore('modules'),out={};let completed=0,reason;t.oncomplete=()=>ok(out);t.onabort=()=>fail(reason||t.error||new Error('Restauración abortada'));for(const name of names){const q=s.get(name);q.onsuccess=()=>{try{const revision=q.result?.revision??0;if(revision!==expected[name])throw Error('Conflicto de revisión: no se restauró ningún módulo');out[name]={name,revision:revision+1,payload:safe[name]};if(++completed===names.length)for(const record of Object.values(out))s.put(record)}catch(e){reason=e;t.abort()}}}})},
      read(name){assertModule(name);return new Promise((ok,fail)=>{const t=db.transaction('modules','readonly'),q=t.objectStore('modules').get(name);let result;t.oncomplete=()=>ok(result||{name,revision:0,payload:{}});t.onabort=()=>fail(t.error||new Error('Lectura abortada'));q.onsuccess=()=>{result=q.result}})},
      write(name,expectedRevision,payload){assertModule(name);if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||expectedRevision===Number.MAX_SAFE_INTEGER)throw new Error('Revisión inválida');const safe=clonePayload(payload);
        return new Promise((ok,fail)=>{const t=db.transaction('modules','readwrite'),s=t.objectStore('modules'),q=s.get(name);let next,reason;
          t.oncomplete=()=>ok(next);t.onabort=()=>fail(reason||t.error||new Error('Guardado abortado'));
          q.onsuccess=()=>{try{const revision=q.result?.revision??0;if(revision!==expectedRevision)throw new Error('Conflicto: releé el módulo antes de guardar');next={name,revision:revision+1,payload:safe};s.put(next)}catch(e){reason=e;t.abort()}};
        });
      }
    })};
  });
}
