// Local V11.4 proof: two devices of one synthetic account, another isolated account.
// It calls the exact V11.2 API with real SQLite, WebCrypto and V10.6 backup AES-GCM.
// NO remote fetch, no production IDs, no real user accounts, no personal files.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import api from '../api-staging.mjs';
import {make844,read844} from '../legacy_v106/backup844.mjs';
import {empty84} from '../legacy_v106/model84.mjs';
import {seedGym} from '../legacy_v106/gym84.mjs';
import {preflight113} from '../migration113.mjs';
import {SyncDevice114,fingerprint114} from '../sync114.mjs';

const base='https://offline-staging.invalid';
export async function rehearsal114({verbose=true}={}){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON;');
 for(const f of ['0001_staging.sql','0002_auth_staging.sql','0003_auth_test_keys.sql'])sqlite.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const db={prepare(query){let args=[];return {query,get args(){return args},bind(...xs){args=xs;return this},async first(){return sqlite.prepare(query).get(...args)||null},async all(){return {results:sqlite.prepare(query).all(...args)}},async run(){return {meta:{changes:Number(sqlite.prepare(query).run(...args).changes)}}}}},async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const r=statements.map(x=>sqlite.prepare(x.query).run(...x.args));sqlite.exec('COMMIT');return r.map(x=>({meta:{changes:Number(x.changes)}}))}catch(e){sqlite.exec('ROLLBACK');throw e}}};
 const operator=randomBytes(32).toString('base64url');
 const env={STAGING_MODE:'asia-v11-staging-110',STAGING_DB:db,STAGING_API_TOKEN:operator,AUTH_PEPPER_V111:randomBytes(32).toString('base64url')};
 let count=0;
 const check=(value,label)=>{assert.ok(value,label);count++;if(verbose)console.log('OK',label)};
 const match=(actual,wanted,label)=>{assert.deepEqual(actual,wanted,label);count++;if(verbose)console.log('OK',label)};
 const reject=async(fn,code,label)=>{await assert.rejects(async()=>fn(),RegExp(code));count++;if(verbose)console.log('OK',label)};
 const request=async(path,method='GET',{session,body}={})=>{
  const headers={Authorization:'Bearer '+operator,...(session?{'X-Asia-Session':session}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})};
  const req=new Request(base+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
  const response=await api.fetch(req,env);return {status:response.status,body:await response.json()};
 };
 const expected=async(path,method,options,status,label)=>{const r=await request(path,method,options);check(r.status===status&&r.body.ok===(status>=200&&status<300),label+` HTTP ${status}`);return r.body};
 const phrase='frase de prueba privada pero no personal 114';
 const verify=async envelope=>{await preflight113(envelope,phrase);return true};
 const envelope=async (n)=>{
  const payload={body:{'2026-11-20':{weight:80+n}},diet:{'2026-11-20':{note:'FICTITIOUS_ONLY_'+n}},work:{},photos:{},settings:{}};
  const fakeStorage={getItem:key=>key==='asia2027-v1'?JSON.stringify(payload):null};
  const fakeStore={readPair:async()=>({preferences:{revision:1,payload:empty84()},gym:{revision:1,payload:seedGym()}})};
  return make844(fakeStorage,fakeStore,phrase);
 };
 function transport(session){
  const root='/v11/data/snapshots';
  return {
   async list(){const r=await request(root,'GET',{session});if(r.status!==200)throw Error('UNAUTHORIZED_OR_UNAVAILABLE_'+r.status);return r.body},
   async read(revision){const r=await request(root+'/'+revision,'GET',{session});if(r.status!==200)throw Error('UNAUTHORIZED_OR_NOT_FOUND_'+r.status);return r.body},
   async append(rev,enc){return request(root,'POST',{session,body:{expectedRevision:rev,envelope:enc}})}
  };
 }
 const makeDevice=transport=>new SyncDevice114({transport,verifyArchive:verify});
 try{
  const a=await expected('/v11/auth/register','POST',{body:{username:'test_sync114_a'}},201,'Alta cuenta A ficticia');
  const b=await expected('/v11/auth/register','POST',{body:{username:'test_sync114_b'}},201,'Alta cuenta B ficticia');
  const sa=await expected('/v11/auth/login','POST',{body:{username:'test_sync114_a',test_key:a.test_key}},200,'Primera sesión A');
  const sa2=await expected('/v11/auth/login','POST',{body:{username:'test_sync114_a',test_key:a.test_key}},200,'Segundo dispositivo A');
  const sb=await expected('/v11/auth/login','POST',{body:{username:'test_sync114_b',test_key:b.test_key}},200,'Sesión independiente B');
  const da=makeDevice(transport(sa.session)), da2=makeDevice(transport(sa2.session)),db2=makeDevice(transport(sb.session));
  match((await da.inspect()).status,'IN_SYNC','Dos bases vacías comienzan sincronizadas');
  const e1=await envelope(1),e2=await envelope(2),e3=await envelope(3),e4=await envelope(4);
  await da.stage(e1);
  match(da.state.baseline,0,'Preparar edición local no cambia baseline');
  match((await da.upload()).status,'UPLOADED_AND_VERIFIED','Primera copia cifrada sincronizada con lectura de vuelta');
  match(da.state.baseline,1,'Confirmación remota avanza a revisión 1');
  match((await db2.inspect()).status,'IN_SYNC','B permanece vacía y aislada');
  match((await da2.inspect()).status,'REMOTE_AHEAD','Segundo dispositivo A descubre nueva revisión');
  match((await da2.download()).status,'REMOTE_QUARANTINED','Descarga remota en cuarentena');
  check(da2.state.hasIncoming&&da2.state.baseline===0,'Descarga no restaura ni confirma automáticamente');
  await reject(()=>da2.acceptIncoming(), 'EXPLICIT_CONFIRMATION_REQUIRED','Aceptar remoto requiere confirmación explícita');
  const accepted=await da2.acceptIncoming({confirmed:true});
  match(accepted.revision,1,'Segundo dispositivo acepta baseline verificado');
  const decrypted=await read844(accepted.envelope,phrase);
  match(decrypted.legacy.body['2026-11-20'].weight,81,'Contenido AES-GCM recuperado correctamente');
  await da.stage(e2);await da2.stage(e3);
  match((await da.upload()).revision,2,'Primer dispositivo publica revisión 2');
  match((await da2.inspect()).status,'REMOTE_AHEAD','Segundo dispositivo detecta base obsoleta');
  const conflict=await da2.upload();match(conflict.status,'CONFLICT','No sobrescribir la revisión remota');
  check(conflict.pendingPreserved&&da2.state.hasPending,'Edición local en conflicto no se pierde');
  match(await fingerprint114(da2.exportPending()),await fingerprint114(e3),'Copia local permanece byte por byte');
  match((await da2.download()).status,'CONFLICT_QUARANTINED','Remoto cifrado se mantiene separado de la edición local');
  await reject(()=>da2.acceptIncoming({confirmed:true}),'LOCAL_COPY_MUST_BE_PRESERVED','No aceptar remoto mientras haya pendiente');
  await reject(()=>da2.retainPendingForReview(),'EXPLICIT_CONFIRMATION_REQUIRED','Archivar conflicto necesita confirmación');
  const retained=da2.retainPendingForReview({confirmed:true});match(retained.status,'LOCAL_ENCRYPTED_COPY_RETAINED','Se conserva el respaldo local sin publicarlo');
  match(await fingerprint114(da2.exportRetained(retained.index)),await fingerprint114(e3),'Copia en conflicto queda recuperable');
  await da2.acceptIncoming({confirmed:true});match(da2.state.baseline,2,'Se puede adoptar baseline solo después de archivar la copia local');
  await da2.stage(e4);match((await da2.upload()).revision,3,'Nuevo archivo elaborado manualmente se publica como rev 3');
  match((await da.inspect()).status,'REMOTE_AHEAD','Otro dispositivo ve avance sin perder su última versión');
  match((await db2.inspect()).remoteRevision,0,'Otra cuenta nunca ve versiones ajenas');
  await reject(()=>da2.prepareRestoreOfRevision(1),'EXPLICIT_CONFIRMATION_REQUIRED','Restaurar revisión requiere confirmación');
  const plan=await da2.prepareRestoreOfRevision(1,{confirmed:true});
  match(plan.willCreateRevision,4,'La reversión crea una revisión NUEVA');
  match((await da2.upload()).revision,4,'Restauración no destructiva enviada como rev 4');
  const versions=(await transport(sa.session).list()).versions;
  match(versions.map(x=>x.revision),[4,3,2,1],'Versiones originales se conservan');
  match(await fingerprint114((await transport(sa.session).read(4)).envelope),await fingerprint114(e1),'Restauración replica cifrado histórico exacto');
  // Simulate an upload which was committed to D1 and then timed out in the client.
  const timed=transport(sa2.session),originalAppend=timed.append;
  timed.append=async(...args)=>{await originalAppend(...args);throw Error('SIMULATED_RESPONSE_LOST');};
  const mystery=makeDevice(timed);
  await mystery.download();await mystery.acceptIncoming({confirmed:true});
  await mystery.stage(await envelope(5));
  match((await mystery.upload()).status,'UNKNOWN_DELIVERY','Timeout no se interpreta como fracaso seguro');
  check(mystery.state.hasPending,'Pendiente retenido ante resultado ambiguo');
  match((await mystery.reconcileUnknown()).status,'PREVIOUS_UPLOAD_CONFIRMED','Se recupera confirmación mediante lectura del servidor');
  match(mystery.state.baseline,5,'No se duplica una subida confirmada');
  // Local failure before any remote request: safe retry requires inspecting remote head first.
  const interrupted=transport(sa2.session);interrupted.append=async()=>{throw Error('OFFLINE');};
  const retry=makeDevice(interrupted);await retry.download();await retry.acceptIncoming({confirmed:true});
  await retry.stage(await envelope(6));
  match((await retry.upload()).status,'UNKNOWN_DELIVERY','Error de red no borra el archivo preparado');
  match((await retry.reconcileUnknown()).status,'SAFE_TO_RETRY','Solo se reintenta si revision remota no cambió');
  interrupted.append=originalAppend;
  match((await retry.upload()).revision,6,'Reintento seguro crea exactamente una versión');
  // A transport silently sending a different payload is detected at readback.
  const wrong=transport(sa.session),safeAppend=wrong.append;
  wrong.append=async (revision)=>safeAppend(revision,await envelope(99));
  const malicious=makeDevice(wrong);
  await malicious.download();await malicious.acceptIncoming({confirmed:true});
  await malicious.stage(await envelope(7));
  await reject(()=>malicious.upload(),'REMOTE_READBACK_MISMATCH','Lectura de vuelta rechaza payload diferente');
  check(malicious.state.hasPending,'Diferencia remota no borra la versión local');
  // After readback mismatch, reconcile must refuse to treat the altered payload as success.
  match((await malicious.reconcileUnknown()).status,'CONFLICT','Reconciliación detecta copia distinta');
  // Stale session must fail closed, not downgrade to an empty account.
  await expected('/v11/auth/logout','POST',{session:sa.session},200,'Revocar sesión de A en la API real');
  await reject(()=>da.inspect(),'UNAUTHORIZED_OR_UNAVAILABLE_401','Sesion revocada no consulta revisiones');
  check((await db2.inspect()).remoteRevision===0,'Cuenta B no se afecta por la revocación A');
  match(sqlite.prepare('PRAGMA integrity_check').get().integrity_check,'ok','Integridad física SQLite');
  match(sqlite.prepare('PRAGMA foreign_key_check').all().length,0,'Sin claves foráneas rotas');
  check(sqlite.prepare('SELECT COUNT(*) as n FROM encrypted_snapshots_v11').get().n===7,'Almacenamiento aislado mantiene 7 revisiones sin borrados');
  return {passed:count};
 }finally{sqlite.close();}
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1].replaceAll('\\','/')).href){
 try{const r=await rehearsal114();console.log(`V11.4: ${r.passed} comprobaciones E2E offline; dos dispositivos, dos cuentas ficticias, cero peticiones de red.`)}
 catch(e){console.error('V11.4 NO VALIDADA:',e.stack);process.exitCode=1;}
}
