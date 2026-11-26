// Offline editing only after online unlock. No offline cold start, no cached server token.
import {openDeviceSession} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {openEncryptedModuleStore} from '../../V11.28-INTEGRACION/src/encrypted-module-store.mjs';
import {encrypt84,decrypt84} from '../../../../model84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
const valid=s=>typeof s?.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>0;
const same=(a,b)=>valid(a)&&valid(b)&&a.accountId===b.accountId&&a.csrf===b.csrf;
const MAX_LEASE=15*60*1000;
export async function openOfflineEditing({readSession,repository,pending,policy,passphrase,onStatus,now=Date.now}){
 const identity=await readSession();check(valid(identity),'Sesión inválida');
 const start=now(),deadline=start+MAX_LEASE;let active=true,closing=false;
 // Local-only capability: not used for any HTTP or confirmed-repository operation.
 const localIdentity=async()=>{check(active&&now()>=start&&now()<deadline,'Permiso local vencido');return identity};
 const lease=crypto.randomUUID(),base=await repository.readSync(identity.accountId);
 // Validate both confirmed vaults before rotating any existing pending branch.
 const confirmedLocal=await openDeviceSession({readSession,repository:repository.local,passphrase,policy});await confirmedLocal.close();
 const confirmedModules=await openEncryptedModuleStore({readSession,repository:repository.modules,passphrase});confirmedModules.close();
 check(same(identity,await readSession()),'La sesión cambió');
 const adapters=await pending.begin(identity.accountId,base,lease);
 const local=await openDeviceSession({readSession:localIdentity,repository:adapters.local,passphrase,policy,onStatus});
 const modules=await openEncryptedModuleStore({readSession:localIdentity,repository:adapters.modules,passphrase});
 // Do not expose identity or passphrase. Gate synchronous storage reads too.
 const guard=()=>check(active&&!closing&&now()>=start&&now()<deadline,'Permiso local vencido o cerrado');
 const storage=Object.freeze({getItem(k){guard();return local.storage.getItem(k)},setItem(k,v){guard();local.storage.setItem(k,v)},removeItem(k){guard();local.storage.removeItem(k)},key(i){guard();return local.storage.key(i)},get length(){guard();return local.storage.length}});
 const moduleStore=Object.freeze({read(n){guard();return modules.read(n)},readPair(){guard();return modules.readPair()},write(...a){guard();return modules.write(...a)},replacePair(...a){guard();return modules.replacePair(...a)}});
 return Object.freeze({storage,moduleStore,deadline,get status(){return local.status},
  flush(){guard();return local.flush()},
  async close(){guard();closing=true;try{modules.close();await local.close();active=false}finally{closing=false}}
 });
}
// Maintenance mode: do not mount an editable diary during reconciliation.
// Frozen pending branch is durable until CAS succeeds; lost response is idempotent.
export async function reconcileOffline({readSession,repository,pending,passphrase,maintenanceConfirmed,confirmed,expectedBranch=null}){
 check(maintenanceConfirmed===true&&confirmed===true,'Confirmá el modo mantenimiento');
 const identity=await readSession();check(valid(identity),'Sesión inválida');
 const id=identity.accountId,verify=async()=>check(same(identity,await readSession()),'La sesión cambió');
 const reviewed=expectedBranch?await pending.freezeReviewed(id,expectedBranch):null;
 const snapshot=reviewed?{base:reviewed.base,working:reviewed.working}:await pending.freeze(id);
 // Verify account/revision and phrase on all encrypted records before applying.
 for(const row of [snapshot.base,snapshot.working])for(const k of ['local','modules']){
  if(row[k]===null)continue;
  const x=await decrypt84(row[k].envelope,passphrase);
  check(x.accountId===id&&x.revision===row[k].revision&&x.format===(k==='local'?'asia-v1126-local-vault-v1':'asia-v1128-modules-v1'),'Rama cifrada inválida');
 }
 await verify();
 const result=await repository.reconcileOffline(id,snapshot.base,snapshot.working);
 await verify();await pending.finish(id,snapshot);return {result};
}
// Explicit encrypted export of a conflicted branch, never plaintext. No automatic discard.
export async function exportOfflineConflict({readSession,pending,passphrase,backupPhrase}){
 check(typeof backupPhrase==='string'&&backupPhrase.length>=12,'Frase de recuperación inválida');
 const identity=await readSession();check(valid(identity),'Sesión inválida');
 const snapshot=await pending.inspect(identity.accountId);check(snapshot?.phase==='frozen','No hay conflicto congelado');
 // Verify correct phrase and account before making a second encrypted copy.
 for(const k of ['local','modules'])if(snapshot.working[k]){const x=await decrypt84(snapshot.working[k].envelope,passphrase);check(x.accountId===identity.accountId,'Cuenta inválida')}
 const envelope=await encrypt84({format:'asia-v1137-offline-conflict-v1',accountId:identity.accountId,snapshot},backupPhrase);
 check(same(identity,await readSession()),'La sesión cambió');return envelope;
}
