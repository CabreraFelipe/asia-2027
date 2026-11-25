// Local-only synthetic candidate: journal + two workout keys share one encrypted CAS snapshot.
import {openVaultRepository,openSessionVault} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
import {createLegacyBridge,createSaveCoordinator} from '../../V11.27-INTEGRACION/src/legacy-bridge.mjs';
export const WORKOUT_KEYS=Object.freeze(['asia-gym-active53','asia-timers-v4']);
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
export function workoutPolicy(policy){
 check(Array.isArray(policy?.portable)&&Array.isArray(policy?.groups?.device)&&Array.isArray(policy?.groups?.credentials),'Política original inválida');
 for(const k of WORKOUT_KEYS)check(policy.groups.device.includes(k)&&!policy.portable.includes(k)&&!policy.groups.credentials.includes(k),'Inventario de entrenamiento inesperado');
 // This derived policy is only for the local vault, never for export or remote sync.
 return Object.freeze({...policy,portable:Object.freeze([...policy.portable,...WORKOUT_KEYS]),groups:Object.freeze({...policy.groups,device:Object.freeze(policy.groups.device.filter(k=>!WORKOUT_KEYS.includes(k)))})});
}
export function openWorkoutRepository(factory=globalThis.indexedDB){
 return openVaultRepository({open(name,version){
  check(name==='asia-v1126-encrypted-staging'&&version===1,'Base inesperada');
  return factory.open('asia-v1130-encrypted-workouts-staging',1);
 }});
}
export async function openWorkoutVault({readSession,repository,passphrase,policy,onStatus=()=>{}}){
 const local=workoutPolicy(policy);
 const vault=await openSessionVault({readSession,repository,passphrase,policy:local});
 const coordinator=createSaveCoordinator(vault);
 let active=true,scheduled=false,closing=false,failure=null;
 const status=()=>{try{return Object.freeze({dirty:vault.dirty,saving:coordinator.saving,error:failure?.message??null})}catch{return Object.freeze({dirty:null,saving:coordinator.saving,error:failure?.message??'Sesión cerrada'})}};
 function publish(){try{onStatus(status())}catch{}}
 async function flush(){
  check(active,'Bóveda cerrada');
  try{const p=coordinator.flush();publish();const revision=await p;failure=null;publish();return revision}
  catch(e){failure=e;publish();throw e}
 }
 function schedule(){
  if(!active||closing||scheduled||failure)return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;if(active&&!closing&&!failure)void flush().catch(()=>{});});
  publish();
 }
 const bridge=createLegacyBridge({vault,policy:local,onDirty:schedule});
 // Only best effort on lifecycle; no guarantee after abrupt termination or OS suspension.
 function attachLifecycle(win,doc){
  check(active&&win&&doc,'Lifecycle inválido');
  const flushPending=()=>{if(active&&!closing&&!failure)void flush().catch(()=>{})};
  const visibility=()=>{if(doc.hidden)flushPending()};
  win.addEventListener('pagehide',flushPending);doc.addEventListener('visibilitychange',visibility);
  return ()=>{win.removeEventListener('pagehide',flushPending);doc.removeEventListener('visibilitychange',visibility)};
 }
 return Object.freeze({storage:bridge.storage,status,flush,attachLifecycle,
  async close(){check(active&&!closing,'Bóveda cerrada');closing=true;try{await flush();await coordinator.close();bridge.close();active=false}finally{closing=false}},
  invalidate(){active=false;bridge.close();vault.invalidate()}
 });
}
