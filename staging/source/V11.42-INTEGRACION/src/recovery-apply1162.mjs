// Synthetic-only private additive recovery. No arbitrary conflict resolution,
// no deletion, no pending mutation, no UI. Remote append CAS precedes local CAS.
import {prepareRecoveryReview1161,verifyRecoveryArchive1161} from './recovery-review1161.mjs';
import {localPayload,validatePayload} from '../../V11.36-INTEGRACION/src/sync.mjs';
import {validateLargeList} from '../../V11.38-INTEGRACION/src/large-sync-client.mjs';
import {validLargeEnvelope,hashBytes} from '../../V11.38-INTEGRACION/src/large-sync.mjs';
import {MODULES} from '../../../../store84.mjs';
import {encrypt84,decrypt84,checksum84} from '../../../../model84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),rev=r=>r?.revision??0;
const sha=x=>hashBytes(new TextEncoder().encode(JSON.stringify(x)));
const missing=Symbol('missing');
function union(reference,local,cloud,policy){
 const entries=[],modules={},conflicts=[],additions=[];
 function choose(group,key,h,l,c){
  if(l===missing&&c===missing){if(h!==missing)conflicts.push({group,key,reason:'historical-only'});return missing}
  if(l!==missing&&c!==missing&&!eq(l,c)){conflicts.push({group,key,reason:'different-values'});return missing}
  if(l!==missing&&c===missing)additions.push({group,key,from:'local'});
  if(l===missing&&c!==missing)additions.push({group,key,from:'cloud'});
  return l===missing?c:l;
 }
 const [r,l,c]=[reference,local,cloud].map(x=>new Map(x.entries));
 const get=(m,k)=>m.has(k)?m.get(k):missing;
 for(const k of policy.portable){const v=choose('entry',k,get(r,k),get(l,k),get(c,k));if(v!==missing)entries.push([k,v])}
 const getM=(p,k)=>Object.hasOwn(p.modules,k)?p.modules[k]:missing;
 for(const k of MODULES){const v=choose('module',k,getM(reference,k),getM(local,k),getM(cloud,k));if(v!==missing)modules[k]=v}
 return {conflicts,additions,payload:conflicts.length?null:validatePayload({entries,modules},policy)};
}
export async function prepareAdditiveRecovery1162(options){
 const {client,repository,pending,policy,oldPhrase,backupPhrase,maintenanceConfirmed}=options,id=client.accountId;
 check(maintenanceConfirmed===true&&/^acct_[a-f0-9]{32}$/.test(id)&&typeof repository.readRecovery==='function'&&typeof repository.commitRecovery==='function','Confirmá mantenimiento y repositorio');
 const identity=await client.verify();
 check(identity?.accountId===id&&/^[A-Za-z0-9_-]{43}$/.test(identity.csrf||''),'Sesión inválida');
 const verify=async()=>{const s=await client.verify();check(s?.accountId===id&&s.csrf===identity.csrf,'La sesión cambió');return s};
 const source=await repository.readSync(id),previous=await repository.readRecovery(id),priorRekey=await repository.readRekey(id),branch=await pending.inspect(id);
 const noChange=async()=>{await verify();check(eq(await repository.readSync(id),source)&&eq(await pending.inspect(id),branch)&&eq(await repository.readRecovery(id),previous)&&eq(await repository.readRekey(id),priorRekey),'Los registros locales cambiaron')};
 const review=await prepareRecoveryReview1161(options);await noChange();
 // Pending branches and any prior local recovery require a separate workflow.
 if(branch||priorRekey)return {kind:'blocked',reason:branch?'pending':'prior-rekey',review};
 const archive=review.archive,archiveSha=await checksum84(archive);
 const manifest=await decrypt84(archive.manifest,backupPhrase),head=manifest.head,receipt=manifest.receipt;
 const newSecret=await client.managedKey();check(/^[A-Za-z0-9_-]{43}$/.test(newSecret)&&newSecret!==oldPhrase&&newSecret!==backupPhrase,'Clave gestionada inválida');
 const epoch=review.views.find(x=>x.label==='confirmed')?.epoch;
 check(['legacy','managed'].includes(epoch),'No hay origen local');
 const phrase=epoch==='legacy'?oldPhrase:newSecret;
 const {payload:local,devices}=await localPayload({row:source,readSession:verify,passphrase:phrase,policy});
 async function archived(name){
  const part=archive.parts.find(x=>x.name===name);check(part,'Parte ausente');
  return (await decrypt84(part.envelope,backupPhrase)).value;
 }
 const historical=validatePayload((await archived('historical')).payload,policy);
 const cloud=validatePayload((await archived(head===receipt.revision?'migrated':'cloud-current')).payload,policy);
 const {conflicts,additions,payload}=union(historical,local,cloud,policy);
 if(conflicts.length)return {kind:'conflict',conflicts,review};
 // A lost local acknowledgement can be recognized, not replayed over a row
 // already recovered; later modifications require a separate workflow.
 if(previous){
  if(epoch==='managed'&&eq(local,cloud)&&source.baseline?.remote===head&&source.baseline.local===rev(source.local)&&source.baseline.modules===rev(source.modules)&&previous.proof.remoteRevision===head&&previous.proof.remoteSha===manifest.headSha)return {kind:'already-applied',head};
  return {kind:'blocked',reason:'prior-recovery',review};
 }
 const push=!eq(payload,cloud);
 check(!push||head<200,'Cuota remota agotada');
 const lr=rev(source.local)+1,mr=rev(source.modules)+1;
 check(Number.isSafeInteger(lr)&&lr<Number.MAX_SAFE_INTEGER&&Number.isSafeInteger(mr)&&mr<Number.MAX_SAFE_INTEGER,'Límite de revisión');
 const oldModules=source.modules?(await decrypt84(source.modules.envelope,phrase)).modules:{};
 const modules=Object.fromEntries(Object.entries(payload.modules).map(([name,value])=>[name,Object.hasOwn(oldModules,name)?oldModules[name]:{name,revision:1,payload:value}]));
 const localRecord={revision:lr,envelope:await encrypt84({format:'asia-v1126-local-vault-v1',accountId:id,revision:lr,entries:[...payload.entries,...devices]},newSecret)};
 const modulesRecord={revision:mr,envelope:await encrypt84({format:'asia-v1128-modules-v1',accountId:id,revision:mr,modules},newSecret)};
 const target={local:localRecord,modules:modulesRecord,baseline:{remote:head+(push?1:0),local:lr,modules:mr,namespace:'objects-v1138'}};
 const verified=await localPayload({row:target,readSession:verify,passphrase:newSecret,policy});
 check(eq(verified.payload,payload)&&eq(verified.devices,devices),'Recuperación local no equivalente');
 const envelope=push?await encrypt84({format:'asia-v1136-sync-v1',accountId:id,payload},newSecret):null;
 check(!push||validLargeEnvelope(envelope),'Copia recuperada excede límite');
 async function checkRemote(revision,hash){
  await verify();check(eq(await client.discover(),receipt)&&validateLargeList(await client.request('GET')).head===revision,'La nube cambió');
  const r=await client.request('GET',null,revision);check(r?.ok===true&&r.revision===revision&&validLargeEnvelope(r.envelope)&&await sha(r.envelope)===hash,'Huella remota cambió');await verify();
 }
 await noChange();await checkRemote(head,manifest.headSha);
 let active=true;
 return Object.freeze({kind:'ready',additions,head,willAppend:push,archive, cancel(){active=false},
  async apply({confirmed,backupSaved,savedArchive}={}){
   check(active&&confirmed===true&&backupSaved===true&&savedArchive,'Confirmá respaldo externo y recuperación');
   active=false;
   // Require the exact archive returned by this plan, re-opened and verified.
   check(await checksum84(savedArchive)===archiveSha,'Respaldo distinto');
   await verifyRecoveryArchive1161({archive:savedArchive,backupPhrase,accountId:id});
   await noChange();await checkRemote(head,manifest.headSha);await noChange();
   const next=head+(push?1:0),remoteSha=push?await sha(envelope):manifest.headSha;
   if(push){
    const result=await client.writeManaged({expectedRevision:head,envelope});
    check(result?.ok===true&&result.revision===next,'Publicación no confirmada; volvé a comparar');
   }
   await checkRemote(next,remoteSha);await noChange();
   const proof={format:'asia-v1162-additive-recovery-v1',archiveSha,remoteRevision:next,remoteSha};
   const kind=await repository.commitRecovery(id,source,target,proof);
   await verify();
   // Separate databases/remote cannot be one transaction. Preserve all branches.
   if(await pending.inspect(id))return {kind:'pending-conflict',head:next};
   await checkRemote(next,remoteSha);
   return {kind,head:next};
  }
 });
}
