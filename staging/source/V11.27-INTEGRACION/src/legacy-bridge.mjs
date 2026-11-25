// Explicit adapter for legacy Storage-shaped APIs. No native browser storage fallback.
export function createLegacyBridge({vault,policy,onDirty=()=>{}}){
 const portable=new Set(policy.portable),device=new Set(policy.groups.device),credentials=new Set(policy.groups.credentials);
 const temporary=new Map(),unknown=new Set();
 let active=true;
 const guard=()=>{if(!active)throw Error('Almacenamiento de sesión cerrado')};
 function kind(k){guard();if(typeof k!=='string')throw Error('Clave inválida');
  if(portable.has(k))return 'portable';if(device.has(k))return 'device';if(credentials.has(k))return 'credential';
  unknown.add(k);throw Error('Clave no inventariada');}
 function present(){guard();const all=[];for(let i=0;i<vault.storage.length;i++)all.push(vault.storage.key(i));return [...all,...temporary.keys()]}
 const storage=Object.freeze({
  getItem(k){const t=kind(k);return t==='portable'?vault.storage.getItem(k):t==='device'?temporary.get(k)??null:null},
  setItem(k,v){const t=kind(k);if(typeof v!=='string')throw Error('Valor no textual');if(t==='credential')throw Error('Credenciales históricas no admitidas');if(t==='device'){temporary.set(k,v);return}vault.storage.setItem(k,v);onDirty()},
  removeItem(k){const t=kind(k);if(t==='portable'){vault.storage.removeItem(k);onDirty()}else if(t==='device')temporary.delete(k)},
  key(i){return Number.isInteger(i)&&i>=0?present()[i]??null:null},
  get length(){return present().length}
 });
 return Object.freeze({storage,unknownCount:()=>unknown.size,close(){active=false;temporary.clear()}});
}
// One serialized flush at a time; a new edit during flush remains dirty and is flushed again.
// Errors propagate; never silently overwrite a conflict or pretend a save succeeded.
export function createSaveCoordinator(vault){
 let pending=null;
 function flush(){
  if(pending)return pending;
  pending=(async()=>{await vault.revalidate();while(vault.dirty)await vault.flush();return vault.revision})().finally(()=>{pending=null});
  return pending;
 }
 return Object.freeze({flush,async close(){await flush();vault.close()},get saving(){return pending!==null}});
}
