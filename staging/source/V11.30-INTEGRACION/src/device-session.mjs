// Candidate only. Same encrypted snapshot for journal and active local training state.
import {openVaultRepository,openSessionVault} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
import {createLegacyBridge,createSaveCoordinator} from '../../V11.27-INTEGRACION/src/legacy-bridge.mjs';
export const persistentDeviceKeys=Object.freeze(['asia-gym-active53','asia-timers-v4']);
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
export function devicePolicy(policy){
 check(Array.isArray(policy?.portable)&&Array.isArray(policy?.groups?.device)&&Array.isArray(policy?.groups?.credentials),'Política inválida');
 check(persistentDeviceKeys.every(k=>policy.groups.device.includes(k)&&!policy.portable.includes(k)&&!policy.groups.credentials.includes(k)),'Inventario de dispositivo incompatible');
 return Object.freeze({portable:Object.freeze([...policy.portable,...persistentDeviceKeys]),groups:Object.freeze({...policy.groups,device:Object.freeze(policy.groups.device.filter(k=>!persistentDeviceKeys.includes(k)))})});
}
export function openDeviceRepository(factory=globalThis.indexedDB){
 check(factory&&typeof factory.open==='function','IndexedDB no disponible');
 return openVaultRepository({open(name,version){
  check(name==='asia-v1126-encrypted-staging'&&version===1,'Base inesperada');
  // New synthetic namespace; no implicit migration or rewriting of V11.26.
  return factory.open('asia-v1130-encrypted-device-staging',1);
 }});
}
export async function openDeviceSession({readSession,repository,passphrase,policy,onStatus=()=>{},coachPair=null}){
 const effective=devicePolicy(policy),vault=await openSessionVault({readSession,repository,passphrase,policy:effective});
 const coordinator=createSaveCoordinator(vault);
 let phase='saved',lastError=null,scheduled=false,closing=false,closed=false,flight=null,coachBusy=false;
 function publish(next,error=null){
  phase=next;lastError=error;
  // Status listeners cannot break a write or make it appear uncommitted.
  try{onStatus(Object.freeze({phase,error}))}catch{}
 }
 function flushInner(){
  check(!closed,'Sesión cerrada');
  if(flight)return flight;
  publish('saving');
  flight=(async()=>{
   try{const revision=await coordinator.flush();publish('saved');return revision}
   catch(e){let recoverable=true;try{void vault.dirty}catch{recoverable=false}
    publish(recoverable?'error':'locked',recoverable?'Guardado no confirmado; conservar sesión y revisar conflicto o red.':'Sesión invalidada; no se confirma el guardado pendiente.');
    throw e;
   }finally{flight=null}
  })();
  return flight;
 }
 function flush(){check(!coachBusy&&!vault.coachBlocked,'Guardado Coach en curso o incierto');return flushInner()}
 function changed(){
  publish('pending');
  if(scheduled||closing||closed)return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;if(!closed&&!closing&&!coachBusy&&!vault.coachBlocked&&phase!=='locked')flush().catch(()=>{})});
 }
 const bridge=createLegacyBridge({vault,policy:effective,onDirty:changed});
 const writable=()=>check(!closing&&!closed&&!coachBusy&&!vault.coachBlocked&&phase!=='locked','Escrituras bloqueadas');
 const storage=Object.freeze({
  getItem:k=>bridge.storage.getItem(k),
  setItem(k,v){writable();bridge.storage.setItem(k,v)},
  removeItem(k){writable();bridge.storage.removeItem(k)},
  key:i=>bridge.storage.key(i),get length(){return bridge.storage.length}
 });
 async function coachOperation(fn){check(coachPair&&!closing&&!closed&&!coachBusy&&!vault.coachBlocked,'Coach local no disponible');coachBusy=true;try{await flushInner();return await fn()}catch(e){if(vault.coachBlocked)publish('locked','Guardado Coach incierto; reabrí y verificá la rama antes de editar.');throw e}finally{coachBusy=false}}
 function coachSnapshot(){return coachOperation(()=>vault.coachSnapshot(coachPair))}
 function commitCoachDiary(expected,nextDiary){return coachOperation(async()=>{publish('saving');try{const receipt=await vault.commitCoachDiary(coachPair,expected,nextDiary);publish('saved');return receipt}catch(e){publish(vault.coachBlocked?'locked':'error','Guardado Coach no confirmado');throw e}})}
 async function close(){
  check(!closed&&!closing&&!coachBusy&&!vault.coachBlocked,'Cierre o recuperación pendiente');closing=true;
  try{await flush();vault.close();bridge.close();closed=true;publish('closed')}
  finally{closing=false}
 }
 function closeForCoachRecovery(confirmed){check(confirmed===true&&!closed&&!closing&&!coachBusy&&!flight,'No se puede cerrar para recuperar');vault.closeForCoachRecovery(true);bridge.close();closed=true;publish('closed');}
 // Opportunistic only: browsers may suspend/kill before async encryption/commit ends.
 function attachLifecycle(doc,win){
  const hidden=()=>{if(doc.visibilityState==='hidden'&&!closed&&!closing&&!coachBusy&&!vault.coachBlocked&&phase!=='locked')flush().catch(()=>{})};
  const pagehide=()=>{if(!closed&&!closing&&!coachBusy&&!vault.coachBlocked&&phase!=='locked')flush().catch(()=>{})};
  doc.addEventListener('visibilitychange',hidden);win.addEventListener('pagehide',pagehide);
  return ()=>{doc.removeEventListener('visibilitychange',hidden);win.removeEventListener('pagehide',pagehide)};
 }
 publish('saved');
 return Object.freeze({storage,flush,close,attachLifecycle,coachSnapshot,commitCoachDiary,closeForCoachRecovery,get status(){return Object.freeze({phase,error:lastError})}});
}
