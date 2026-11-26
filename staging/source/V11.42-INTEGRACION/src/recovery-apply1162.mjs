// Synthetic-only private additive recovery. No arbitrary conflict resolution,
// no deletion, no UI. Remote append CAS precedes local CAS.
import {prepareRecoveryReview1161,verifyRecoveryArchive1161,makeReviewPlan1167} from './recovery-review1161.mjs';
import {localPayload,validatePayload} from '../../V11.36-INTEGRACION/src/sync.mjs';
import {validateLargeList} from '../../V11.38-INTEGRACION/src/large-sync-client.mjs';
import {validLargeEnvelope,hashBytes} from '../../V11.38-INTEGRACION/src/large-sync.mjs';
import {MODULES} from '../../../../store84.mjs';
import {inspectLegacy88} from '../../../../migration88.mjs';
import {validateGym} from '../../../../gym84.mjs';
import {encrypt84,decrypt84,checksum84,validate84} from '../../../../model84.mjs';
import {historyKey810} from '../../../../history810-schema.mjs';
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
// PRO arrays have stable IDs, unlike series/entries inside a session or routine.
// Keep full records, preserve cloud list order and append exclusive local IDs.
// A missing historical ID or unequal record is not an inferred deletion/edit.
export function reconcileGym1165(historical,local,cloud){
 const [h,l,c]=[historical,local,cloud].map(v=>v===undefined?null:v);
 const conflicts=[],additions=[],lists=['library','routines','sessions','planned'];
 const conflict=(key,reason)=>conflicts.push({group:'gym',key,reason});
 const add=(key,from)=>additions.push({group:'gym',key,from});
 const own=(x,k)=>x!==null&&Object.hasOwn(x,k);
 const keys=(...xs)=>[...new Set(xs.flatMap(x=>Object.keys(x??{})))];
 for(const x of [h,l,c])if(x!==null){validateGym(x);if(x.active||x.rest.end||x.rest.paused)conflict('active','active-session')}
 if(!l&&!c){if(h)conflict('gym','historical-only');return {conflicts,additions,value:undefined}}
 const result=structuredClone(c??l);
 for(const k of keys(h,l,c)){
  if(lists.includes(k))continue;
  if(l&&c&&(own(l,k)!==own(c,k)||own(l,k)&&!eq(l[k],c[k])))conflict(k,'different-values');
  else if(own(h,k)&&!own(l,k)&&!own(c,k))conflict(k,'historical-only');
 }
 for(const name of lists){
  const [a,b,d]=[h,l,c].map(x=>new Map((x?.[name]??[]).map(v=>[v.id,v])));
  for(const id of new Set([...a.keys(),...b.keys(),...d.keys()])){
   const path=name+'/'+id,inL=b.has(id),inC=d.has(id);
   if(!inL&&!inC){conflict(path,'historical-only');continue}
   if(inL&&inC){if(!eq(b.get(id),d.get(id)))conflict(path,'different-values');continue}
   add(path,inL?'local':'cloud');
   if(inL&&c)result[name].push(structuredClone(b.get(id)));
  }
 }
 // Name collisions and references in the resulting active plan must be usable.
 // Historical session snapshots can legally refer to a deleted routine.
 const lib=new Map(),routines=new Set(result.routines.map(r=>r.id));
 for(const e of result.library){
  const name=e.name.toLowerCase(),prior=lib.get(name);
  if(prior&&prior!==e.id)conflict('library/'+e.id,'duplicate-exercise-name');
  lib.set(name,e.id);
 }
 for(const p of result.planned)if(!routines.has(p.routineId))conflict('planned/'+p.id,'missing-routine');
 if(conflicts.length)return {conflicts,additions,value:undefined};
 try{validateGym(result)}catch{conflict('gym','invalid-combined-gym');return {conflicts,additions,value:undefined}}
 return {conflicts,additions,value:result};
}
// Conservative recovery of the original advanced book. Whole validated rows
// only; preferences, audit, and deletion history remain indivisible.
export function reconcileBook1166(historical,local,cloud){
 const [h,l,c]=[historical,local,cloud];
 const conflicts=[],additions=[];
 const conflict=(key,reason)=>conflicts.push({group:'preferences',key,reason});
 const add=(key,from)=>additions.push({group:'preferences',key,from});
 const own=(x,k)=>x!=null&&Object.hasOwn(x,k);
 const keys=(...xs)=>[...new Set(xs.flatMap(x=>Object.keys(x??{})))];
 const areas=['foods','library','wellness','measurements','plans','threads','strategies','reminders','reviews'];
 const lists=[...areas.map(k=>[k,e=>e.id]),['legacyHistory810',historyKey810],['reviewedMemory810',e=>e.id],['legacyLibrary89',e=>e.id]];
 const special=new Set(lists.map(([k])=>k));
 for(const x of [h,l,c])if(x!==undefined)validate84(x);
 if(!l&&!c){if(h)conflict('preferences','historical-only');return {conflicts,additions,value:undefined}}
 const result=structuredClone(c??l);
 for(const k of keys(h,l,c)){
  if(special.has(k))continue;
  if(l&&c&&(own(l,k)!==own(c,k)||own(l,k)&&!eq(l[k],c[k])))conflict(k,'different-values');
  else if(own(h,k)&&!own(l,k)&&!own(c,k))conflict(k,'historical-only');
 }
 // Non-identifiable audit and deletion records are not inferred from timestamps.
 for(const k of ['audit','trash','legacyMigration84']){
  if(own(h,k)&&!eq(h[k],result[k]))conflict(k,'historical-review-required');
 }
 for(const [name,identity] of lists){
  const [a,b,d]=[h,l,c].map(x=>new Map((x?.[name]??[]).map(v=>[identity(v),v])));
  if(own(h,name)&&!own(l,name)&&!own(c,name))conflict(name,'historical-only');
  if(own(l,name)&&!own(result,name))result[name]=[];
  for(const id of new Set([...a.keys(),...b.keys(),...d.keys()])){
   const path=name+'/'+id,inL=b.has(id),inC=d.has(id);
   if(!inL&&!inC){conflict(path,'historical-only');continue}
   if(inL&&inC){if(!eq(b.get(id),d.get(id)))conflict(path,'different-values');continue}
   add(path,inL?'local':'cloud');
   if(inL&&c)result[name].push(structuredClone(b.get(id)));
  }
 }
 for(const [name,key] of [['wellness',x=>x.day],['measurements',x=>x.day+'/'+x.kind]]){
  const seen=new Set();
  for(const x of result[name]){const id=key(x);if(seen.has(id))conflict(name+'/'+id,'semantic-duplicate');seen.add(id)}
 }
 for(const t of result.trash)if(result[t.area].some(x=>x.id===t.item.id))conflict(t.area+'/'+t.item.id,'active-trash-collision');
 if(conflicts.length)return {conflicts,additions,value:undefined};
 try{validate84(result)}catch{conflict('preferences','invalid-combined-book');return {conflicts,additions,value:undefined}}
 return {conflicts,additions,value:result};
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
 for(const k of MODULES){
  if(k==='gym'){
   const merged=reconcileGym1165(reference.modules[k],local.modules[k],cloud.modules[k]);
   conflicts.push(...merged.conflicts);additions.push(...merged.additions);
   if(merged.value!==undefined)modules[k]=merged.value;
  }else if(k==='preferences'){
   const merged=reconcileBook1166(reference.modules[k],local.modules[k],cloud.modules[k]);
   conflicts.push(...merged.conflicts);additions.push(...merged.additions);
   if(merged.value!==undefined)modules[k]=merged.value;
  }else{const v=choose('module',k,getM(reference,k),getM(local,k),getM(cloud,k));if(v!==missing)modules[k]=v}
 }
 return {conflicts,additions,payload:conflicts.length?null:validatePayload({entries,modules},policy)};
}
// The preview uses the same whole-record union as actual recovery. A preview
// never returns the merged plaintext to the UI and does not create a writer.
export async function prepareGranularReview1168(options){
 const {client,repository,pending,policy,oldPhrase,backupPhrase}=options,id=client.accountId;
 const identity=await client.verify();
 const verify=async()=>{const s=await client.verify();check(s.accountId===id&&s.csrf===identity.csrf,'La sesión cambió');return s};
 check(identity.accountId===id,'Cuenta inválida');
 const source=await repository.readSync(id),branch=await pending.inspect(id),saved=await repository.readRekey(id),previous=await repository.readRecovery(id);
 const unchanged=async()=>{await verify();check(eq(source,await repository.readSync(id))&&eq(branch,await pending.inspect(id))&&eq(saved,await repository.readRekey(id))&&eq(previous,await repository.readRecovery(id)),'Los registros locales cambiaron')};
 const review=await prepareRecoveryReview1161(options);await unchanged();
 const manifest=await decrypt84(review.archive.manifest,backupPhrase);
 const key=await client.managedKey();
 const part=async name=>{const p=review.archive.parts.find(x=>x.name===name);check(p,'Parte ausente');return (await decrypt84(p.envelope,backupPhrase)).value};
 const historical=validatePayload((await part('historical')).payload,policy);
 const cloud=validatePayload((await part(manifest.head===manifest.receipt.revision?'migrated':'cloud-current')).payload,policy);
 const read=async(label,row)=>{const epoch=review.views.find(v=>v.label===label)?.epoch;check(['legacy','managed','empty'].includes(epoch),'Época inválida');return localPayload({row,readSession:verify,passphrase:epoch==='legacy'?oldPhrase:key,policy})};
 const local=await read('confirmed',source);let combined=local.payload,conflicts=[],additions=[];
 if(branch){
  for(const [label,row] of [['pending-base',branch.base],['pending-working',branch.working]]){
   const p=await read(label,row);
   if(!eq(p.devices,local.devices)){conflicts.push({group:'device',key:label,reason:'different-device-state'});break}
   const merged=union({entries:[],modules:{}},combined,p.payload,policy);
   if(merged.conflicts.length){conflicts.push(...merged.conflicts);break}
   combined=merged.payload;
  }
 }
 if(!conflicts.length){const merged=union(historical,combined,cloud,policy);conflicts=merged.conflicts;additions=merged.additions}
 const canFreeze=!!branch&&branch.phase==='editing'&&!conflicts.length&&!previous&&typeof pending.freezeReviewed==='function';
 async function freeze(){
  check(canFreeze,'Congelación no disponible');
  await unchanged();check(eq(await client.discover(),manifest.receipt)&&validateLargeList(await client.request('GET')).head===manifest.head,'La nube cambió');
  const remote=await client.request('GET',null,manifest.head);
  check(remote?.ok===true&&remote.revision===manifest.head&&await sha(remote.envelope)===manifest.headSha,'Huella remota cambió');
  await unchanged();const result=await pending.freezeReviewed(id,branch);
  check(result?.phase==='frozen'&&eq(result.base,branch.base)&&eq(result.working,branch.working),'Congelación no confirmada');await verify();
  return true;
 }
 await unchanged();
 return makeReviewPlan1167({review:{...review,granular:{conflicts,additions,branchPhase:branch?.phase??null,canFreeze}},client,backupPhrase,freeze:canFreeze?freeze:null});
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
  const latest=candidates.sort((a,b)=>b.revision-a.revision)[0];
  if(!latest)return [name,{name,revision:1,payload:value}];
  if(candidates.every(x=>x.revision!==latest.revision||eq(x.payload,value)))return [name,latest];
  const revision=latest.revision+1;
  check(Number.isSafeInteger(revision)&&revision<=mr,'Revisión interna inválida');
  return [name,{name,revision,payload:value}];
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

 // One maintenance entrypoint: choose the applicable protocol from the actual
 // branch state. Blocked and conflict results remain inspectable, never writable.
export async function prepareRecoveryAction1169(options){
 const branch=await options.pending.inspect(options.client.accountId);
 const p=await (branch?preparePendingRecovery1163:prepareAdditiveRecovery1162)(options);
 if(['ready','ready-finalize'].includes(p.kind))return p;
 return Object.freeze({...p,archive:p.review?.archive??null,cancel(){},async apply(){throw Error('Recuperación no habilitada: '+p.kind)}});
}
