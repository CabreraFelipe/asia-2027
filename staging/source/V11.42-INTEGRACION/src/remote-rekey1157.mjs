// Internal synthetic-only coordinator. No HTTP route, UI or deployment flag.
// oldPhrase is a transient argument in this isolated implementation; no
// transport decision is made here. Never store/log it or return it.
import {generateAccountSecret,importWrappingKey,wrapAccountSecret,unwrapAccountSecret} from './account-key1150.mjs';
import {hashBytes,validLargeEnvelope,MAX_BYTES} from '../../V11.38-INTEGRACION/src/large-sync.mjs';
import {validatePayload} from '../../V11.36-INTEGRACION/src/sync.mjs';
import {encrypt84,decrypt84,checksum84} from '../../../../model84.mjs';
const check=(ok,m)=>{if(!ok)throw Error(m)};
const uuid=s=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(s);
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const encode=x=>new TextEncoder().encode(JSON.stringify(x));
export function createRemoteRekey1157({db,bucket,session,kekId,kekSecret,policy,enabled=false,now=Date.now}){
 check(enabled===true&&/^acct_[a-f0-9]{32}$/.test(session?.id||'')&&hex(session.digest)&&/^[A-Za-z0-9_-]{43}$/.test(session.csrf||''),'Migración no autorizada');
 const id=session.id;
 const live='EXISTS(SELECT 1 FROM auth_oidc_sessions_v1111 WHERE token_digest=? AND account_id=? AND csrf=? AND expires_at>?)';
 const args=()=>[session.digest,id,session.csrf,now()];
 const query=(sql,...a)=>db.prepare(sql).bind(...a).first();
 const verify=async()=>check(await query('SELECT 1 AS yes WHERE '+live,...args()),'Sesión no vigente');
 const row=op=>query('SELECT * FROM remote_rekeys_v1157 WHERE account_id=? AND operation_id=? AND '+live,id,op,...args());
 const status=r=>({operationId:r.operation_id,phase:r.phase,sourceRevision:r.source_revision,sourceSha:r.source_sha,...(r.phase==='committed'?{revision:r.source_revision+1,targetSha:r.target_sha}:{})});
 const requireRow=async op=>{check(uuid(op),'Operación inválida');await verify();const r=await row(op);check(r,'Operación no encontrada');return r};
 const wrapping=()=>importWrappingKey(kekSecret);
 const head=()=>query('SELECT * FROM sync_v1138_objects WHERE account_id=? ORDER BY revision DESC LIMIT 1',id);
 async function readObject(r){
  check(r&&Number.isSafeInteger(r.bytes)&&r.bytes>0&&r.bytes<=MAX_BYTES&&hex(r.sha256),'Índice inválido');
  const o=await bucket.get(r.object_key);check(o&&o.size===r.bytes,'Objeto ausente o corrupto');
  const bytes=new Uint8Array(await o.arrayBuffer());check(bytes.length===r.bytes&&await hashBytes(bytes)===r.sha256,'Objeto corrupto');
  const envelope=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));check(validLargeEnvelope(envelope),'Sobre inválido');return envelope;
 }
 return Object.freeze({
  async begin({operationId,expectedRevision,expectedSha,confirmed}){
   check(confirmed===true&&uuid(operationId)&&Number.isSafeInteger(expectedRevision)&&expectedRevision>=1&&expectedRevision<200&&hex(expectedSha),'Confirmación o revisión inválida');
   await verify();const existing=await row(operationId);
   if(existing){check(existing.source_revision===expectedRevision&&existing.source_sha===expectedSha,'Operación incompatible');return status(existing)}
   const source=await head();check(source?.revision===expectedRevision&&source.sha256===expectedSha,'La copia remota cambió');await readObject(source);
   const key=await wrapping(),secret=generateAccountSecret(),wrapped=await wrapAccountSecret({accountId:id,kekId,key,secret});
   // INSERT triggers atomically acquire the fence or roll back. Concurrent
   // same-operation callers can resume the winner; distinct IDs cannot steal it.
   try{await query('INSERT INTO remote_rekeys_v1157(account_id,operation_id,source_revision,source_sha,phase,wrapped_key,created_at) SELECT ?,?,?,?,\'locked\',?,? WHERE '+live+' RETURNING operation_id',id,operationId,expectedRevision,expectedSha,JSON.stringify(wrapped),new Date(now()).toISOString(),...args())}
   catch(e){const winner=await row(operationId);if(!winner)throw e}
   const saved=await requireRow(operationId);check(saved.source_revision===expectedRevision&&saved.source_sha===expectedSha,'Operación incompatible');return status(saved);
  },
  async inspect(operationId){return status(await requireRow(operationId))},
  async cancel({operationId,confirmed}){
   check(confirmed===true,'Confirmá cancelación');const r=await requireRow(operationId);
   if(r.phase==='canceled')return status(r);check(r.phase==='locked','Migración ya confirmada');
   await query("UPDATE remote_rekeys_v1157 SET phase='canceled',wrapped_key=NULL,finished_at=? WHERE account_id=? AND operation_id=? AND phase='locked' AND "+live+' RETURNING operation_id',new Date(now()).toISOString(),id,operationId,...args());
   const final=await requireRow(operationId);check(final.phase==='canceled','Cancelación no confirmada');return status(final);
  },
  async commit({operationId,oldPhrase,confirmed}){
   check(confirmed===true,'Confirmá migración');const r=await requireRow(operationId);
   if(r.phase==='committed')return status(r);
   check(r.phase==='locked'&&typeof oldPhrase==='string'&&oldPhrase.length>=12&&oldPhrase.length<=200,'Migración o frase inválida');
   const source=await head();check(source?.revision===r.source_revision&&source.sha256===r.source_sha,'La copia remota cambió');
   const old=await readObject(source),plain=await decrypt84(old,oldPhrase);
   check(plain&&Object.keys(plain).sort().join(',')==='accountId,format,payload'&&plain.accountId===id&&plain.format==='asia-v1136-sync-v1','Copia de otra cuenta o incompatible');
   validatePayload(plain.payload,policy);
   const key=await wrapping(),secret=await unwrapAccountSecret({accountId:id,kekId,key,envelope:JSON.parse(r.wrapped_key)});
   const next=await encrypt84(plain,secret);check(validLargeEnvelope(next)&&await checksum84(await decrypt84(next,secret))===await checksum84(plain),'Recifrado no verificado');
   const raw=encode(next),sha=await hashBytes(raw),objectKey='synthetic-sync-v1138/'+id+'/'+crypto.randomUUID();
   await verify();check((await requireRow(operationId)).phase==='locked','Migración cerrada');
   // Never overwrite source; if put or SQL outcome is ambiguous, keep object.
   await bucket.put(objectKey,raw);
   await readObject({object_key:objectKey,bytes:raw.length,sha256:sha});
   await verify();
   await query("UPDATE remote_rekeys_v1157 SET phase='committed',wrapped_key=NULL,target_object=?,target_bytes=?,target_sha=?,finished_at=? WHERE account_id=? AND operation_id=? AND phase='locked' AND "+live+' RETURNING operation_id',objectKey,raw.length,sha,new Date(now()).toISOString(),id,operationId,...args());
   const final=await requireRow(operationId);check(final.phase==='committed','Migración no confirmada');return status(final);
  }
 });
}
