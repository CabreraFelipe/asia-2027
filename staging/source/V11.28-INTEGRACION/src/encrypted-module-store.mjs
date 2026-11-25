// Isolated candidate. Explicit dependency injection; never opens the personal V10.6 DB.
import {MODULES,clonePayload} from '../../../../store84.mjs';
import {encrypt84,decrypt84} from '../../../../model84.mjs';
import {openVaultRepository} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
const format='asia-v1128-modules-v1', names=new Set(MODULES), pair=['preferences','gym'];
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const validId=id=>typeof id==='string'&&/^acct_[a-f0-9]{32}$/.test(id);
const validRevision=n=>Number.isSafeInteger(n)&&n>=0&&n<Number.MAX_SAFE_INTEGER;
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const empty=name=>({name,revision:0,payload:{}});
function validateName(name){check(names.has(name),'Módulo desconocido')}
function validateExpected(n){check(validRevision(n),'Revisión inválida')}
export function openModuleRepository(factory=globalThis.indexedDB){
 check(factory&&typeof factory.open==='function','IndexedDB no disponible');
 return openVaultRepository({open(logical,version){
  check(logical==='asia-v1126-encrypted-staging'&&version===1,'Base inesperada');
  return factory.open('asia-v1128-encrypted-modules-staging',1);
 }});
}
// Interface compatible with store84 (read, write, readPair, replacePair, close).
// Account-wide CAS makes paired restore atomic; unrelated concurrent edits may conflict.
export async function openEncryptedModuleStore({readSession,repository,passphrase}){
 check(typeof readSession==='function'&&repository&&typeof repository.read==='function'&&typeof repository.compareAndSwap==='function','Dependencias inválidas');
 check(typeof passphrase==='string'&&passphrase.length>=12,'Frase de cifrado inválida');
 const session=await readSession();
 check(validId(session?.accountId)&&typeof session.csrf==='string'&&session.csrf.length>0,'Sesión inválida');
 const id=session.accountId,csrf=session.csrf;
 let active=true,phrase=passphrase,inFlight=0;
 function guard(){check(active,'Sesión cerrada')}
 function invalidate(){active=false;phrase=null}
 async function verify(){
  guard();let s;
  try{s=await readSession()}catch(e){if(e?.revoked===true)invalidate();throw Error('Sesión no verificable')}
  guard();if(s?.accountId!==id||s?.csrf!==csrf){invalidate();throw Error('La sesión cambió')}
 }
 async function load(){
  await verify();const record=await repository.read(id);await verify();
  if(record===null)return {revision:0,modules:{}};
  check(exact(record,['revision','envelope'])&&validRevision(record.revision)&&record.revision>0,'Registro modular inválido');
  const decoded=await decrypt84(record.envelope,phrase);await verify();
  check(exact(decoded,['format','accountId','revision','modules'])&&decoded.format===format&&decoded.accountId===id&&decoded.revision===record.revision,'Copia modular inválida');
  check(decoded.modules&&typeof decoded.modules==='object'&&!Array.isArray(decoded.modules),'Módulos inválidos');
  for(const [name,r] of Object.entries(decoded.modules)){
   validateName(name);check(exact(r,['name','revision','payload'])&&r.name===name&&validRevision(r.revision)&&r.revision>0&&r.revision<=record.revision,'Revisión modular inválida');
   r.payload=clonePayload(r.payload);
  }
  return {revision:record.revision,modules:decoded.modules};
 }
 function operation(fn){
  guard();inFlight++;
  return (async()=>{try{return await fn()}finally{inFlight--}})();
 }
 const get=(state,name)=>Object.hasOwn(state.modules,name)?state.modules[name]:empty(name);
 function replace(expected,payloads,list){
  const safe=Object.fromEntries(list.map(n=>{validateName(n);validateExpected(expected[n]);return [n,clonePayload(payloads[n])]}));
  const revisions=Object.fromEntries(list.map(n=>[n,expected[n]]));
  return operation(async()=>{
   const state=await load(),out={};
   check(state.revision<Number.MAX_SAFE_INTEGER-1,'Límite de revisión');
   for(const n of list){
    check(get(state,n).revision===revisions[n],'Conflicto de revisión: no se guardó ningún módulo');
    out[n]={name:n,revision:revisions[n]+1,payload:safe[n]};
   }
   const revision=state.revision+1,modules={...state.modules,...out};
   const envelope=await encrypt84({format,accountId:id,revision,modules},phrase);
   await verify();
   const persisted=await repository.compareAndSwap(id,state.revision,{revision,envelope});
   check(persisted===revision,'Guardado no confirmado');
   guard();return out;
  });
 }
 // Fail closed at unlock (including wrong phrase/corrupt envelope) before exposing adapter.
 try{await load()}catch(e){invalidate();throw e}
 return Object.freeze({
  read(name){validateName(name);return operation(async()=>get(await load(),name))},
  readPair(){return operation(async()=>{const s=await load();return Object.fromEntries(pair.map(n=>[n,get(s,n)]))})},
  write(name,expectedRevision,payload){validateName(name);return replace({[name]:expectedRevision},{[name]:payload},[name]).then(out=>out[name])},
  replacePair(expected,payloads){return replace(expected,payloads,pair)},
  close(){check(inFlight===0,'Operaciones pendientes');invalidate()}
 });
}
