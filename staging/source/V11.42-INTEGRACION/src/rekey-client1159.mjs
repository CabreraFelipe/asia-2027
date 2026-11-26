// Private candidate adapter: no UI, no persistent phrase, no background retry.
import {prepareLocalCommit1158} from './local-rekey1158.mjs';
import {localPayload,validatePayload} from '../../V11.36-INTEGRACION/src/sync.mjs';
import {createLargeTransport} from '../../V11.38-INTEGRACION/src/large-transport.mjs';
import {validateLargeList} from '../../V11.38-INTEGRACION/src/large-sync-client.mjs';
import {hashBytes,validLargeEnvelope} from '../../V11.38-INTEGRACION/src/large-sync.mjs';
import {encrypt84,decrypt84,checksum84} from '../../../../model84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const valid=s=>/^acct_[a-f0-9]{32}$/.test(s?.accountId||'')&&/^[A-Za-z0-9_-]{43}$/.test(s.csrf||'');
const uuid=s=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(s);
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const base={method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error'};
export async function createRekeyClient1159({origin,readSession,fetcher=fetch}){
 check(/^https:\/\/asia-v1142-candidate-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin),'Origen inválido');
 const identity=await readSession();check(valid(identity),'Sesión inválida');
 const verify=async()=>{const s=await readSession();check(valid(s)&&s.accountId===identity.accountId&&s.csrf===identity.csrf,'La sesión cambió');return s};
 async function post(input){
  await verify();const response=await fetcher(origin+'/v11.59/rekey',{...base,headers:{'Content-Type':'application/json','X-Asia-CSRF':identity.csrf},body:JSON.stringify(input)});
  await verify();if(!response.ok){const e=Error('Migración no confirmada; consultá la operación antes de reintentar');e.status=response.status;throw e}
  const x=await response.json();check(x?.ok===true&&x.syntheticOnly===true&&x.accountId===identity.accountId,'Respuesta inválida');
  const op=x.operation;
  if(op===null){check(input.action==='discover','Operación ausente');return null}
  check(uuid(op?.operationId)&&['locked','committed','canceled'].includes(op.phase)&&Number.isSafeInteger(op.sourceRevision)&&op.sourceRevision>=1&&op.sourceRevision<200&&hex(op.sourceSha)&&(!input.operationId||input.operationId===op.operationId),'Operación inválida');
  if(op.phase==='committed')check(op.revision===op.sourceRevision+1&&hex(op.targetSha),'Recibo inválido');
  return op;
 }
 async function managedKey(){
  await verify();const r=await fetcher(origin+'/v11.52/account-key',{...base,headers:{'X-Asia-CSRF':identity.csrf}});
  await verify();check(r.ok,'Clave no disponible');const x=await r.json();check(x?.ok===true&&x.syntheticOnly===true&&x.accountId===identity.accountId&&/^[A-Za-z0-9_-]{43}$/.test(x.secret||''),'Clave inválida');return x.secret;
 }
 const request=createLargeTransport({origin,readSession:verify,fetcher});
 const seedRequest=createLargeTransport({origin,readSession:verify,fetcher,legacySeed:true});
 const managedRequest=createLargeTransport({origin,readSession:verify,fetcher,managedWrite:true});
 return Object.freeze({accountId:identity.accountId,verify,request,writeManaged:({expectedRevision,envelope})=>managedRequest('POST',{expectedRevision,envelope}),seed:envelope=>seedRequest('POST',{expectedRevision:0,envelope}),discover:()=>post({action:'discover'}),inspect:operationId=>post({action:'inspect',operationId}),
  begin:({operationId,expectedRevision,expectedSha,confirmed})=>post({action:'begin',operationId,expectedRevision,expectedSha,confirmed}),
  cancel:({operationId,confirmed})=>post({action:'cancel',operationId,confirmed}),
  commit:({operationId,oldPhrase,confirmed,consent})=>post({action:'commit',operationId,oldPhrase,confirmed,consent}),
  managedKey});
}
// Preflight before any new remote commit. A divergent or pending local
// device does not initiate migration. Existing committed receipts can be
// recovered from a new session. Never auto-apply or auto-cancel.
export async function prepareMigration1159({client,repository,pending,policy,oldPhrase,maintenanceConfirmed}){
 check(maintenanceConfirmed===true&&typeof oldPhrase==='string'&&oldPhrase.length>=12&&oldPhrase.length<=200,'Confirmá mantenimiento y frase anterior');
 const id=client.accountId,verify=client.verify;
 const noPending=async()=>check(!await pending.inspect(id),'Hay cambios pendientes; conservá ambas copias');
 await verify();await noPending();
 const existing=await client.discover(),head=validateLargeList(await client.request('GET')).head;
 if(head===0&&!existing){
  const source=await repository.readSync(id),saved=await repository.readRekey(id);
  check(!saved&&!source.baseline&&(source.local||source.modules),'No hay origen local independiente para la copia inicial');
  const local=await localPayload({row:source,readSession:verify,passphrase:oldPhrase,policy});
  check(local.payload.entries.length||Object.keys(local.payload.modules).length,'No hay registros portables para migrar');
  const envelope=await encrypt84({format:'asia-v1136-sync-v1',accountId:id,payload:local.payload},oldPhrase);
  check(validLargeEnvelope(envelope),'Copia inicial excede el límite');
  await noPending();await verify();check(eq(source,await repository.readSync(id)),'La copia local cambió');
  let active=true;
  return Object.freeze({kind:'ready',phase:'seed',cancel(){active=false},
   async apply({confirmed,consent}={}){
    check(active&&confirmed===true&&consent==='transient-server-rekey-v1','Confirmá copia inicial, recifrado y consentimiento');active=false;
    await noPending();await verify();check(eq(source,await repository.readSync(id)),'La copia local cambió');
    check(await client.discover()===null&&validateLargeList(await client.request('GET')).head===0,'La nube cambió; revisá antes de continuar');
    await noPending();await verify();check(eq(source,await repository.readSync(id)),'La copia local cambió');
    // A lost response requires a fresh preflight, not a blind retry.
    const result=await client.seed(envelope);
    check(result.ok===true&&result.revision===1,'Copia inicial no confirmada');
    const verified=await client.request('GET',null,1);
    check(verified.ok===true&&verified.revision===1&&eq(verified.envelope,envelope),'No se verificó la copia inicial');
    await noPending();await verify();check(eq(source,await repository.readSync(id)),'La copia local cambió; copia inicial preservada');
    const next=await prepareMigration1159({client,repository,pending,policy,oldPhrase,maintenanceConfirmed:true});
    if(next.kind!=='ready'||next.phase==='seed')return next;
    return next.apply({confirmed:true,consent});
   }
  });
 }
 const revision=existing?.sourceRevision??head;
 check(revision>=1&&revision<200&&head===(existing?.phase==='committed'?existing.revision:revision),'La copia remota cambió');
 const r=await client.request('GET',null,revision);
 check(r?.ok===true&&r.revision===revision&&validLargeEnvelope(r.envelope),'Copia remota inválida');
 const sha=await hashBytes(new TextEncoder().encode(JSON.stringify(r.envelope)));
 check(!existing||existing.sourceSha===sha,'Copia remota cambió');
 const plain=await decrypt84(r.envelope,oldPhrase);
 check(plain&&Object.keys(plain).sort().join(',')==='accountId,format,payload'&&plain.accountId===id&&plain.format==='asia-v1136-sync-v1','Copia incompatible');
 const source=await repository.readSync(id),saved=await repository.readRekey(id);
 const payload=validatePayload(plain.payload,policy);
 if(!saved){
  check(source.local||source.modules,'No hay bóvedas locales para migrar');
  const local=await localPayload({row:source,readSession:verify,passphrase:oldPhrase,policy});
  if(await checksum84(local.payload)!==await checksum84(payload))return Object.freeze({kind:'conflict'});
 }else check(existing?.phase==='committed'&&saved.receipt.operationId===existing.operationId,'Respaldo incompatible');
 await noPending();await verify();check(eq(source,await repository.readSync(id)),'La copia local cambió');
 let active=true;
 const operationId=existing?.operationId??crypto.randomUUID();
 return Object.freeze({kind:'ready',operationId,phase:existing?.phase??'new',cancel(){active=false},
  async apply({confirmed,consent}={}){
   check(active&&confirmed===true&&consent==='transient-server-rekey-v1','Confirmá el recifrado y consentimiento de transporte');active=false;
   await noPending();await verify();check(eq(source,await repository.readSync(id)),'La copia local cambió');
   const now=await client.discover();check(eq(now,existing),'La operación remota cambió');
   let receipt=now;
   if(!receipt)receipt=await client.begin({operationId,expectedRevision:revision,expectedSha:sha,confirmed:true});
   if(receipt.phase==='locked'){
    await noPending();await verify();check(eq(source,await repository.readSync(id)),'La copia local cambió; operación remota conservada');
    receipt=await client.commit({operationId,oldPhrase,confirmed:true,consent});
   }
   check(receipt.phase==='committed','Migración remota no confirmada');
   const newSecret=await client.managedKey();
   const plan=await prepareLocalCommit1158({readSession:verify,repository,pending,policy,oldPhrase,newSecret,operationId,readReceipt:client.inspect,request:client.request,maintenanceConfirmed:true});
   if(plan.kind!=='ready')return plan;
   return plan.apply({confirmed:true});
  }
 });
}
