// Session-bound encrypted storage for the original V10.6 portable localStorage keys.
// Explicit flush; no monkey-patching of browser globals, no automatic legacy migration.
import {encrypt84,decrypt84} from '../../../../model84.mjs';
const format='asia-v1126-local-vault-v1';
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
const validId=id=>typeof id==='string'&&/^acct_[a-f0-9]{32}$/.test(id);
export function sessionReader({origin,fetcher=fetch}){
 assert(typeof origin==='string'&&origin.startsWith('https://')&&new URL(origin).origin===origin,'Origen inválido');
 return async()=>{
  const r=await fetcher(origin+'/v11.11/auth/me',{credentials:'same-origin',cache:'no-store',redirect:'error'});
  if(!r.ok){const e=Error('Sesión no disponible');e.revoked=r.status===401||r.status===403;throw e}
  const s=await r.json();
  assert(s.ok===true&&validId(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>0&&s.syntheticOnly===true,'Sesión staging inválida');
  return {accountId:s.accountId,csrf:s.csrf};
 };
}
// IndexedDB atomic compare-and-swap; only ciphertext and revision are persisted.
export async function openVaultRepository(factory=globalThis.indexedDB){
 assert(factory&&typeof factory.open==='function','IndexedDB no disponible');
 const db=await new Promise((ok,fail)=>{
  const req=factory.open('asia-v1126-encrypted-staging',1);
  req.onupgradeneeded=()=>req.result.createObjectStore('vaults');
  req.onerror=()=>fail(req.error); req.onblocked=()=>fail(Error('Base bloqueada'));req.onsuccess=()=>ok(req.result);
 });
 db.onversionchange=()=>db.close();
 function tx(id,write,expected,next){
  assert(validId(id),'Cuenta inválida');
  return new Promise((ok,fail)=>{
   const t=db.transaction('vaults',write?'readwrite':'readonly'),s=t.objectStore('vaults'),r=s.get(id);
   let result,reason;
   t.oncomplete=()=>ok(result);t.onabort=()=>fail(reason||t.error||Error('Transacción abortada'));
   r.onsuccess=()=>{try{
    const current=r.result??null;
    if(!write){result=current;return}
    assert((current?.revision??0)===expected,'Conflicto de revisión');
    assert(next.revision===expected+1,'Revisión inválida');
    s.put(next,id);result=next.revision;
   }catch(e){reason=e;t.abort()}};
  });
 }
 return Object.freeze({read:id=>tx(id,false),compareAndSwap:(id,expected,next)=>tx(id,true,expected,next),close:()=>db.close()});
}
export async function openSessionVault({readSession,repository,passphrase,policy}){
 assert(typeof readSession==='function'&&repository&&Array.isArray(policy?.portable),'Dependencias inválidas');
 assert(typeof passphrase==='string'&&passphrase.length>=12,'Frase de cifrado inválida');
 const permitted=new Set(policy.portable);
 assert(permitted.size===policy.portable.length&&[...permitted].every(k=>typeof k==='string'&&!/access-v1|token|credential|password|secret/i.test(k)),'Política portable inválida');
 const session=await readSession();
 assert(validId(session?.accountId)&&typeof session.csrf==='string'&&session.csrf.length>0,'Sesión inválida');
 const id=session.accountId, csrf=session.csrf;
 let active=true,revision=0,generation=0,saved=0,busy=false,coachBusy=false,coachBlocked=false,phrase=passphrase;
 const map=new Map();
 const guard=()=>assert(active,'Sesión cerrada');
 const invalidate=()=>{active=false;map.clear();phrase=null};
 async function revalidate(){
  guard();
  let s;
  try{s=await readSession()}catch(e){if(e?.revoked===true)invalidate();throw Error('No se pudo verificar la sesión; no se guardó nada')}
  guard();
  if(s?.accountId!==id||s?.csrf!==csrf){invalidate();throw Error('La sesión cambió; almacenamiento bloqueado')}
 }
 function key(k){guard();assert(typeof k==='string'&&permitted.has(k),'Clave no portable');return k}
 try{
  const record=await repository.read(id);await revalidate();
  if(record!==null){
   assert(Number.isSafeInteger(record.revision)&&record.revision>0&&record.envelope,'Registro inválido');
   const data=await decrypt84(record.envelope,phrase);await revalidate();
   assert(data?.format===format&&data.accountId===id&&data.revision===record.revision&&Array.isArray(data.entries),'Copia de cuenta inválida');
   for(const entry of data.entries){assert(Array.isArray(entry)&&entry.length===2&&permitted.has(entry[0])&&typeof entry[1]==='string'&&!map.has(entry[0]),'Contenido no portable');map.set(...entry)}
   revision=record.revision;
  }
 }catch(e){invalidate();throw e}
 const writable=()=>assert(!coachBusy&&!coachBlocked,'Guardado Coach en curso o pendiente de verificar');
 const storage=Object.freeze({
  getItem(k){assert(!coachBlocked,'Guardado Coach pendiente de verificar');return map.get(key(k))??null},
  setItem(k,v){writable();key(k);assert(typeof v==='string','Valor no textual');if(map.get(k)!==v){map.set(k,v);generation++}},
  removeItem(k){writable();if(map.delete(key(k)))generation++},
  key(i){guard();assert(!coachBlocked,'Guardado Coach pendiente de verificar');return Number.isInteger(i)&&i>=0?[...map.keys()][i]??null:null},
  get length(){guard();assert(!coachBlocked,'Guardado Coach pendiente de verificar');return map.size}
 });
 async function flush(){
  guard();writable();assert(!busy,'Guardado ya en curso');busy=true;
  try{
   await revalidate();
   if(generation===saved)return revision;
   assert(revision<Number.MAX_SAFE_INTEGER,'Límite de revisión');
   const mark=generation,next=revision+1,entries=[...map.entries()];
   const envelope=await encrypt84({format,accountId:id,revision:next,entries},phrase);
   await revalidate();
   const persisted=await repository.compareAndSwap(id,revision,{revision:next,envelope});
   assert(persisted===next,'Guardado no confirmado');
   guard();revision=next;saved=mark;
   return revision;
  }finally{busy=false}
 }
 // The pair adapter belongs to the same account lease as repository. Never expose the phrase.
 async function checkPair(pair){
  guard();assert(!coachBlocked&&!busy&&generation===saved,'Hay cambios pendientes o guardado incierto');
  assert(pair&&typeof pair.readCoachPair==='function'&&typeof pair.commitCoachLocal==='function','Repositorio coordinado no disponible');
  await revalidate();const current=await pair.readCoachPair();await revalidate();
  assert((current.local?.revision??0)===revision,'Revisión de diario cambió');
  if(current.local){const x=await decrypt84(current.local.envelope,phrase);await revalidate();assert(x?.format===format&&x.accountId===id&&x.revision===revision&&JSON.stringify(x.entries)===JSON.stringify([...map.entries()]),'Caché del diario no coincide');}
  else assert(revision===0&&map.size===0,'Caché inicial incompatible');
  return current;
 }
 function noActiveCoach(){const active=map.get('asia-gym-active53');assert(active===undefined||active==='null','Sesión Gym clásica activa o pendiente de verificar');}
 async function coachSnapshot(pair){guard();writable();noActiveCoach();assert(!busy,'Guardado en curso');coachBusy=true;try{const snapshot=await checkPair(pair);return {accountId:id,revision,proRevision:snapshot.modules?.revision??0,diary:map.get('asia2027-v1')??null};}finally{coachBusy=false}}
 async function commitCoachDiary(pair,expected,nextDiary){
  guard();writable();noActiveCoach();assert(!busy&&generation===saved&&expected&&expected.accountId===id&&expected.revision===revision&&typeof expected.diary==='string'&&expected.diary===map.get('asia2027-v1')&&typeof nextDiary==='string'&&nextDiary!==expected.diary&&nextDiary.length<=50000000&&permitted.has('asia2027-v1'),'Diario o revisión no vigente');
  coachBusy=true;let attempted=false;
  try{
   const current=await checkPair(pair);assert((current.modules?.revision??0)===expected.proRevision,'Cambió la bóveda modular');
   const updated=new Map(map);updated.set('asia2027-v1',nextDiary);const next=revision+1;assert(Number.isSafeInteger(next),'Límite de revisión');
   const envelope=await encrypt84({format,accountId:id,revision:next,entries:[...updated.entries()]},phrase);await revalidate();
   attempted=true;const receipt=await pair.commitCoachLocal(current,{revision:next,envelope});
   assert(receipt?.accountId===id&&receipt.revision===next&&receipt.proRevision===expected.proRevision,'Recibo local inválido');
   const after=await pair.readCoachPair();await revalidate();assert(JSON.stringify(after.local)===JSON.stringify({revision:next,envelope})&&JSON.stringify(after.modules)===JSON.stringify(current.modules),'Lectura posterior incompatible');
   const decoded=await decrypt84(after.local.envelope,phrase);await revalidate();assert(decoded.accountId===id&&decoded.revision===next&&decoded.format===format&&JSON.stringify(decoded.entries)===JSON.stringify([...updated.entries()]),'No se verificó el contenido guardado');
   map.set('asia2027-v1',nextDiary);revision=next;generation++;saved=generation;return {accountId:id,revision,proRevision:expected.proRevision};
  }catch(e){if(attempted)coachBlocked=true;throw e}finally{coachBusy=false}
 }
 function closeForCoachRecovery(confirmed){guard();assert(confirmed===true&&!busy&&!coachBusy&&generation===saved,'No se puede cerrar con cambios sin guardar');invalidate();}
 return Object.freeze({storage,flush,revalidate,invalidate,coachSnapshot,commitCoachDiary,closeForCoachRecovery,get coachBlocked(){return coachBlocked},get dirty(){guard();return generation!==saved},get revision(){guard();return revision},close(){guard();assert(!busy&&!coachBusy&&!coachBlocked&&generation===saved,'Hay cambios pendientes de guardar o verificar');invalidate()}});
}
