// Synthetic-only private additive recovery. No arbitrary conflict resolution,
// no deletion, no UI. Remote append CAS precedes local CAS.
import {prepareRecoveryReview1161,verifyRecoveryArchive1161} from './recovery-review1161.mjs';
import {localPayload,validatePayload} from '../../V11.36-INTEGRACION/src/sync.mjs';
import {validateLargeList} from '../../V11.38-INTEGRACION/src/large-sync-client.mjs';
import {validLargeEnvelope,hashBytes} from '../../V11.38-INTEGRACION/src/large-sync.mjs';
import {MODULES} from '../../../../store84.mjs';
import {inspectLegacy88} from '../../../../migration88.mjs';
import {encrypt84,decrypt84,checksum84} from '../../../../model84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),rev=r=>r?.revision??0;
const sha=x=>hashBytes(new TextEncoder().encode(JSON.stringify(x)));
const missing=Symbol('missing');
// Only V10.6 identity maps are eligible. Complete records, never nested arrays
// or fields, are the unit of recovery. Unknown fields/settings must agree.
// The historical snapshot is evidence, not a proven common ancestor.
export function reconcileDiary1164(historical,local,cloud){
 const [h,l,c]=[historical,local,cloud].map(v=>v===undefined?null:JSON.parse(v));
 for(const x of [h,l,c])if(x!==null)inspectLegacy88(x);
 const conflicts=[],additions=[],maps=['body','diet','work','photos','journal96'];
 const conflict=(key,reason)=>conflicts.push({group:'diary',key,reason});
 const add=(key,from)=>additions.push({group:'diary',key,from});
 const own=(x,k)=>x!==null&&Object.hasOwn(x,k);
 const keys=(...xs)=>[...new Set(xs.flatMap(x=>Object.keys(x??{})))];
 if(!l&&!c){if(h)conflict('asia2027-v1','historical-only');return {conflicts,additions,value:undefined}}
 const result=structuredClone(c??l);
 let changed=false;
 for(const k of keys(h,l,c)){
  if(maps.includes(k))continue;
  if(l&&c&&(own(l,k)!==own(c,k)||own(l,k)&&!eq(l[k],c[k])))conflict(k,'different-values');
  else if(own(h,k)&&!own(l,k)&&!own(c,k))conflict(k,'historical-only');
 }
 for(const name of maps){
  const a=h?.[name]??{},b=l?.[name]??{},d=c?.[name]??{};
  for(const k of keys(a,b,d)){
   const inL=Object.hasOwn(b,k),inC=Object.hasOwn(d,k),path=name+'/'+k;
   if(!inL&&!inC){conflict(path,'historical-only');continue}
   if(inL&&inC){if(!eq(b[k],d[k]))conflict(path,'different-values');continue}
   add(path,inL?'local':'cloud');
   if(inL&&c){
    if(!Object.hasOwn(result,name))result[name]={};
    result[name][k]=structuredClone(b[k]);changed=true;
   }
  }
  // Retain explicit empty optional maps as well as populated maps.
  if(own(l,name)&&!own(result,name)){result[name]={};changed=true;add(name,'local')}
 }
 if(conflicts.length)return {conflicts,additions,value:undefined};
 try{inspectLegacy88(result)}catch{conflict('asia2027-v1','invalid-combined-diary');return {conflicts,additions,value:undefined}}
 // Prefer exact cloud bytes if no additions: important for lost-ack retry.
 return {conflicts,additions,value:changed?JSON.stringify(result):(cloud??local)};
}
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
 for(const k of policy.portable){
  if(k==='asia2027-v1'){
   const merged=reconcileDiary1164(r.get(k),l.get(k),c.get(k));
   conflicts.push(...merged.conflicts);additions.push(...merged.additions);
   if(merged.value!==undefined)entries.push([k,merged.value]);
  }else{const v=choose('entry',k,get(r,k),get(l,k),get(c,k));if(v!==missing)entries.push([k,v])}
 }
 const getM=(p,k)=>Object.hasOwn(p.modules,k)?p.modules[k]:missing;
 for(const k of MODULES){const v=choose('module',k,getM(reference,k),getM(local,k),getM(cloud,k));if(v!==missing)modules[k]=v}
 return {conflicts,additions,payload:conflicts.length?null:validatePayload({entries,modules},policy)};
}
export function prepareAdditiveRecovery1162(options){return prepare(options,false)}
export function preparePendingRecovery1163(options){return prepare(options,true)}
async function prepare(options,recoverPending){
 const {client,repository,pending,policy,oldPhrase,backupPhrase,maintenanceConfirmed}=options,id=client.accountId;
 check(maintenanceConfirmed===true&&/^acct_[a-f0-9]{32}$/.test(id)&&typeof repository.readRecovery==='function'&&(recoverPending?typeof repository.commitPendingRecovery==='function'&&typeof pending.finish==='function':typeof repository.commitRecovery==='function'),'Confirmá mantenimiento y repositorio');
 const identity=await client.verify();
 check(identity?.accountId===id&&/^[A-Za-z0-9_-]{43}$/.test(identity.csrf||''),'Sesión inválida');
 const verify=async()=>{const s=await client.verify();check(s?.accountId===id&&s.csrf===identity.csrf,'La sesión cambió');return s};
 const source=await repository.readSync(id),previous=await repository.readRecovery(id),priorRekey=await repository.readRekey(id),branch=await pending.inspect(id);
 const noChange=async()=>{await verify();check(eq(await repository.readSync(id),source)&&eq(await pending.inspect(id),branch)&&eq(await repository.readRecovery(id),previous)&&eq(await repository.readRekey(id),priorRekey),'Los registros locales cambiaron')};
 const review=await prepareRecoveryReview1161(options);await noChange();
 // Pending branches and any prior local recovery require a separate workflow.
 if(!recoverPending&&(branch||priorRekey))return {kind:'blocked',reason:branch?'pending':'prior-rekey',review};
 if(recoverPending&&(!branch||branch.phase!=='frozen'))return {kind:'blocked',reason:branch?'freeze-required':'no-pending',review};
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
 let combined=local,extraModules=[],branchDevices=devices;
 if(recoverPending){
  for(const [label,row] of [['pending-base',branch.base],['pending-working',branch.working]]){
   const e=review.views.find(x=>x.label===label)?.epoch;
   check(['legacy','managed','empty'].includes(e),'Época pendiente inválida');
   const key=e==='legacy'?oldPhrase:newSecret;
   const part=await localPayload({row,readSession:verify,passphrase:key,policy});
   if(!eq(part.devices,branchDevices))return {kind:'conflict',conflicts:[{group:'device',key:label,reason:'different-device-state'}],review};
   const merged=union({entries:[],modules:{}},combined,part.payload,policy);
   if(merged.conflicts.length)return {kind:'conflict',conflicts:merged.conflicts,review};
   combined=merged.payload;
   if(row.modules)extraModules.push((await decrypt84(row.modules.envelope,key)).modules);
  }
 }
 const {conflicts,additions,payload}=union(historical,combined,cloud,policy);
 if(conflicts.length)return {kind:'conflict',conflicts,review};
 // A lost local acknowledgement can be recognized, not replayed over a row
 // already recovered; later modifications require a separate workflow.
 if(previous){
  if(recoverPending){
   // The local transaction may have succeeded before pending.finish or its
   // acknowledgement. The frozen source remains until exact verification.
   if(previous.proof?.format!=='asia-v1163-pending-recovery-v1'||!eq(previous.branch,branch)||epoch!=='managed'||!eq(local,cloud)||!eq(payload,cloud)||source.baseline?.remote!==head||source.baseline.local!==rev(source.local)||source.baseline.modules!==rev(source.modules)||previous.proof.remoteRevision!==head||previous.proof.remoteSha!==manifest.headSha)return {kind:'blocked',reason:'prior-recovery',review};
   let active=true;
   return {kind:'ready-finalize',head,archive,cancel(){active=false},async apply({confirmed,backupSaved,savedArchive}={}){
    check(active&&confirmed===true&&backupSaved===true&&savedArchive,'Confirmá respaldo y finalización');active=false;
    check(await checksum84(savedArchive)===archiveSha,'Respaldo distinto');
    await verifyRecoveryArchive1161({archive:savedArchive,backupPhrase,accountId:id});
    await noChange();check(eq(await client.discover(),receipt)&&validateLargeList(await client.request('GET')).head===head,'La nube cambió');
    const r=await client.request('GET',null,head);check(r?.ok===true&&r.revision===head&&await sha(r.envelope)===manifest.headSha,'Copia remota cambió');
    await noChange();await pending.finish(id,{base:branch.base,working:branch.working});await verify();
    return {kind:'already-applied',head};
   }};
  }
  if(epoch==='managed'&&eq(local,cloud)&&source.baseline?.remote===head&&source.baseline.local===rev(source.local)&&source.baseline.modules===rev(source.modules)&&previous.proof.remoteRevision===head&&previous.proof.remoteSha===manifest.headSha)return {kind:'already-applied',head};
  return {kind:'blocked',reason:'prior-recovery',review};
 }
 const push=!eq(payload,cloud);
 check(!push||head<200,'Cuota remota agotada');
 const lr=Math.max(rev(source.local),... (recoverPending?[rev(branch.base.local),rev(branch.working.local)]:[]))+1,mr=Math.max(rev(source.modules),...(recoverPending?[rev(branch.base.modules),rev(branch.working.modules)]:[]))+1;
 check(Number.isSafeInteger(lr)&&lr<Number.MAX_SAFE_INTEGER&&Number.isSafeInteger(mr)&&mr<Number.MAX_SAFE_INTEGER,'Límite de revisión');
 const oldModules=source.modules?(await decrypt84(source.modules.envelope,phrase)).modules:{};
 const modules=Object.fromEntries(Object.entries(payload.modules).map(([name,value])=>{
  const candidates=[oldModules,...extraModules].flatMap(m=>Object.hasOwn(m,name)?[m[name]]:[]);
  return [name,candidates.sort((a,b)=>b.revision-a.revision)[0]??{name,revision:1,payload:value}];
 }));
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
   const proof={format:recoverPending?'asia-v1163-pending-recovery-v1':'asia-v1162-additive-recovery-v1',archiveSha,remoteRevision:next,remoteSha};
   const kind=recoverPending?await repository.commitPendingRecovery(id,source,target,proof,branch,priorRekey):await repository.commitRecovery(id,source,target,proof);
   if(recoverPending){
    await verify();await checkRemote(next,remoteSha);
    check(eq(await repository.readSync(id),target)&&eq(await pending.inspect(id),branch),'Recuperación confirmada; rama conservada para revisar');
    const saved=await repository.readRecovery(id);
    check(eq(saved?.source,source)&&eq(saved?.proof,proof)&&eq(saved?.branch,branch),'Respaldo local no confirmado');
    await verify();await pending.finish(id,{base:branch.base,working:branch.working});await verify();
    return {kind,head:next};
   }
   await verify();
   // Separate databases/remote cannot be one transaction. Preserve all branches.
   if(await pending.inspect(id))return {kind:'pending-conflict',head:next};
   await checkRemote(next,remoteSha);
   return {kind,head:next};
  }
 });
}
