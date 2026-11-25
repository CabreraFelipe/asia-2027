// Asia Platform V11.11: isolated staging-only Google OIDC gateway + encrypted synthetic snapshots.
// NEVER bind production D1 or use for health/personal information. No AI calls, no push, no log of secrets.
import {rand,pkce,digest,accountId,eq,verifyGoogleIdToken,validEnvelope} from './security1111.mjs';
import {html112,css112,app112,crypto112} from './assets1112.mjs';
import {html113,css113,app113,crypto113,sync113} from './assets1113.mjs';
const MARKER='asia-v1111-identity-private';
const GOOGLE_AUTH='https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN='https://oauth2.googleapis.com/token';
const GOOGLE_JWKS='https://www.googleapis.com/oauth2/v3/certs';
const FLOW_COOKIE='__Host-asia1111_flow',SESSION_COOKIE='__Host-asia1111_session';
const FLOW_MS=300000,SESSION_MS=3600000,MAX_REVISIONS=20,MAX_BODY=500000,STAGING_DB_MARKER='asia-v11-staging-110';
const HEADERS={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; img-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"};
const json=(value,status=200,more={})=>new Response(JSON.stringify(value),{status,headers:{...HEADERS,'Content-Type':'application/json; charset=utf-8',...more}});
const err=(status,code)=>json({ok:false,error:code},status);
const cookie=(name,value,maxAge)=>`${name}=${value}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
const readCookie=(request,name)=>{const list=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(name+'='));return list.length===1?list[0].slice(name.length+1):'';};
const allowedEmails=env=>{const raw=env?.STAGING_ALLOWED_EMAILS;if(typeof raw!=='string'||raw.length>1500)return null;const list=raw.toLowerCase().split(',').map(x=>x.trim());if(list.length<1||list.length>5||new Set(list).size!==list.length||!list.every(x=>/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(x)))return null;return list;};
const eligible=env=>env?.STAGING_MODE===MARKER&&typeof env.STAGING_ORIGIN==='string'&&/^https:\/\/asia-v1111-identity-staging\.[a-z0-9-]+\.workers\.dev$/.test(env.STAGING_ORIGIN)&&env.STAGING_DB&&!env.DB&&typeof env.STAGING_GOOGLE_CLIENT_ID==='string'&&/^[A-Za-z0-9_.-]+\.apps\.googleusercontent\.com$/.test(env.STAGING_GOOGLE_CLIENT_ID)&&typeof env.STAGING_GOOGLE_CLIENT_SECRET==='string'&&env.STAGING_GOOGLE_CLIENT_SECRET.length>=8&&env.STAGING_GOOGLE_CLIENT_SECRET.length<=512&&allowedEmails(env)!==null;
const exactKeys=(value,keys)=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');
const noBody=r=>r.body===null;
const basic=async(request,env)=>{const tok=readCookie(request,SESSION_COOKIE);if(!/^[A-Za-z0-9_-]{43}$/.test(tok))return null;const d=await digest(tok),now=Date.now();const row=await env.STAGING_DB.prepare('SELECT account_id,csrf,expires_at,email_digest FROM auth_oidc_sessions_v1111 WHERE token_digest=? AND expires_at>?').bind(d,now).first();if(!row)return null;let authorized=false;for(const email of allowedEmails(env)||[]){if(eq(row.email_digest,await digest(email)))authorized=true;}return authorized?{id:row.account_id,csrf:row.csrf,digest:d}:null;};
const validWrite=(request,env,session)=>request.headers.get('Origin')===env.STAGING_ORIGIN&&eq(request.headers.get('X-Asia-CSRF')||'',session.csrf);
async function postJSON(request){const ct=request.headers.get('content-type')||'';if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(ct))throw Error('TYPE');const declared=request.headers.get('content-length');if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>MAX_BODY))throw Error('LARGE');if(!request.body)throw Error('EMPTY');const reader=request.body.getReader();const buffers=[];let length=0;try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>MAX_BODY)throw Error('LARGE');buffers.push(value);}if(!length)throw Error('EMPTY');const b=new Uint8Array(length);let start=0;for(const p of buffers){b.set(p,start);start+=p.length;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));}finally{try{reader.releaseLock();}catch{}}}
// Only fixed, non-sensitive Google error identifiers are propagated; never expose descriptions, codes or tokens.
const GOOGLE_ERRORS=new Set(['invalid_client','invalid_grant','unauthorized_client','invalid_request','unsupported_grant_type','invalid_scope']);
async function providerJSON(fetchImpl,url,options={}){
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),5000);
 try{
  // Cloudflare Workers does not implement redirect: 'error'. Explicitly reject 3xx in manual mode.
  const r=await fetchImpl(url,{...options,redirect:'manual',signal:ctrl.signal});
  if(r.status>=300&&r.status<400)throw Error('PROVIDER_REDIRECT_BLOCKED');
  if(Number(r.headers.get('content-length')||'0')>40000)throw Error('PROVIDER_RESPONSE_TOO_LARGE');
  const text=await r.text();if(text.length>40000)throw Error('PROVIDER_RESPONSE_TOO_LARGE');
  let data;try{data=JSON.parse(text);}catch{throw Error('PROVIDER_RESPONSE_INVALID');}
  if(!r.ok){
   if(url===GOOGLE_TOKEN&&GOOGLE_ERRORS.has(data?.error))throw Error('GOOGLE_'+data.error.toUpperCase());
   throw Error('PROVIDER_HTTP_FAILED');
  }
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('PROVIDER_RESPONSE_INVALID');
  return data;
 }finally{clearTimeout(timeout);}
}
const page=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Asia · Identidad staging V11.11</title></head><body style="font-family:system-ui;background:#0b1326;color:#e8f1ff;max-width:690px;margin:8vh auto;padding:24px"><header style="font-size:1.35rem;font-weight:750">asia <span style="font-size:.8rem;opacity:.65">PLATFORM · STAGING V11.11d</span></header><div style="margin:30px 0;padding:22px;border:1px solid #3c4d68;background:#142039;border-radius:15px"><h1 style="font-size:1.5rem">Identidad verificada con Google</h1><p>Acceso privado para pruebas de integración. No solicita crear una contraseña de Asia.</p><p style="color:#efc88a;font-size:.9rem">No ingresar información de Salud ni respaldos personales: esta versión solo permite datos sintéticos.</p><p><a href="/v11.11/auth/start" style="display:inline-block;background:#b0d1fb;color:#12233e;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:bold">Iniciar sesión con Google</a></p><p style="font-size:.85rem;opacity:.72">Una vez autenticado, el endpoint /v11.11/auth/me confirma la sesión. Las cookies son seguras y HttpOnly.</p></div></body></html>`;
export function createWorker1111({fetchImpl=fetch}={}){
 return {async fetch(request,env){
  let u;try{u=new URL(request.url);}catch{return err(400,'SOLICITUD_INVALIDA');}
  if(u.pathname==='/v11.11/status'&&request.method==='GET'&&!u.search){let ready=false;if(eligible(env)){try{const row=await env.STAGING_DB.prepare('SELECT marker FROM staging_identity_v110 WHERE id=1').bind().first();if(row?.marker===STAGING_DB_MARKER){await env.STAGING_DB.prepare('SELECT COUNT(*) AS n FROM auth_oidc_flows_v1111').bind().first();await env.STAGING_DB.prepare('SELECT COUNT(*) AS n FROM auth_oidc_sessions_v1111').bind().first();ready=true;}}catch{}}return json({ok:true,version:'11.13',service:'identity-staging',configured:ready,publicRegistration:false,health:false,production:false});}
  if(!eligible(env))return err(503,'IDENTIDAD_NO_CONFIGURADA');
  try{const row=await env.STAGING_DB.prepare('SELECT marker FROM staging_identity_v110 WHERE id=1').bind().first();if(row?.marker!==STAGING_DB_MARKER)return err(503,'BASE_STAGING_NO_VERIFICADA');}catch{return err(503,'BASE_STAGING_NO_VERIFICADA');}
  if(u.origin!==env.STAGING_ORIGIN||request.headers.has('X-Asia-Account')||request.headers.has('X-Account-ID')||request.headers.has('X-User-ID'))return err(403,'ORIGEN_O_CUENTA_INVALIDA');
  const path=u.pathname;
  // V11.13: static assets only; all requests require staging marker and isolated D1.
  if(path.startsWith('/v11.13/')&&request.method==='GET'&&!u.search){
   const assets={
    '/v11.13/':[html113,'text/html; charset=utf-8'],
    '/v11.13/app.js':[app113,'text/javascript; charset=utf-8'],
    '/v11.13/crypto.js':[crypto113,'text/javascript; charset=utf-8'],
    '/v11.13/sync113.js':[sync113,'text/javascript; charset=utf-8'],
    '/v11.13/styles.css':[css113,'text/css; charset=utf-8']
   };
   const asset=assets[path];
   if(!asset)return err(404,'RUTA_INEXISTENTE');
   const csp="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
   return new Response(asset[0],{status:200,headers:{...HEADERS,'Content-Type':asset[1],'Content-Security-Policy':csp,'X-Asia-Staging':'synthetic-only'}});
  }
  if(path.startsWith('/v11.12/')&&request.method==='GET'&&!u.search){
   const assets={
    '/v11.12/':[html112,'text/html; charset=utf-8'],
    '/v11.12/app.js':[app112,'text/javascript; charset=utf-8'],
    '/v11.12/crypto.js':[crypto112,'text/javascript; charset=utf-8'],
    '/v11.12/styles.css':[css112,'text/css; charset=utf-8']
   };
   const asset=assets[path];
   if(!asset)return err(404,'RUTA_INEXISTENTE');
   const csp="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
   return new Response(asset[0],{status:200,headers:{...HEADERS,'Content-Type':asset[1],'Content-Security-Policy':csp,'X-Asia-Staging':'synthetic-only'}});
  }
  if(path==='/v11.11/'&&request.method==='GET'&&!u.search)return new Response(page,{status:200,headers:{...HEADERS,'Content-Type':'text/html; charset=utf-8'}});
  if(path==='/v11.11/auth/start'&&request.method==='GET'&&!u.search){
   try{
    await env.STAGING_DB.prepare('DELETE FROM auth_oidc_flows_v1111 WHERE expires_at<?').bind(Date.now()).run();const count=await env.STAGING_DB.prepare('SELECT COUNT(*) AS n FROM auth_oidc_flows_v1111 WHERE expires_at>?').bind(Date.now()).first();if(count?.n>=100)return err(429,'DEMASIADOS_INTENTOS');
    const state=rand(),nonce=rand(),verifier=rand(),expires=Date.now()+FLOW_MS;
    await env.STAGING_DB.prepare('INSERT INTO auth_oidc_flows_v1111(state_digest,nonce,verifier,expires_at) VALUES(?,?,?,?)').bind(await digest(state),nonce,verifier,expires).run();
    const q=new URL(GOOGLE_AUTH);q.searchParams.set('client_id',env.STAGING_GOOGLE_CLIENT_ID);q.searchParams.set('redirect_uri',env.STAGING_ORIGIN+'/v11.11/auth/callback');q.searchParams.set('response_type','code');q.searchParams.set('scope','openid email');q.searchParams.set('state',state);q.searchParams.set('nonce',nonce);q.searchParams.set('code_challenge',await pkce(verifier));q.searchParams.set('code_challenge_method','S256');
    return new Response(null,{status:303,headers:{...HEADERS,'Location':q.href,'Set-Cookie':cookie(FLOW_COOKIE,state,300)}});
   }catch{return err(503,'INICIO_NO_DISPONIBLE');}
  }
  if(path==='/v11.11/auth/callback'&&request.method==='GET'){
   const c=readCookie(request,FLOW_COOKIE),state=u.searchParams.get('state'),code=u.searchParams.get('code');const cleared=cookie(FLOW_COOKIE,'',0);
   // Google can return scope/authuser/prompt/hd alongside code and state.
   // These optional values never participate in identity or authorization decisions.
   // Require each security-critical parameter exactly once and retain bounded parsing.
   const params=u.searchParams;
   const queryOK=u.search.length<=8192&&params.size>=2&&params.size<=10&&
    params.getAll('state').length===1&&params.getAll('code').length===1&&
    !params.has('error')&&!params.has('error_description')&&
    [...params].every(([key,value])=>key.length>=1&&key.length<=64&&value.length<=5000);
   if(!queryOK||!/^[\w-]{43}$/.test(state||'')||typeof code!=='string'||code.length<5||code.length>1800)return json({ok:false,error:'FLUJO_INVALIDO'},400,{'Set-Cookie':cleared});
   if(!c)return json({ok:false,error:'FLUJO_COOKIE_AUSENTE'},400,{'Set-Cookie':cleared});
   if(!eq(state,c))return json({ok:false,error:'FLUJO_INVALIDO'},400,{'Set-Cookie':cleared});
   let phase='FLUJO_D1';
   try{
    const rec=await env.STAGING_DB.prepare('DELETE FROM auth_oidc_flows_v1111 WHERE state_digest=? RETURNING nonce,verifier,expires_at').bind(await digest(state)).first();if(!rec||rec.expires_at<Date.now())return json({ok:false,error:'FLUJO_VENCIDO'},400,{'Set-Cookie':cleared});
    phase='INTERCAMBIO_GOOGLE';
    const params=new URLSearchParams({code,client_id:env.STAGING_GOOGLE_CLIENT_ID,client_secret:env.STAGING_GOOGLE_CLIENT_SECRET,redirect_uri:env.STAGING_ORIGIN+'/v11.11/auth/callback',grant_type:'authorization_code',code_verifier:rec.verifier});
    const token=await providerJSON(fetchImpl,GOOGLE_TOKEN,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params.toString()});
    phase='CLAVES_GOOGLE';
    const jwks=await providerJSON(fetchImpl,GOOGLE_JWKS,{headers:{Accept:'application/json'}});
    phase='TOKEN_GOOGLE';
    const id=await verifyGoogleIdToken(token.id_token,{nonce:rec.nonce,clientId:env.STAGING_GOOGLE_CLIENT_ID,jwks});
    if(!allowedEmails(env).some(email=>eq(id.email,email)))return json({ok:false,error:'CUENTA_NO_AUTORIZADA'},403,{'Set-Cookie':cleared});
    phase='CUENTA_D1';
    const owner=await accountId(id.issuer,id.subject),now=Date.now(),raw=rand(),csrf=rand();
    await env.STAGING_DB.prepare('INSERT OR IGNORE INTO accounts_v11(account_id,issuer,subject,created_at) VALUES(?,?,?,?)').bind(owner,id.issuer,id.subject,new Date(now).toISOString()).run();
    const old=await env.STAGING_DB.prepare('SELECT account_id FROM accounts_v11 WHERE issuer=? AND subject=?').bind(id.issuer,id.subject).first();if(!old||old.account_id!==owner)return err(503,'CUENTA_INCONSISTENTE');
    phase='SESION_D1';
    await env.STAGING_DB.prepare('INSERT INTO auth_oidc_sessions_v1111(token_digest,account_id,csrf,email_digest,created_at,expires_at) VALUES(?,?,?,?,?,?)').bind(await digest(raw),owner,csrf,await digest(id.email),now,now+SESSION_MS).run();
    const headers=new Headers({...HEADERS,Location:'/v11.13/'});headers.append('Set-Cookie',cleared);headers.append('Set-Cookie',cookie(SESSION_COOKIE,raw,3600));return new Response(null,{status:303,headers});
   }catch(e){
    // Diagnostics must remain categorical: never emit provider response bodies, JWTs,
    // authorization codes, email addresses, cookies or SQL exception messages.
    const safeGoogleError=phase==='INTERCAMBIO_GOOGLE'&&
     typeof e?.message==='string'&&/^GOOGLE_(?:INVALID_CLIENT|INVALID_GRANT|UNAUTHORIZED_CLIENT|INVALID_REQUEST|UNSUPPORTED_GRANT_TYPE|INVALID_SCOPE)$/.test(e.message)
      ? e.message.slice('GOOGLE_'.length) : 'NO_DETERMINADO';
    const detail=phase==='INTERCAMBIO_GOOGLE'?safeGoogleError:'NO_DETERMINADO';
    return json({ok:false,error:'IDENTIDAD_NO_VERIFICADA',fase:phase,diagnostico:detail},400,{'Set-Cookie':cleared});
   }
  }
  if(path==='/v11.11/auth/me'&&request.method==='GET'&&!u.search){try{const s=await basic(request,env);if(!s)return err(401,'NO_AUTORIZADO');return json({ok:true,version:'11.13',accountId:s.id,csrf:s.csrf,syntheticOnly:true});}catch{return err(503,'SESION_NO_DISPONIBLE');}}
  if(path==='/v11.11/auth/logout'&&request.method==='POST'&&!u.search){try{const s=await basic(request,env);if(!s)return err(401,'NO_AUTORIZADO');if(!validWrite(request,env,s))return err(403,'CSRF_INVALIDO');if(!noBody(request))return err(400,'CUERPO_NO_PERMITIDO');await env.STAGING_DB.prepare('DELETE FROM auth_oidc_sessions_v1111 WHERE token_digest=?').bind(s.digest).run();return json({ok:true},200,{'Set-Cookie':cookie(SESSION_COOKIE,'',0)});}catch{return err(503,'CIERRE_NO_DISPONIBLE');}}
  if(path==='/v11.11/data/snapshots'||path.startsWith('/v11.11/data/snapshots/')){
   if(env.STAGING_ALLOW_SYNTHETIC_SNAPSHOTS!=='true')return err(403,'DATOS_DESACTIVADOS');
   if(u.search)return err(400,'QUERY_NO_PERMITIDA');
   const part=path.slice('/v11.11/data/snapshots'.length);const single=part.startsWith('/')&&/^\/[1-9]\d{0,1}$/.test(part)&&Number(part.slice(1))<=MAX_REVISIONS;
   if(part&& !single)return err(404,'RUTA_INEXISTENTE');
   if(!single&&!['GET','POST'].includes(request.method)||single&&request.method!=='GET')return err(405,'METODO_INVALIDO');
   let s;try{s=await basic(request,env);}catch{return err(503,'SESION_NO_DISPONIBLE');}if(!s)return err(401,'NO_AUTORIZADO');
   if(request.method==='GET'&&!noBody(request))return err(400,'CUERPO_NO_PERMITIDO');
   try{
    if(request.method==='GET'&&single){const revision=Number(part.slice(1)),row=await env.STAGING_DB.prepare('SELECT revision,envelope,created_at FROM encrypted_snapshots_v11 WHERE account_id=? AND revision=?').bind(s.id,revision).first();if(!row)return err(404,'NO_ENCONTRADA');let envelope;try{envelope=JSON.parse(row.envelope);}catch{return err(503,'COPIA_CORRUPTA');}if(!validEnvelope(envelope))return err(503,'COPIA_CORRUPTA');return json({ok:true,revision:row.revision,createdAt:row.created_at,envelope});}
    if(request.method==='GET'){const result=await env.STAGING_DB.prepare('SELECT revision,created_at FROM encrypted_snapshots_v11 WHERE account_id=? ORDER BY revision DESC LIMIT 20').bind(s.id).all();const versions=result.results||[];return json({ok:true,head:versions[0]?.revision||0,versions});}
    if(!validWrite(request,env,s))return err(403,'CSRF_INVALIDO');
    let input;try{input=await postJSON(request);}catch{return err(400,'CUERPO_INVALIDO');}
    if(!exactKeys(input,['expectedRevision','envelope'])||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||input.expectedRevision>=MAX_REVISIONS||!validEnvelope(input.envelope))return err(400,'SOBRE_INVALIDO');
    const now=Date.now();
    const row=await env.STAGING_DB.prepare(`INSERT INTO encrypted_snapshots_v11(account_id,revision,envelope,created_at)
     SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM auth_oidc_sessions_v1111 WHERE token_digest=? AND account_id=? AND expires_at>?)
     AND COALESCE((SELECT MAX(revision) FROM encrypted_snapshots_v11 WHERE account_id=?),0)=?
     RETURNING revision`).bind(s.id,input.expectedRevision+1,JSON.stringify(input.envelope),new Date(now).toISOString(),s.digest,s.id,now,s.id,input.expectedRevision).first();
    if(!row)return err(409,'CONFLICTO_O_SESION_REVOCADA');return json({ok:true,revision:row.revision},201);
   }catch{return err(request.method==='POST'?409:503,request.method==='POST'?'CONFLICTO_O_ERROR_DE_ESCRITURA':'BASE_NO_DISPONIBLE');}
  }
  return err(404,'RUTA_INEXISTENTE');
 }};
}
export default createWorker1111();
