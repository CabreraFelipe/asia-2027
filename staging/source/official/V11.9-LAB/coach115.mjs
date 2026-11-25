// V11.5: operator-gated synthetic-user Coach laboratory. NO LLM calls. NO PLAINTEXT STORAGE.
import {checkOperator110,json,emptyBody110} from './guard.mjs';
import {verifyAuthDb111,sessionOwner112} from './auth111.mjs';
import {validateCoachEnvelope115} from './coach115-client.mjs';
const ROOT='/v11/coach';
const isObj=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(o,k)=>isObj(o)&&Object.keys(o).sort().join('|')===k.slice().sort().join('|');
const common={ok:true,version:'11.5-lab',environment:'staging',scope:'synthetic-account',externalAI:false,personalData:false};
const LIMIT={chat:12,weekly:4};
async function parse(request,max){
 const ct=request.headers.get('Content-Type')||'';
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(ct))return {error:415};
 const len=request.headers.get('Content-Length');if(len!==null&&(!/^\d+$/.test(len)||Number(len)>max))return {error:413};
 if(!request.body)return {error:400};
 let size=0;const parts=[],reader=request.body.getReader();
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();return {error:413};}parts.push(value);}if(!size)return {error:400};
 const raw=new Uint8Array(size);let offset=0;for(const p of parts){raw.set(p,offset);offset+=p.length;}return {value:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw))};
 }catch{return {error:400};}finally{try{reader.releaseLock();}catch{}}
}
async function verify115(env){
 if(!await verifyAuthDb111(env))return false;
 try{const names=new Set((await env.STAGING_DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(x=>x.name));return ['coach_archives_v115','coach_reservations_v115'].every(t=>names.has(t));}catch{return false;}
}
function locate(path){
 if(path===ROOT+'/state')return {kind:'state',methods:['GET','POST']};
 const m=path.match(/^\/v11\/coach\/state\/([1-9]|1\d|20)$/);if(m)return {kind:'revision',revision:Number(m[1]),methods:['GET']};
 if(path===ROOT+'/quota')return {kind:'quota',methods:['GET']};
 if(path===ROOT+'/quota/reserve')return {kind:'reserve',methods:['POST']};
 return null;
}
export async function coachRoute115(req,env){
 const denied=await checkOperator110(req,env,'STAGING_API_TOKEN');if(denied)return denied;
 const url=new URL(req.url);if(url.search||['X-Asia-Account','X-Account-ID','X-User-ID'].some(k=>req.headers.has(k)))return json({ok:false,error:'No se admiten identidades o parámetros de cliente'},400);
 const route=locate(url.pathname);if(!route)return json({ok:false,error:'Ruta no disponible'},404);
 if(!route.methods.includes(req.method))return json({ok:false,error:'Método no permitido'},405,{Allow:route.methods.join(', ')});
 if(!await verify115(env))return json({ok:false,error:'Laboratorio Coach no configurado'},503);
 try{
  const owner=await sessionOwner112(req,env);if(!owner)return json({ok:false,error:'Sesión inexistente, vencida o revocada'},401);
  const db=env.STAGING_DB;
  if(req.method==='GET'){
   if(!await emptyBody110(req))return json({ok:false,error:'No se admite cuerpo'},400);
   if(route.kind==='state'){
    const rows=(await db.prepare('SELECT revision,created_at FROM coach_archives_v115 WHERE account_id=? ORDER BY revision DESC LIMIT 20').bind(owner.account_id).all()).results||[];
    return json({...common,head:rows[0]?.revision??0,versions:rows});
   }
   if(route.kind==='revision'){
    const row=await db.prepare('SELECT revision,envelope,created_at FROM coach_archives_v115 WHERE account_id=? AND revision=?').bind(owner.account_id,route.revision).first();
    if(!row)return json({ok:false,error:'Revisión no encontrada'},404);
    let envelope;try{envelope=JSON.parse(row.envelope);}catch{return json({ok:false,error:'Archivo cifrado inválido'},503);}
    if(!validateCoachEnvelope115(envelope))return json({ok:false,error:'Archivo cifrado inválido'},503);
    return json({...common,revision:row.revision,created_at:row.created_at,envelope});
   }
   if(route.kind==='quota'){
    const day=new Date().toISOString().slice(0,10);
    const rows=(await db.prepare('SELECT kind,count(*) AS count FROM coach_reservations_v115 WHERE account_id=? AND day=? GROUP BY kind').bind(owner.account_id,day).all()).results||[];
    const used=Object.fromEntries(rows.map(r=>[r.kind,r.count]));
    return json({...common,day,remaining:{chat:Math.max(0,LIMIT.chat-(used.chat||0)),weekly:Math.max(0,LIMIT.weekly-(used.weekly||0))}});
   }
  }
  const input=await parse(req,700000);if(input.error)return json({ok:false,error:'Formato de solicitud inválido'},input.error);
  const value=input.value;
  if(route.kind==='state'){
   if(!exact(value,['expectedRevision','envelope'])||!Number.isSafeInteger(value.expectedRevision)||value.expectedRevision<0||value.expectedRevision>=20||!validateCoachEnvelope115(value.envelope))return json({ok:false,error:'Sobre cifrado inválido'},400);
   const now=Date.now();
   const row=await db.prepare(`INSERT INTO coach_archives_v115(account_id,revision,envelope,created_at)
     SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM auth_sessions_v111 WHERE token_digest=? AND account_id=? AND expires_at>?)
     AND COALESCE((SELECT MAX(revision) FROM coach_archives_v115 WHERE account_id=?),0)=? RETURNING revision`).bind(owner.account_id,value.expectedRevision+1,JSON.stringify(value.envelope),new Date(now).toISOString(),owner.digest,owner.account_id,now,owner.account_id,value.expectedRevision).first();
   if(!row)return json({ok:false,error:'Conflicto o sesión revocada'},409);
   return json({...common,revision:row.revision},201);
  }
  if(route.kind==='reserve'){
   if(!exact(value,['kind','requestId'])||!Object.hasOwn(LIMIT,value.kind)||typeof value.requestId!=='string'||!/^[a-zA-Z0-9_-]{12,64}$/.test(value.requestId))return json({ok:false,error:'Reserva inválida'},400);
   const now=Date.now(),day=new Date(now).toISOString().slice(0,10);
   const existing=await db.prepare('SELECT 1 AS yes FROM coach_reservations_v115 WHERE account_id=? AND day=? AND kind=? AND request_id=?').bind(owner.account_id,day,value.kind,value.requestId).first();
   if(existing)return json({...common,reserved:true,alreadyReserved:true,kind:value.kind,day});
   const row=await db.prepare(`INSERT INTO coach_reservations_v115(account_id,day,kind,request_id,created_at)
    SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM auth_sessions_v111 WHERE token_digest=? AND account_id=? AND expires_at>?)
    AND (SELECT count(*) FROM coach_reservations_v115 WHERE account_id=? AND day=? AND kind=?)<?
    ON CONFLICT(account_id,day,kind,request_id) DO NOTHING RETURNING request_id`)
    .bind(owner.account_id,day,value.kind,value.requestId,new Date(now).toISOString(),owner.digest,owner.account_id,now,owner.account_id,day,value.kind,LIMIT[value.kind]).first();
   if(!row){const repeated=await db.prepare('SELECT 1 AS yes FROM coach_reservations_v115 WHERE account_id=? AND day=? AND kind=? AND request_id=?').bind(owner.account_id,day,value.kind,value.requestId).first();if(repeated)return json({...common,reserved:true,alreadyReserved:true,kind:value.kind,day});return json({ok:false,error:'Cuota de laboratorio alcanzada o sesión revocada'},429);}
   return json({...common,reserved:true,alreadyReserved:false,kind:value.kind,day},201);
  }
  return json({ok:false,error:'Ruta no disponible'},404);
 }catch{return json({ok:false,error:'Fallo de laboratorio Coach'},503);}
}
