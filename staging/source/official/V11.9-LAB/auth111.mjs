// V11.1b: operator-gated TEST ONLY identity laboratory on Workers Free.
// Credentials are SERVER-generated 256-bit random keys, never human passwords.
// Public registration, real users, email auth, CORS and personal-data APIs all remain disabled.
import {MARKER,json,checkOperator110,emptyBody110} from './guard.mjs';
import {b64u111,un64u111,fresh111,validPepper111,digest111,hex111,freshTestKey111,validTestKey111,testKeyDigest111,fixedEqual111} from './auth111-crypto.mjs';
const ISSUER='urn:asia:v11:staging-local';
const SESSION_MS=2*60*60*1000, WINDOW_MS=15*60*1000, MAX_ATTEMPTS=8, MAX_ACCOUNTS=20, MAX_SESSIONS=5;
const USER_RE=/^test_[a-z0-9_]{3,25}$/;
const TOKEN_RE=/^asstg_[A-Za-z0-9_-]{43}$/;
const CREDS='auth_test_keys_v111b';
const ERR=()=>json({ok:false,error:'Credenciales de prueba no válidas'},401);
const COMMON={ok:true,version:'11.1b',environment:'staging',authentication:'operator-and-synthetic-keys',publicRegistration:false,humanPasswords:false};
async function readJson111(request,action){
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')||''))return null;
 const length=request.headers.get('content-length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>1200))return null;
 if(!request.body)return null;
 const reader=request.body.getReader();let bytes=0;const parts=[];
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>1200){await reader.cancel();return null;}parts.push(value);}
  const raw=new Uint8Array(bytes);let i=0;for(const part of parts){raw.set(part,i);i+=part.length;}
  const x=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
  if(!x||Object.getPrototypeOf(x)!==Object.prototype||!USER_RE.test(x.username))return null;
  if(action==='register'&&Object.keys(x).sort().join(',')==='username')return x;
  if(action==='login'&&Object.keys(x).sort().join(',')==='test_key,username'&&validTestKey111(x.test_key))return x;
  return null;
 }catch{return null;}finally{try{reader.releaseLock();}catch{}}
}
function isDb(env){return !!env.STAGING_DB&&!env.DB&&env.STAGING_MODE===MARKER;}
export async function verifyAuthDb111(env){
 if(!isDb(env)||!validPepper111(env.AUTH_PEPPER_V111))return false;
 try{
  const r=await env.STAGING_DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const names=new Set((r.results||[]).map(x=>x.name));
  const expected=['accounts_v11','encrypted_snapshots_v11','push_devices_v11','reminder_queue_v11','staging_identity_v110','auth_sessions_v111','auth_attempts_v111',CREDS];
  if(!expected.every(x=>names.has(x))||['health_daily','ai_usage','asia_backup_v42','asia_backup_v844','health_workouts_v43'].some(x=>names.has(x)))return false;
  return (await env.STAGING_DB.prepare('SELECT marker FROM staging_identity_v110 WHERE id=1').first())?.marker===MARKER;
 }catch{return false;}
}
async function currentSession111(request,env){
 const token=request.headers.get('X-Asia-Session');if(!TOKEN_RE.test(token||''))return null;
 const digest=hex111(await digest111(env.AUTH_PEPPER_V111,'session:v111',token));
 const row=await env.STAGING_DB.prepare('SELECT s.account_id,a.subject,s.expires_at FROM auth_sessions_v111 s JOIN accounts_v11 a ON a.account_id=s.account_id WHERE s.token_digest=? AND s.expires_at>? AND a.issuer=?').bind(digest,Date.now(),ISSUER).first();
 return row?{...row,digest}:null;
}
async function rate111(db,pepper,username,now){
 const bucket=hex111((await digest111(pepper,'rate:v111',username)).slice(0,16));
 const row=await db.prepare('INSERT INTO auth_attempts_v111(bucket,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING attempts').bind(bucket,now+WINDOW_MS,now,now).first();
 return {bucket,blocked:!row||row.attempts>MAX_ATTEMPTS};
}
async function register111(data,env){
 const db=env.STAGING_DB,now=Date.now();
 const existing=await db.prepare('SELECT account_id FROM accounts_v11 WHERE issuer=? AND subject=?').bind(ISSUER,data.username).first();
 if(existing)return json({ok:false,error:'Ese identificador ficticio ya existe'},409);
 const count=await db.prepare('SELECT count(*) AS n FROM accounts_v11 WHERE issuer=?').bind(ISSUER).first();
 if(count?.n>=MAX_ACCOUNTS)return json({ok:false,error:'Máximo de 20 cuentas de prueba'},409);
 // The Worker generates the key. It cannot be supplied by a person or chosen weakly.
 const testKey=freshTestKey111(),salt=b64u111(fresh111(16));
 const digest=await testKeyDigest111(env.AUTH_PEPPER_V111,salt,testKey);
 const id='acct_'+hex111(fresh111(16));
 try{
  await db.batch([
   db.prepare('INSERT INTO accounts_v11(account_id,issuer,subject,created_at) VALUES(?,?,?,?)').bind(id,ISSUER,data.username,new Date(now).toISOString()),
   db.prepare(`INSERT INTO ${CREDS}(account_id,salt,key_digest,method,created_at) VALUES(?,?,?,?,?)`).bind(id,salt,digest,'hmac-sha256-synthetic-v1',now)
  ]);
  // Test key is returned ONCE over the operator-protected HTTPS API. Never log it.
  return json({...COMMON,registered:true,username:data.username,test_key:testKey},201);
 }catch{return json({ok:false,error:'No pudo registrarse la cuenta ficticia'},409);}
}
async function login111(data,env){
 const db=env.STAGING_DB,now=Date.now(),rate=await rate111(db,env.AUTH_PEPPER_V111,data.username,now);
 if(rate.blocked)return json({ok:false,error:'Demasiados intentos; reintentá más tarde'},429);
 const row=await db.prepare(`SELECT a.account_id,c.salt,c.key_digest,c.method FROM accounts_v11 a JOIN ${CREDS} c ON a.account_id=c.account_id WHERE a.issuer=? AND a.subject=?`).bind(ISSUER,data.username).first();
 const salt=row?.salt||b64u111(new Uint8Array(16));
 const computed=await testKeyDigest111(env.AUTH_PEPPER_V111,salt,data.test_key);
 if(!row||row.method!=='hmac-sha256-synthetic-v1'||!fixedEqual111(Uint8Array.from(computed.match(/../g).map(x=>parseInt(x,16))),Uint8Array.from((row.key_digest||'').match(/../g)?.map(x=>parseInt(x,16))||[])))return ERR();
 await db.prepare('DELETE FROM auth_attempts_v111 WHERE bucket=?').bind(rate.bucket).run();
 await db.prepare('DELETE FROM auth_sessions_v111 WHERE account_id=? AND expires_at<=?').bind(row.account_id,now).run();
 const num=await db.prepare('SELECT count(*) AS n FROM auth_sessions_v111 WHERE account_id=?').bind(row.account_id).first();
 if(num?.n>=MAX_SESSIONS)return json({ok:false,error:'Máximo de sesiones de prueba activas'},429);
 const token='asstg_'+b64u111(fresh111(32));
 const digest=hex111(await digest111(env.AUTH_PEPPER_V111,'session:v111',token));
 await db.prepare('INSERT INTO auth_sessions_v111(token_digest,account_id,created_at,expires_at) VALUES(?,?,?,?)').bind(digest,row.account_id,now,now+SESSION_MS).run();
 return json({...COMMON,username:data.username,session:token,expires_at:new Date(now+SESSION_MS).toISOString()});
}
export async function authRoute111(request,env){
 const refused=await checkOperator110(request,env,'STAGING_API_TOKEN');if(refused)return refused;
 const url=new URL(request.url);if(url.search)return json({ok:false,error:'No se admiten parámetros'},400);
 const path=url.pathname;
 const methods={'/v11/auth/register':'POST','/v11/auth/login':'POST','/v11/auth/session':'GET','/v11/auth/logout':'POST','/v11/auth/logout-all':'POST'};
 if(!Object.hasOwn(methods,path))return json({ok:false,error:'Ruta no disponible'},404);
 if(request.method!==methods[path])return json({ok:false,error:'Método no admitido'},405,{Allow:methods[path]});
 if(!await verifyAuthDb111(env))return json({ok:false,error:'Staging de autenticación no configurado'},503);
 try{
  if(path.endsWith('/register')||path.endsWith('/login')){
   const action=path.endsWith('/register')?'register':'login';
   const data=await readJson111(request,action);if(!data)return json({ok:false,error:'Formato inválido'},400);
   return action==='register'?await register111(data,env):await login111(data,env);
  }
  if(!await emptyBody110(request))return json({ok:false,error:'No se admite un cuerpo'},400);
  const session=await currentSession111(request,env);if(!session)return json({ok:false,error:'Sesión inválida o vencida'},401);
  if(path.endsWith('/session'))return json({...COMMON,username:session.subject,expires_at:new Date(session.expires_at).toISOString()});
  if(path.endsWith('/logout-all'))await env.STAGING_DB.prepare('DELETE FROM auth_sessions_v111 WHERE account_id=?').bind(session.account_id).run();
  else await env.STAGING_DB.prepare('DELETE FROM auth_sessions_v111 WHERE token_digest=?').bind(session.digest).run();
  return json({...COMMON,logged_out:true,all:path.endsWith('/logout-all')});
 }catch{return json({ok:false,error:'No se pudo procesar la autenticación de pruebas'},503);}
}

// V11.2: ownership is resolved ONLY from a verified operator-gated session.
// No account identifier supplied by the request is trusted.
export async function sessionOwner112(request,env){return currentSession111(request,env);}
