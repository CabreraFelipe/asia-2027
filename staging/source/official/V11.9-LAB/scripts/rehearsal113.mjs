// V11.3 local rehearsal: REAL V10.6 encryption, real SQLite, V11.2 API code,
// fabricated accounts and fabricated records. NO NETWORK, NO USER DATA, NO DEPLOYMENT.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes} from 'node:crypto';
import api from '../api-staging.mjs';
import {make844,read844} from '../legacy_v106/backup844.mjs';
import {empty84} from '../legacy_v106/model84.mjs';
import {seedGym} from '../legacy_v106/gym84.mjs';
import {preflight113,verifySameArchive113,describePlan113} from '../migration113.mjs';

export async function rehearsal113({verbose=true}={}){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON;');
 for(const f of ['0001_staging.sql','0002_auth_staging.sql','0003_auth_test_keys.sql'])sqlite.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const db={prepare(sql){let args=[];return {sql,get args(){return args},bind(...v){args=v;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return {results:sqlite.prepare(sql).all(...args)}},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}}}}},async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const a=statements.map(x=>sqlite.prepare(x.sql).run(...x.args));sqlite.exec('COMMIT');return a.map(x=>({meta:{changes:Number(x.changes)}}))}catch(e){sqlite.exec('ROLLBACK');throw e}}};
 const operator=randomBytes(32).toString('base64url');
 const env={STAGING_MODE:'asia-v11-staging-110',STAGING_DB:db,STAGING_API_TOKEN:operator,AUTH_PEPPER_V111:randomBytes(32).toString('base64url')};
 let count=0;
 const check=(v,name)=>{assert.ok(v,name);count++;if(verbose)console.log('OK',name)};
 const request=async(path,method='GET',{session,body,op=true}={})=>{
  const headers={...(op?{Authorization:'Bearer '+operator}:{}),...(session?{'X-Asia-Session':session}:{}),...(body?{'Content-Type':'application/json'}:{})};
  const req=new Request('https://fake.staging.invalid'+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});
  const response=await api.fetch(req,env);return {code:response.status,json:await response.json()};
 };
 const expect=async(promise,status,label)=>{const r=await promise;check(r.code===status&&r.json?.ok===(status>=200&&status<300),label+` HTTP ${status} (received ${r.code})`);return r.json};
 try{
  await expect(request('/v11/status'),200,'Marcador y DB aislados');
  await expect(request('/v11/data/snapshots'),401,'Operador sin sesión no lee datos');
  await expect(request('/v11/status','GET',{op:false}),401,'Sin operador no hay acceso');
  const suffix=randomBytes(3).toString('hex'),aName='test_113_a_'+suffix,bName='test_113_b_'+suffix;
  const a=await expect(request('/v11/auth/register','POST',{body:{username:aName}}),201,'Cuenta sintética A');
  const b=await expect(request('/v11/auth/register','POST',{body:{username:bName}}),201,'Cuenta sintética B');
  const sA=(await expect(request('/v11/auth/login','POST',{body:{username:aName,test_key:a.test_key}}),200,'Login A')).session;
  const sB=(await expect(request('/v11/auth/login','POST',{body:{username:bName,test_key:b.test_key}}),200,'Login B')).session;
  const sentinel='PRIVATE_SENTINEL_NEVER_SHOW_'+suffix;
  const legacy={body:{'2026-11-19':{weight:80}},diet:{'2026-11-19':{note:sentinel}},work:{},photos:{},settings:{}};
  const storageMap=new Map([['asia2027-v1',JSON.stringify(legacy)]]);
  const storage={getItem:k=>storageMap.get(k)??null};
  const store={readPair:async()=>({preferences:{name:'preferences',revision:1,payload:empty84()},gym:{name:'gym',revision:1,payload:seedGym()}})};
  const phrase='ejemplo completamente ficticio y temporal 113';
  const envelope=await make844(storage,store,phrase);
  check(Object.keys(envelope).sort().join(',')==='cipher,format,iv,salt','Sobre generado con cifrado real V10.6');
  const report=await preflight113(envelope,phrase);
  check(report.counters.measurements===1&&report.counters.dietDays===1,'Preflight descifra y valida contenido ficticio');
  check(report.envelopeBytes<900000&&report.withinCurrentStagingRequestLimit,'Respaldo sintético apto por tamaño');
  check(!JSON.stringify(report).includes(sentinel)&&!JSON.stringify(report).includes(phrase),'Preflight nunca devuelve contenido ni frase');
  check(verifySameArchive113(envelope,report),'Comprobación SHA-256 original');
  check(describePlan113(report).remoteTransferAllowed===false,'Plan bloquea traslado real');
  const before=JSON.stringify(envelope);
  const save=await expect(request('/v11/data/snapshots','POST',{session:sA,body:{expectedRevision:0,envelope}}),201,'A publica únicamente copia ficticia');
  check(save.revision===1,'Revisión uno creada');
  const aBack=await expect(request('/v11/data/snapshots/1','GET',{session:sA}),200,'A recupera su copia');
  check(JSON.stringify(aBack.envelope)===before,'Sobre cifrado idéntico, byte por byte');
  const decoded=await read844(aBack.envelope,phrase);
  check(decoded.legacy.diet['2026-11-19'].note===sentinel,'Descifrado recuperado coincide con origen ficticio');
  const bBefore=await expect(request('/v11/data/snapshots/1','GET',{session:sB}),404,'B no puede leer copia de A');
  const bList=await expect(request('/v11/data/snapshots','GET',{session:sB}),200,'B puede consultar su lista');
  check(bList.head===0&&bList.versions.length===0,'B ve cero versiones de A');
  await expect(request('/v11/data/snapshots','POST',{session:sA,body:{expectedRevision:0,envelope}}),409,'Conflicto no sobrescribe la revisión');
  await expect(request('/v11/data/snapshots','POST',{session:sA,body:{expectedRevision:1,envelope,account_id:'acct_'+'f'.repeat(32)}}),400,'No admite identidad declarada por cliente');
  let tampered={...envelope,cipher:envelope.cipher.slice(0,-10)+(envelope.cipher.at(-10)==='A'?'B':'A')+envelope.cipher.slice(-9)};
  await assert.rejects(preflight113(tampered,phrase),/INTEGRITY_OR_PASSWORD_FAILED/);count++;if(verbose)console.log('OK Rechazo cifrado alterado');
  await assert.rejects(preflight113(envelope,'contraseña falsa e incorrecta'),/INTEGRITY_OR_PASSWORD_FAILED/);count++;if(verbose)console.log('OK Rechazo frase incorrecta');
  await assert.rejects(preflight113({...envelope,account_id:'falsa'},phrase),/NOT_INTEGRAL_ENCRYPTED_BACKUP/);count++;if(verbose)console.log('OK Rechazo campos extra');
  check(!verifySameArchive113(tampered,report),'Hash detecta sustitución del archivo de origen');
  check(JSON.stringify(envelope)===before,'Respaldo original nunca se altera');
  await expect(request('/v11/auth/logout','POST',{session:sA}),200,'Cerrar sesión A');
  await expect(request('/v11/data/snapshots','GET',{session:sA}),401,'A revocada');
  await expect(request('/v11/data/snapshots','GET',{session:sB}),200,'B sigue activa');
  await expect(request('/v11/auth/logout','POST',{session:sB}),200,'Cerrar sesión B');
  check(sqlite.prepare('SELECT COUNT(*) AS c FROM encrypted_snapshots_v11').get().c===1,'No se borran ni mutan copias de prueba');
  check(sqlite.prepare('SELECT COUNT(*) AS c FROM accounts_v11').get().c===2,'Solo dos cuentas sintéticas locales');
  return {passed:count,sourceBytes:report.envelopeBytes};
 }finally{sqlite.close();}
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1].replaceAll('\\','/')).href){
 try{const result=await rehearsal113();console.log(`V11.3: ${result.passed} comprobaciones locales reales; SIN RED, sin datos personales, sin despliegue.`);}
 catch(e){console.error('V11.3 NO VALIDADA:',e.message);process.exitCode=1;}
}
