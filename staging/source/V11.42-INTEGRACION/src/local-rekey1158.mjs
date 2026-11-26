// Internal client-side transition after a verified remote commit. No UI or
// mutation of pending branches. readReceipt/request must be authenticated,
// account-scoped transports; no production transport is installed yet.
import {prepareLocalRekey1153} from './prepare-rekey1153.mjs';
import {localPayload,validatePayload} from '../../V11.36-INTEGRACION/src/sync.mjs';
import {validateLargeList} from '../../V11.38-INTEGRACION/src/large-sync-client.mjs';
import {validLargeEnvelope,hashBytes} from '../../V11.38-INTEGRACION/src/large-sync.mjs';
import {encrypt84,decrypt84,checksum84} from '../../../../model84.mjs';
const check=(ok,m)=>{if(!ok)throw Error(m)},eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),rev=x=>x?.revision??0;
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(x);
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export async function prepareLocalCommit1158({readSession,repository,pending,policy,oldPhrase,newSecret,operationId,readReceipt,request,maintenanceConfirmed}){
 check(maintenanceConfirmed===true&&uuid(operationId)&&typeof readReceipt==='function'&&typeof request==='function','Confirmá mantenimiento y operación');
 const identity=await readSession(),id=identity?.accountId;
 check(/^acct_[a-f0-9]{32}$/.test(id||'')&&/^[A-Za-z0-9_-]{43}$/.test(identity.csrf||''),'Sesión inválida');
 const verify=async()=>{const s=await readSession();check(s.accountId===id&&s.csrf===identity.csrf,'La sesión cambió');return s};
 const noPending=async()=>check(!await pending.inspect(id),'Hay una rama pendiente; conservá ambas copias');
 async function receipt(){
  await verify();const x=await readReceipt(operationId);await verify();
  check(x?.operationId===operationId&&x.phase==='committed'&&Number.isSafeInteger(x.sourceRevision)&&x.sourceRevision>=1&&x.revision===x.sourceRevision+1&&x.revision<=200&&hex(x.sourceSha)&&hex(x.targetSha),'Recibo remoto inválido');
  return {operationId,phase:'committed',sourceRevision:x.sourceRevision,sourceSha:x.sourceSha,revision:x.revision,targetSha:x.targetSha};
 }
 async function currentHead(){await verify();const h=validateLargeList(await request('GET')).head;await verify();return h}
 async function remote(revision,sha,phrase){
  await verify();const x=await request('GET',null,revision);await verify();
  check(x?.ok===true&&x.revision===revision&&validLargeEnvelope(x.envelope)&&await hashBytes(new TextEncoder().encode(JSON.stringify(x.envelope)))===sha,'Copia remota no verificada');
  const plain=await decrypt84(x.envelope,phrase);
  check(plain&&Object.keys(plain).sort().join(',')==='accountId,format,payload'&&plain.accountId===id&&plain.format==='asia-v1136-sync-v1','Copia incompatible');
  const payload=validatePayload(plain.payload,policy);
  return {plain,payload};
 }
 await noPending();const proof=await receipt();
 check(await currentHead()===proof.revision,'La copia remota avanzó; revisá antes de migrar');
 const old=await remote(proof.sourceRevision,proof.sourceSha,oldPhrase),next=await remote(proof.revision,proof.targetSha,newSecret);
 check(await checksum84(old.plain)===await checksum84(next.plain),'El recifrado remoto no coincide');
 const saved=await repository.readRekey(id),current=await repository.readSync(id);
 // A lost local acknowledgement is recoverable, but never reapply to a
 // subsequently modified row or update an existing backup.
 if(saved){
  check(eq(saved.receipt,proof),'Hay otro respaldo de recifrado; no se reemplaza');
  const {payload}=await localPayload({row:current,readSession:verify,passphrase:newSecret,policy});
  check(current.baseline?.remote===proof.revision&&current.baseline.local===rev(current.local)&&current.baseline.modules===rev(current.modules)&&await checksum84(payload)===await checksum84(next.payload),'La copia local ya migrada cambió');
  await noPending();await verify();check(eq(await repository.readSync(id),current),'La copia local cambió');
  return Object.freeze({kind:'already-applied',receipt:proof});
 }
 const plan=await prepareLocalRekey1153({readSession:verify,repository,pending,policy,oldPhrase,newSecret,maintenanceConfirmed:true});
 const {payload}=await localPayload({row:plan.source,readSession:verify,passphrase:oldPhrase,policy});
 // Divergence is NOT a new baseline. Leave both local and cloud intact.
 if(await checksum84(payload)!==await checksum84(old.payload))return Object.freeze({kind:'conflict',receipt:proof,inventory:plan.inventory});
 const target={local:null,modules:null,baseline:null};
 for(const k of ['local','modules'])if(plan.target[k]){
  const plain=await decrypt84(plan.target[k].envelope,newSecret),revision=rev(plan.source[k])+1;
  check(Number.isSafeInteger(revision)&&await checksum84(plain)===plan.hashes[k],'Recifrado local inválido');
  const updated={...plain,revision},envelope=await encrypt84(updated,newSecret);
  check(await checksum84(await decrypt84(envelope,newSecret))===await checksum84(updated),'Recifrado local no verificado');
  target[k]={revision,envelope};
 }
 target.baseline={remote:proof.revision,local:rev(target.local),modules:rev(target.modules),namespace:'objects-v1138'};
 let active=true;
 return Object.freeze({kind:'ready',receipt:proof,inventory:plan.inventory,cancel(){active=false},
  async apply({confirmed}={}){
   check(active&&confirmed===true,'Confirmá el plan de recifrado');active=false;
   await noPending();await verify();check(eq(await receipt(),proof)&&await currentHead()===proof.revision,'La revisión remota cambió');
   await noPending();await verify();
   const result=await repository.commitRekey(id,plan.source,target,proof);
   await verify();
   // Separate IndexedDB stores cannot commit together. If another tab began
   // a branch, keep it and the encrypted backup; report explicit recovery.
   if(await pending.inspect(id))return {kind:'pending-conflict',receipt:proof};
   return {kind:result,receipt:proof};
  }
 });
}
