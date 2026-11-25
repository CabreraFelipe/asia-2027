// Asia Platform V11.2 live smoke: two synthetic test accounts, synthetic ciphertext.
// Never pass real passwords, names, personal data, Apple Health, or existing backups.
// Requires STAGING_API_TOKEN in environment; do not print tokens or generated test keys.
import {randomBytes,webcrypto} from 'node:crypto';
const token=process.env.STAGING_API_TOKEN;
if(!token||!/^[A-Za-z0-9_-]{43,128}$/.test(token)){
 console.error('Falta STAGING_API_TOKEN en la sesión de la terminal.');process.exit(2);
}
const origin='https://asia-v11-api-staging.cabrerafelipe2003.workers.dev';
const suffix=randomBytes(5).toString('hex');
const uA='test_112a_'+suffix,uB='test_112b_'+suffix;
let count=0;
async function envelope(){
 // Encrypt a tiny completely fictional payload with a disposable local AES-256-GCM key.
 // The key is never sent or stored; no user data is accessed.
 const salt=randomBytes(16),iv=randomBytes(12),rawKey=randomBytes(32);
 const key=await webcrypto.subtle.importKey('raw',rawKey,'AES-GCM',false,['encrypt']);
 const bytes=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode('V11.2: dato completamente ficticio'));
 return {format:'asia84-encrypted-v1',salt:salt.toString('base64'),iv:iv.toString('base64'),cipher:Buffer.from(bytes).toString('base64')};
}
async function call(path,method='GET',{body,session,operator=true}={}){
 const headers={...(operator?{Authorization:'Bearer '+token}:{}),...(session?{'X-Asia-Session':session}:{}),...(body?{'Content-Type':'application/json'}:{})};
 const r=await fetch(origin+path,{method,headers,...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(20000)});
 const j=await r.json().catch(()=>null);
 return {code:r.status,json:j};
}
function expect(r,status,label){if(r.code!==status||r.json?.ok!==(status>=200&&status<300)){throw Error(`${label}: HTTP ${r.code} (${r.json?.error||'respuesta inesperada'})`);}++count;console.log(`OK ${label} (HTTP ${status})`);}
try{
 expect(await call('/v11/status'),200,'Worker API y D1');
 expect(await call('/v11/data/snapshots'),401,'ruta de datos protegida');
 const ra=await call('/v11/auth/register','POST',{body:{username:uA}});expect(ra,201,'cuenta ficticia A');
 const rb=await call('/v11/auth/register','POST',{body:{username:uB}});expect(rb,201,'cuenta ficticia B');
 const la=await call('/v11/auth/login','POST',{body:{username:uA,test_key:ra.json.test_key}});expect(la,200,'sesión de A');
 const lb=await call('/v11/auth/login','POST',{body:{username:uB,test_key:rb.json.test_key}});expect(lb,200,'sesión de B');
 const a=la.json.session,b=lb.json.session;
 const aEnv=await envelope(),bEnv=await envelope();
 const saveA=await call('/v11/data/snapshots','POST',{session:a,body:{expectedRevision:0,envelope:aEnv}});expect(saveA,201,'copia cifrada ficticia A');
 const bMissing=await call('/v11/data/snapshots/1','GET',{session:b});expect(bMissing,404,'B no puede leer copia de A');
 const bList=await call('/v11/data/snapshots','GET',{session:b});expect(bList,200,'B lista únicamente sus copias');if(bList.json.head!==0)throw Error('B ve revisiones ajenas');
 const saveB=await call('/v11/data/snapshots','POST',{session:b,body:{expectedRevision:0,envelope:bEnv}});expect(saveB,201,'copia cifrada ficticia B');
 const readA=await call('/v11/data/snapshots/1','GET',{session:a});expect(readA,200,'lectura de A');if(JSON.stringify(readA.json.envelope)!==JSON.stringify(aEnv))throw Error('A no recibió su sobre cifrado');
 const readB=await call('/v11/data/snapshots/1','GET',{session:b});expect(readB,200,'lectura de B');if(JSON.stringify(readB.json.envelope)!==JSON.stringify(bEnv))throw Error('B no recibió su sobre cifrado');
 const conflict=await call('/v11/data/snapshots','POST',{session:a,body:{expectedRevision:0,envelope:await envelope()}});expect(conflict,409,'conflicto de versión de A');
 const concurrent=await Promise.all([
  call('/v11/data/snapshots','POST',{session:a,body:{expectedRevision:1,envelope:await envelope()}}),
  call('/v11/data/snapshots','POST',{session:a,body:{expectedRevision:1,envelope:await envelope()}})
 ]);
 const statuses=concurrent.map(x=>x.code).sort((x,y)=>x-y);
 if(JSON.stringify(statuses)!==JSON.stringify([201,409]))throw Error('Control atómico de revisión falló: '+JSON.stringify(statuses));
 count++;console.log('OK dos escrituras simultáneas: una aceptada y una rechazada (HTTP 201/409)');
 const forged=await call('/v11/data/snapshots','POST',{session:a,body:{expectedRevision:1,envelope:await envelope(),account_id:'acct_'+'b'.repeat(32)}});expect(forged,400,'suplantación por cuerpo rechazada');
 const query=await call('/v11/data/snapshots?account_id='+encodeURIComponent('acct_'+'b'.repeat(32)),'GET',{session:a});expect(query,400,'suplantación por query rechazada');
 expect(await call('/v11/auth/logout','POST',{session:a}),200,'cerrar sesión A');
 expect(await call('/v11/data/snapshots','GET',{session:a}),401,'sesión A revocada');
 expect(await call('/v11/data/snapshots/1','GET',{session:b}),200,'sesión B sigue vigente');
 expect(await call('/v11/auth/logout','POST',{session:b}),200,'cerrar sesión B');
 console.log(`VALIDADO: ${count} comprobaciones de V11.2 en Cloudflare (solo datos ficticios; dos cuentas).`);
}catch(e){console.error('NO VALIDADO:',e.message);process.exitCode=1;}
