// V11.17: complete staging-only encrypted bundle for BOTH independent synthetic D1 collections.
// No account migration, no destructive writes, no recovery codes or plaintext in export.
import {decryptDemo} from '/v11.13/crypto.js';
import {verifyArchive,restoreArchive,sameEnvelope} from '/v11.16/archive116.js';
export const BUNDLE_FORMAT='asia-v1117-synthetic-bundle-v1';
export const MAX_BUNDLE_BYTES=1750000;
const own=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===keys.slice().sort().join(',');
const ownerPattern=/^acct_[0-9a-f]{32}$/;
const envelopeShape=e=>own(e,['format','salt','iv','cipher'])&&e.format==='asia84-encrypted-v1'&&['salt','iv','cipher'].every(k=>typeof e[k]==='string');
const goodCollection=(c,max)=>own(c,['head','history'])&&Number.isInteger(c.head)&&c.head>=0&&c.head<=max&&Array.isArray(c.history)&&c.history.length===c.head&&c.history.every((row,i)=>own(row,['revision','envelope'])&&row.revision===i+1&&envelopeShape(row.envelope));
const indexOK=(r,max)=>r?.ok===true&&Number.isInteger(r.head)&&r.head>=0&&r.head<=max&&Array.isArray(r.versions)&&r.versions.length===r.head&&r.versions.every((x,i)=>x?.revision===r.head-i);
const keysOnly=(collection)=>({head:collection.head,history:collection.history.map(r=>({revision:r.revision,envelope:r.envelope}))});
export async function verifyBundle(raw,master,owner){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).byteLength>MAX_BUNDLE_BYTES||!master)throw Error('ARCHIVO_GRANDE_O_CLAVE_AUSENTE');
 let f;try{f=JSON.parse(raw);}catch{throw Error('JSON_INVALIDO');}
 if(!own(f,['format','accountId','collections'])||f.format!==BUNDLE_FORMAT||!own(f.collections,['snapshots','journal']))throw Error('FORMATO_INCOMPATIBLE');
 if(!ownerPattern.test(owner||'')||f.accountId!==owner)throw Error('CUENTA_DISTINTA');
 const snapshots=f.collections.snapshots,journal=f.collections.journal;
 if(!goodCollection(snapshots,20)||!goodCollection(journal,30)||snapshots.head+journal.head===0)throw Error('HISTORIAL_INCOMPLETO');
 // Legacy snapshots can validly restore earlier revisions as new ones; do not enforce append-only there.
 // Every legacy envelope must authenticate with this exact Google account's plaintext owner.
 let latestSnapshot=null;
 for(const row of snapshots.history)latestSnapshot=await decryptDemo(row.envelope,master,owner);
 let overview={dietDays:0,trainingDays:0,stepsTotal:0,cardioMinutes:0};
 if(journal.head){
  const verified=await verifyArchive(JSON.stringify({format:'asia-v1115-domain-archive-v1',accountId:owner,head:journal.head,history:journal.history}),master,owner);
  overview=verified.overview;
 }
 // Plaintext never crosses this boundary or stays in the import candidate.
 return {accountId:owner,collections:{snapshots:keysOnly(snapshots),journal:keysOnly(journal)},overview,snapshotEntries:latestSnapshot?.entries?.length||0};
}
async function fetchCollection(api,max){
 const index=await api.index();if(!indexOK(index,max))throw Error('INDICE_REMOTO_INVALIDO');
 const history=[];
 for(let revision=1;revision<=index.head;revision++){
  const row=await api.read(revision);
  if(row?.ok!==true||row.revision!==revision||!envelopeShape(row.envelope))throw Error('REVISION_REMOTA_INVALIDA');
  history.push({revision,envelope:row.envelope});
 }
 const after=await api.index();
 if(!indexOK(after,max)||after.head!==index.head)throw Error('HISTORIAL_CAMBIO_DURANTE_COPIA');
 // Verify cloud ciphertext stayed the same (read every envelope again) to avoid hybrid archives.
 for(let revision=1;revision<=index.head;revision++){
  const row=await api.read(revision);
  if(row?.ok!==true||row.revision!==revision||!sameEnvelope(history[revision-1].envelope,row.envelope))throw Error('HISTORIAL_CAMBIO_DURANTE_COPIA');
 }
 return {head:index.head,history};
}
export async function exportBundle(master,owner,{snapshots,journal}){
 if(!master||!ownerPattern.test(owner||'')||!snapshots||!journal)throw Error('SESION_O_CLAVE_FALTANTE');
 const [legacy,diary]=await Promise.all([fetchCollection(snapshots,20),fetchCollection(journal,30)]);
 const raw=JSON.stringify({format:BUNDLE_FORMAT,accountId:owner,collections:{snapshots:legacy,journal:diary}},null,2);
 await verifyBundle(raw,master,owner);
 return raw;
}
// Verify both remote histories against archive BEFORE uploading to EITHER collection.
async function precheckOne(backup,api,max){
 const idx=await api.index();if(!indexOK(idx,max))throw Error('INDICE_NUBE_INVALIDO');
 for(let revision=1;revision<=Math.min(idx.head,backup.head);revision++){
  const row=await api.read(revision);
  if(row?.ok!==true||row.revision!==revision||!sameEnvelope(row.envelope,backup.history[revision-1].envelope))throw Error('NUBE_DIVERGENTE_'+revision);
 }
 return idx.head;
}
async function restoreOne(backup,api,max){
 const was=await precheckOne(backup,api,max);
 if(was>=backup.head)return {written:0,status:was>backup.head?'NUBE_MAS_RECIENTE':'YA_RESTAURADO'};
 let written=0;
 for(let revision=was+1;revision<=backup.head;revision++){
  const result=await api.post(revision-1,backup.history[revision-1].envelope);
  if(result?.status!==409&&(!result?.ok||result.revision!==revision))throw Error('COPIA_INTERRUMPIDA_EN_REVISION_'+revision);
  const check=await api.read(revision);
  if(check?.ok!==true||check.revision!==revision||!sameEnvelope(check.envelope,backup.history[revision-1].envelope))throw Error('NUBE_DIVERGENTE_EN_REVISION_'+revision);
  if(result.status!==409)written++;
 }
 await precheckOne(backup,api,max);
 return {written,status:'RESTAURADO'};
}
export async function restoreBundle(verified,{snapshots,journal}){
 if(!verified||!ownerPattern.test(verified.accountId||'')||!goodCollection(verified.collections?.snapshots,20)||!goodCollection(verified.collections?.journal,30)||!snapshots||!journal)throw Error('COPIA_NO_VERIFICADA');
 // Collection APIs are always scoped server-side to authenticated account; never read/write accountId from the file.
 await precheckOne(verified.collections.snapshots,snapshots,20);
 await precheckOne(verified.collections.journal,journal,30);
 // Even if the first domain changes mid-import, the second is not overwritten: each write uses CAS.
 const a=await restoreOne(verified.collections.snapshots,snapshots,20);
 const b=await restoreOne(verified.collections.journal,journal,30);
 return {snapshots:a,journal:b,written:a.written+b.written};
}
