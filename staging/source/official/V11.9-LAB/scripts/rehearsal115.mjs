// V11.5 E2E: real SQLite, WebCrypto, exact API and auth/session handling. NO NETWORK.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import api from '../api-staging.mjs';
import {encryptCoachState115,decryptCoachState115,prepareCoachRequest115,approveMemory115} from '../coach115-client.mjs';
const BASE='https://asia-lab.invalid';
export async function rehearsal115({verbose=false}={}){
 const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON;');
 for(const f of ['0001_staging.sql','0002_auth_staging.sql','0003_auth_test_keys.sql','0004_coach_lab.sql'])sql.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const db={prepare(query){let args=[];return {query,get args(){return args},bind(...v){args=v;return this},async first(){return sql.prepare(query).get(...args)??null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){return {meta:{changes:Number(sql.prepare(query).run(...args).changes)}}}}},async batch(items){sql.exec('BEGIN IMMEDIATE');try{const results=items.map(s=>sql.prepare(s.query).run(...s.args));sql.exec('COMMIT');return results.map(r=>({meta:{changes:Number(r.changes)}}));}catch(e){sql.exec('ROLLBACK');throw e;}}};
 const operator=randomBytes(32).toString('base64url');
 const env={STAGING_MODE:'asia-v11-staging-110',STAGING_DB:db,STAGING_API_TOKEN:operator,AUTH_PEPPER_V111:randomBytes(32).toString('base64url')};
 let count=0;
 const check=(condition,message)=>{assert.ok(condition,message);count++;if(verbose)console.log('OK',message);};
 const same=(actual,wanted,message)=>{assert.deepEqual(actual,wanted,message);count++;if(verbose)console.log('OK',message);};
 const request=async(path,method='GET',{session,body,operatorAuth=true,headers={}}={})=>{
  const h={...(operatorAuth?{Authorization:'Bearer '+operator}:{}),...(session?{'X-Asia-Session':session}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers};
  const req=new Request(BASE+path,{method,headers:h,...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const res=await api.fetch(req,env);return {status:res.status,body:await res.json()};
 };
 const expect=async(path,method,opts,status,label)=>{const r=await request(path,method,opts);same(r.status,status,label+` HTTP ${status}`);return r.body;};
 const phrase='frase completamente ficticia para pruebas del coach v115';
 const firstMemory=approveMemory115('Objetivo de constancia (ficticio)',{id:'memory_115_1',approved:true});
 const baseState={schema:115,messages:[{id:'message_115_1',role:'user',text:'Pregunta privada A: SENTINEL_A_PRIVATE',at:'2026-11-23'}],memories:[firstMemory]};
 const stateB={schema:115,messages:[{id:'message_115_b',role:'user',text:'Mensaje de cuenta B: SENTINEL_B_PRIVATE',at:'2026-11-23'}],memories:[]};
 try{
  await expect('/v11/status','GET',{},200,'Marcador original V11');
  await expect('/v11/coach/state','GET',{},401,'Operador no equivale a sesión');
  await expect('/v11/coach/state','GET',{operatorAuth:false},401,'Sesión sin operador rechazada');
  const a=await expect('/v11/auth/register','POST',{body:{username:'test_coach115_a'}},201,'Cuenta A ficticia');
  const b=await expect('/v11/auth/register','POST',{body:{username:'test_coach115_b'}},201,'Cuenta B ficticia');
  const sa=(await expect('/v11/auth/login','POST',{body:{username:'test_coach115_a',test_key:a.test_key}},200,'Login A')).session;
  const sb=(await expect('/v11/auth/login','POST',{body:{username:'test_coach115_b',test_key:b.test_key}},200,'Login B')).session;
  same((await expect('/v11/coach/state','GET',{session:sa},200,'Estado inicial A')).head,0,'A inicia vacía');
  same((await expect('/v11/coach/state','GET',{session:sb},200,'Estado inicial B')).head,0,'B inicia vacía');
  const encA=await encryptCoachState115(baseState,phrase),encB=await encryptCoachState115(stateB,phrase);
  check(!JSON.stringify(encA).includes('SENTINEL_A_PRIVATE'),'Cifrado local no contiene mensaje legible');
  same((await expect('/v11/coach/state','POST',{session:sa,body:{expectedRevision:0,envelope:encA}},201,'A almacena estado cifrado')).revision,1,'Revisión A 1');
  same((await expect('/v11/coach/state','POST',{session:sb,body:{expectedRevision:0,envelope:encB}},201,'B almacena estado cifrado')).revision,1,'Revisión B 1');
  const rows=sql.prepare('SELECT envelope FROM coach_archives_v115').all();
  check(rows.length===2,'Dos archivos cifrados separados en D1');
  check(!JSON.stringify(rows).includes('SENTINEL_A_PRIVATE')&&!JSON.stringify(rows).includes('SENTINEL_B_PRIVATE'),'D1 nunca almacena texto legible');
  const aBack=await expect('/v11/coach/state/1','GET',{session:sa},200,'A lee su estado');
  const bBack=await expect('/v11/coach/state/1','GET',{session:sb},200,'B lee su estado');
  same(aBack.envelope,encA,'Contenido cifrado A coincide');same(bBack.envelope,encB,'Contenido cifrado B coincide');
  same((await decryptCoachState115(aBack.envelope,phrase)).messages[0].text,baseState.messages[0].text,'Descifrado original A');
  same((await decryptCoachState115(bBack.envelope,phrase)).messages[0].text,stateB.messages[0].text,'Descifrado original B');
  check(JSON.stringify(aBack).includes('SENTINEL_B_PRIVATE')===false,'Nunca sale contenido de B en respuesta de A');
  check(JSON.stringify(bBack).includes('SENTINEL_A_PRIVATE')===false,'Nunca sale contenido de A en respuesta de B');
  const invalid=await expect('/v11/coach/state','POST',{session:sa,body:{expectedRevision:1,envelope:{...encA,cipher:'AAAA'}}},400,'Sobre corrupto rechazado');
  check(invalid.ok===false,'No cambia revisión por archivo corrupto');
  await expect('/v11/coach/state','POST',{session:sb,body:{expectedRevision:0,envelope:encA}},409,'B no puede sobrescribir una revisión obsoleta');
  await expect('/v11/coach/state','POST',{session:sa,body:{expectedRevision:1,envelope:encA,account_id:b.account_id||'acct_fake'}},400,'Identidad en cuerpo rechazada');
  await expect('/v11/coach/state?account_id=other','GET',{session:sa},400,'Identidad en query rechazada');
  await expect('/v11/coach/state','GET',{session:sa,headers:{'X-Asia-Account':'test_coach115_b'}},400,'Identidad en cabecera rechazada');
  await expect('/v11/coach/state/2','GET',{session:sa},404,'No mostrar revisión inexistente');
  const revised={...baseState,messages:[...baseState.messages,{id:'message_115_2',role:'assistant',text:'Respuesta ficticia',at:'2026-11-23'}]};
  const newA=await encryptCoachState115(revised,phrase);
  const concurrent=await Promise.all([request('/v11/coach/state','POST',{session:sa,body:{expectedRevision:1,envelope:newA}}),request('/v11/coach/state','POST',{session:sa,body:{expectedRevision:1,envelope:encA}})]);
  same(concurrent.map(x=>x.status).sort((x,y)=>x-y),[201,409],'Concurrencia: una sola revisión ganadora');
  same((await expect('/v11/coach/state','GET',{session:sa},200,'Lista A')).versions.length,2,'A ve dos revisiones');
  same((await expect('/v11/coach/state','GET',{session:sb},200,'Lista B')).versions.length,1,'B ve una revisión');
  same((await expect('/v11/coach/quota','GET',{session:sa},200,'Cuota inicial A')).remaining.chat,12,'Cuota A 12');
  const reservationId='req_115_0123456789';
  const r1=await expect('/v11/coach/quota/reserve','POST',{session:sa,body:{kind:'chat',requestId:reservationId}},201,'Reservar chat A');
  same(r1.alreadyReserved,false,'Reserva nueva');
  const replay=await expect('/v11/coach/quota/reserve','POST',{session:sa,body:{kind:'chat',requestId:reservationId}},200,'Replay idempotente');
  same(replay.alreadyReserved,true,'Replay no cuenta dos veces');
  same((await expect('/v11/coach/quota','GET',{session:sa},200,'Cuota después de reserva')).remaining.chat,11,'Cuota disminuyó en uno');
  same((await expect('/v11/coach/quota','GET',{session:sb},200,'Cuota independiente B')).remaining.chat,12,'Cuota de B no se modificó');
  for(let i=0;i<11;i++){
   const r=await request('/v11/coach/quota/reserve','POST',{session:sa,body:{kind:'chat',requestId:'req_115_chat_'+String(i).padStart(4,'0')}});
   same(r.status,201,'Consumo de cuota hasta límite '+i);
  }
  await expect('/v11/coach/quota/reserve','POST',{session:sa,body:{kind:'chat',requestId:'req_115_chat_limit'}},429,'Límite individual chat');
  same((await expect('/v11/coach/quota','GET',{session:sa},200,'Cuota agotada')).remaining.chat,0,'Cuota chat agotada');
  same((await expect('/v11/coach/quota','GET',{session:sa},200,'Cuota semanal independiente')).remaining.weekly,4,'Cuota semanal sin consumir');
  const batch=await Promise.all(Array.from({length:8},(_,i)=>request('/v11/coach/quota/reserve','POST',{session:sb,body:{kind:'weekly',requestId:'req_115_week_'+String(i).padStart(4,'0')}})));
  same(batch.filter(x=>x.status===201).length,4,'Cuota semanal simultánea respeta límite');
  same(batch.filter(x=>x.status===429).length,4,'Cuatro solicitudes sobre límite rechazadas');
  await expect('/v11/coach/quota/reserve','POST',{session:sa,body:{kind:'weekly',requestId:'short'}},400,'Identificador inválido');
  await expect('/v11/coach/quota/reserve','POST',{session:sa,body:{kind:'vision',requestId:reservationId}},400,'Tipo sin permiso');
  await expect('/v11/coach/quota/reserve','POST',{session:sa,body:{kind:'chat',requestId:reservationId,health:{secret:1}}},400,'Datos extra rechazados');
  const privateSnapshot={health:{day:'2026-11-23',sleepHours:6,restingHeartRate:65,token:'HEALTH_SECRET'},nutrition:{day:'2026-11-23',kcal:1950,proteinG:140,complete:true},raw:'PERSONAL_SECRET'};
  const noConsent=prepareCoachRequest115({question:'¿Qué puedo mejorar?',snapshot:privateSnapshot});
  same(Object.keys(noConsent.context).length,0,'Sin grants: ningún dato compartido');
  check(!JSON.stringify(noConsent).includes('HEALTH_SECRET'),'Sin permiso Health no se comparte');
  const grantNutrition=prepareCoachRequest115({question:'¿Qué puedo mejorar?',snapshot:privateSnapshot,grants:{nutrition:true}});
  check(Object.hasOwn(grantNutrition.context,'nutrition'),'Nutrición enviada con permiso explícito');
  check(!Object.hasOwn(grantNutrition.context,'health'),'Salud nunca implícita');
  const grantHealth=prepareCoachRequest115({question:'¿Qué puedo mejorar?',snapshot:privateSnapshot,grants:{health:true}});
  same(grantHealth.context.health.sleepHours,6,'Solo campo permitido de Salud');
  check(!JSON.stringify(grantHealth).includes('HEALTH_SECRET'),'Ni con permiso se filtran campos secretos');
  await expect('/v11/auth/logout','POST',{session:sa},200,'Revocar A');
  await expect('/v11/coach/state','GET',{session:sa},401,'A revocada no lee memoria');
  await expect('/v11/coach/quota','GET',{session:sa},401,'A revocada no consulta cuota');
  await expect('/v11/coach/quota/reserve','POST',{session:sa,body:{kind:'chat',requestId:'req_115_after_logout'}},401,'A revocada no reserva');
  same((await expect('/v11/coach/state','GET',{session:sb},200,'B sigue activa')).head,1,'B no afectada');
  await expect('/v11/auth/logout','POST',{session:sb},200,'Cerrar B');
  check(sql.prepare('SELECT count(*) AS n FROM coach_archives_v115').get().n===3,'Se conservan las 3 versiones cifradas');
  return {checks:count};
 }finally{sql.close();}
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1].replaceAll('\\','/')).href){
 try{const r=await rehearsal115({verbose:false});console.log(`V11.5 E2E: ${r.checks} comprobaciones reales en SQLite/WebCrypto, offline.`);}catch(e){console.error('FALLÓ E2E:',e);process.exitCode=1;}
}
