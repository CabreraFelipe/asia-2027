// Read-only recovery review after legacy migration. No sync POST, no local
// mutation, no pending freeze/discard. Whole entries/modules are indivisible.
// A historical copy is a comparison reference, not a proven common ancestor.
import {localPayload,validatePayload} from '../../V11.36-INTEGRACION/src/sync.mjs';
import {validateLargeList} from '../../V11.38-INTEGRACION/src/large-sync-client.mjs';
import {validLargeEnvelope,hashBytes} from '../../V11.38-INTEGRACION/src/large-sync.mjs';
import {MODULES} from '../../../../store84.mjs';
import {encrypt84,decrypt84,checksum84} from '../../../../model84.mjs';
const check=(ok,m)=>{if(!ok)throw Error(m)},eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(x);
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const idValid=x=>typeof x==='string'&&/^acct_[a-f0-9]{32}$/.test(x);
const format='asia-v1161-recovery-review-v1';
const digest=x=>hashBytes(new TextEncoder().encode(JSON.stringify(x)));
const absent=Symbol('absent');
function comparison(reference,local,cloud,policy){
 const refs=new Map(reference.entries),ls=new Map(local.entries),cs=new Map(cloud.entries),rows=[];
 function row(group,key,b,l,r){
  const equal=(a,z)=>a===absent||z===absent?a===z:eq(a,z);
  const state=equal(l,r)?'same':l===absent?'cloud-only':r===absent?'local-only':equal(l,b)?'cloud-differs':equal(r,b)?'local-differs':'both-differ';
  rows.push({group,key,state,present:{reference:b!==absent,local:l!==absent,cloud:r!==absent},requiresReview:state!=='same'});
 }
 const get=(map,key)=>map.has(key)?map.get(key):absent;
 for(const k of policy.portable)row('entry',k,get(refs,k),get(ls,k),get(cs,k));
 const m=(p,k)=>Object.hasOwn(p.modules,k)?p.modules[k]:absent;
 for(const k of MODULES)row('module',k,m(reference,k),m(local,k),m(cloud,k));
 return rows;
}
export async function prepareRecoveryReview1161({client,repository,pending,policy,oldPhrase,backupPhrase,maintenanceConfirmed}){
 check(maintenanceConfirmed===true&&typeof oldPhrase==='string'&&oldPhrase.length>=12&&oldPhrase.length<=200&&typeof backupPhrase==='string'&&backupPhrase.length>=12&&backupPhrase!==oldPhrase,'Confirmá mantenimiento y una frase de respaldo independiente');
 const id=client.accountId;check(idValid(id),'Cuenta inválida');
 const identity=await client.verify();check(identity?.accountId===id&&/^[A-Za-z0-9_-]{43}$/.test(identity.csrf||''),'Sesión inválida');
 const verify=async()=>{const s=await client.verify();check(s?.accountId===id&&s.csrf===identity.csrf,'La sesión cambió');return s};
 const receipt=await client.discover();
 check(receipt?.phase==='committed'&&uuid(receipt.operationId)&&Number.isSafeInteger(receipt.sourceRevision)&&receipt.sourceRevision>=1&&receipt.revision===receipt.sourceRevision+1&&receipt.revision<=200&&hex(receipt.sourceSha)&&hex(receipt.targetSha),'No hay migración remota confirmada');
 const newSecret=await client.managedKey();check(/^[A-Za-z0-9_-]{43}$/.test(newSecret)&&newSecret!==backupPhrase&&newSecret!==oldPhrase,'Clave gestionada inválida');
 await verify();const head=validateLargeList(await client.request('GET')).head;
 check(head>=receipt.revision,'Cabecera remota incompatible');
 const current=await repository.readSync(id),branch=await pending.inspect(id),saved=await repository.readRekey(id);
 check(current.local||current.modules||branch,'No hay registros locales para revisar');
 if(branch)check(['editing','frozen'].includes(branch.phase)&&branch.base&&branch.working,'Rama inválida');
 const archiveId=crypto.randomUUID(),parts=[],manifestRows=[];
 async function add(name,value){
  const sha=await checksum84(value);
  const wrapped={format,accountId:id,archiveId,name,sha,value};
  const envelope=await encrypt84(wrapped,backupPhrase);
  check(await checksum84(await decrypt84(envelope,backupPhrase))===await checksum84(wrapped),'Respaldo no verificable');
  parts.push({name,envelope});manifestRows.push({name,sha});
 }
 async function remote(revision,expectedSha,phrase){
  await verify();const x=await client.request('GET',null,revision);await verify();
  check(x?.ok===true&&x.revision===revision&&validLargeEnvelope(x.envelope),'Copia remota inválida');
  const sha=await digest(x.envelope);check(!expectedSha||sha===expectedSha,'Huella remota incompatible');
  const plain=await decrypt84(x.envelope,phrase);
  check(exact(plain,['format','accountId','payload'])&&plain.format==='asia-v1136-sync-v1'&&plain.accountId===id,'Copia de otra cuenta o incompatible');
  return {plain,payload:validatePayload(plain.payload,policy),sha};
 }
 const historical=await remote(receipt.sourceRevision,receipt.sourceSha,oldPhrase);
 const migrated=await remote(receipt.revision,receipt.targetSha,newSecret);
 check(await checksum84(historical.plain)===await checksum84(migrated.plain),'Recifrado histórico no equivalente');
 const cloud=head===receipt.revision?migrated:await remote(head,null,newSecret);
 // Store each original plaintext object inside its own encrypted part, with
 // independent authenticated hash. Avoid a single concatenated oversized file.
 await add('historical',historical.plain);await add('migrated',migrated.plain);
 if(head!==receipt.revision)await add('cloud-current',cloud.plain);
 async function readRow(label,row){
  check(exact(row,['local','modules','baseline']),'Fila local inválida');
  let phrase=null,epoch='empty',values={local:null,modules:null};
  // Detect the key epoch per row, never accept mixed keys within a row.
  for(const k of ['local','modules']){
   const record=row[k];if(record===null)continue;
   check(Number.isSafeInteger(record?.revision)&&record.revision>0&&validLargeEnvelope(record.envelope),'Bóveda inválida');
   let plain;
   if(!phrase){try{plain=await decrypt84(record.envelope,oldPhrase);phrase=oldPhrase;epoch='legacy'}catch{plain=await decrypt84(record.envelope,newSecret);phrase=newSecret;epoch='managed'}}
   else plain=await decrypt84(record.envelope,phrase);
   check(plain?.accountId===id&&plain.revision===record.revision&&plain.format===(k==='local'?'asia-v1126-local-vault-v1':'asia-v1128-modules-v1'),'Bóveda de otra cuenta o revisión incompatible');
   values[k]=plain;
  }
  const {payload}=await localPayload({row,readSession:verify,passphrase:phrase??newSecret,policy});
  for(const k of ['local','modules'])if(values[k])await add(label+'-'+k,values[k]);
  await add(label+'-meta',{epoch,baseline:row.baseline,localRevision:row.local?.revision??0,modulesRevision:row.modules?.revision??0});
  return {label,epoch,rows:comparison(historical.payload,payload,cloud.payload,policy)};
 }
 const views=[await readRow('confirmed',current)];
 if(branch){views.push(await readRow('pending-base',branch.base));views.push(await readRow('pending-working',branch.working))}
 if(saved){
  check(saved.receipt?.operationId===receipt.operationId&&saved.source,'Respaldo anterior incompatible');
  views.push(await readRow('previous-backup',saved.source));
 }
 await verify();check(eq(await client.discover(),receipt)&&validateLargeList(await client.request('GET')).head===head,'La copia remota cambió');
 const reread=await remote(head,cloud.sha,newSecret);check(reread.sha===cloud.sha,'La nube cambió');
 await verify();check(eq(await repository.readSync(id),current)&&eq(await pending.inspect(id),branch)&&eq(await repository.readRekey(id),saved),'Los registros locales cambiaron durante la revisión');
 const manifest={format,accountId:id,archiveId,receipt,head,headSha:cloud.sha,branchPhase:branch?.phase??null,parts:manifestRows};
 const encryptedManifest=await encrypt84(manifest,backupPhrase);
 check(await checksum84(await decrypt84(encryptedManifest,backupPhrase))===await checksum84(manifest),'Manifiesto no verificable');
 await verify();check(eq(await repository.readSync(id),current)&&eq(await pending.inspect(id),branch)&&eq(await repository.readRekey(id),saved),'Los registros locales cambiaron');
 return {kind:'review',head,referenceRevision:receipt.sourceRevision,commonAncestorProven:false,views,archive:{manifest:encryptedManifest,parts}};
}
// Verify completeness, account binding and exact contents of all encrypted
// parts before the archive can be used as a recovery input. Never restores.
export async function verifyRecoveryArchive1161({archive,backupPhrase,accountId}){
 check(idValid(accountId)&&exact(archive,['manifest','parts'])&&Array.isArray(archive.parts),'Archivo inválido');
 const m=await decrypt84(archive.manifest,backupPhrase);
 check(m?.format===format&&m.accountId===accountId&&uuid(m.archiveId)&&Array.isArray(m.parts)&&m.parts.length===archive.parts.length&&m.parts.length<=16,'Manifiesto incompatible');
 const seen=new Set();
 for(let i=0;i<m.parts.length;i++){
  const expected=m.parts[i],part=archive.parts[i];
  check(typeof expected?.name==='string'&&hex(expected.sha)&&!seen.has(expected.name)&&part?.name===expected.name,'Parte ausente o duplicada');seen.add(expected.name);
  const x=await decrypt84(part.envelope,backupPhrase);
  check(exact(x,['format','accountId','archiveId','name','sha','value'])&&x.format===format&&x.accountId===accountId&&x.archiveId===m.archiveId&&x.name===expected.name&&x.sha===expected.sha&&await checksum84(x.value)===expected.sha,'Parte incompatible');
 }
 return {verified:true,partCount:seen.size,head:m.head,referenceRevision:m.receipt.sourceRevision};
}

// A review plan is deliberately read-only. Reopening a downloaded file does
// not authorize migration, freezing a branch, or applying any changes.
export async function makeReviewPlan1167({review,client,backupPhrase,freeze=null}){
 check(review?.kind==='review'&&review.commonAncestorProven===false,'Revisión inválida');
 const id=client.accountId,identity=await client.verify();
 check(identity.accountId===id,'Cuenta inválida');
 const digest=await checksum84(review.archive);
 let active=true;
 return Object.freeze({...review,cancel(){active=false},async apply({confirmed,savedArchive,freezeReviewed=false}={}){
  check(active&&confirmed===true&&savedArchive,'Confirmá la verificación del archivo');active=false;
  const verify=async()=>{const s=await client.verify();check(s.accountId===id&&s.csrf===identity.csrf,'La sesión cambió')};
  check(freezeReviewed===false||freezeReviewed===true&&typeof freeze==='function','Congelación no disponible');
  await verify();check(await checksum84(savedArchive)===digest,'El archivo no coincide con esta revisión');
  const result=await verifyRecoveryArchive1161({archive:savedArchive,backupPhrase,accountId:id});await verify();
  if(freezeReviewed===true){check(await freeze()===true,'Congelación no confirmada');return {kind:'frozen-review',...result}}
  return {kind:'verified-only',...result};
 }});
}
