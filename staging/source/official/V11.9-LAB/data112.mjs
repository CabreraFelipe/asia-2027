// Asia Platform V11.2 — operator-only, synthetic-account, encrypted snapshot test API.
// This is NOT a public/user-facing backup service and must never handle real data.
// Ownership is resolved from a DB-validated session (not a header/path/body account ID).
import {checkOperator110,json,emptyBody110} from './guard.mjs';
import {verifyAuthDb111,sessionOwner112} from './auth111.mjs';

const ROOT='/v11/data/snapshots';
const MAX_REQUEST=900000; // Below D1's 2 MB string/row limit; lab data only.
const MAX_REVISIONS=20; // Lab quota: at most 20 versions per synthetic account.
const ERR_SERVER={ok:false,error:'No se pudo procesar el respaldo de pruebas'};
const ERR_INVALID={ok:false,error:'Formato de sobre cifrado inválido'};
const SUCCESS={ok:true,version:'11.2',environment:'staging',scope:'synthetic-account',personalData:false};
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exactKeys=(x,keys)=>isObj(x)&&Object.keys(x).sort().join(',')===keys.slice().sort().join(',');
const isB64=s=>typeof s==='string'&&s.length%4===0&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s);
function validEnvelope112(v){
 if(!exactKeys(v,['format','salt','iv','cipher'])||v.format!=='asia84-encrypted-v1')return false;
 if(!isB64(v.salt)||v.salt.length!==24||!isB64(v.iv)||v.iv.length!==16)return false;
 if(!isB64(v.cipher)||v.cipher.length<24||v.cipher.length>MAX_REQUEST)return false;
 try{
  if(atob(v.salt).length!==16||atob(v.iv).length!==12)return false;
  // AES-GCM ciphertext must contain at least a 16-byte authentication tag.
  const decodedLength=v.cipher.length/4*3-(v.cipher.endsWith('==')?2:v.cipher.endsWith('=')?1:0);
  return decodedLength>=16;
 }catch{return false;}
}
async function parseBody112(request){
 const ct=request.headers.get('content-type')||'';
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(ct))return {error:415};
 const declared=request.headers.get('content-length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>MAX_REQUEST))return {error:413};
 if(!request.body)return {error:400};
 const reader=request.body.getReader(),pieces=[];let size=0;
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;
   size+=value.byteLength;if(size>MAX_REQUEST){await reader.cancel();return {error:413};}
   pieces.push(value);
  }
  if(!size)return {error:400};
  const raw=new Uint8Array(size);let at=0;for(const p of pieces){raw.set(p,at);at+=p.length;}
  const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
  if(!exactKeys(data,['expectedRevision','envelope'])||!Number.isSafeInteger(data.expectedRevision)||data.expectedRevision<0||data.expectedRevision>=MAX_REVISIONS||!validEnvelope112(data.envelope))return {error:400};
  return {value:data};
 }catch{return {error:400};}
 finally{try{reader.releaseLock();}catch{}}
}
function validatePath112(path){
 if(path===ROOT)return {kind:'collection'};
 if(path.startsWith(ROOT+'/')){
  const part=path.slice(ROOT.length+1);
  if(!/^[1-9][0-9]{0,4}$/.test(part))return null;
  const revision=Number(part);if(revision>MAX_REVISIONS)return null;
  return {kind:'single',revision};
 }
 return null;
}
export async function dataRoute112(request,env){
 // Required on every route, even when called with a session token.
 const operator=await checkOperator110(request,env,'STAGING_API_TOKEN');if(operator)return operator;
 const url=new URL(request.url);if(url.search)return json({ok:false,error:'No se admiten parámetros'},400);
 if(['X-Asia-Account','X-Account-ID','X-User-ID'].some(h=>request.headers.has(h)))return json({ok:false,error:'No se admite un identificador de cuenta del cliente'},400);
 const route=validatePath112(url.pathname);if(!route)return json({ok:false,error:'Ruta no disponible'},404);
 const allow=route.kind==='collection'?'GET, POST':'GET';
 if(route.kind==='single'&&request.method!=='GET'||route.kind==='collection'&&!['GET','POST'].includes(request.method))return json({ok:false,error:'Método no admitido'},405,{Allow:allow});
 if(!await verifyAuthDb111(env))return json({ok:false,error:'Staging no verificado'},503);
 try{
  const owner=await sessionOwner112(request,env);
  if(!owner)return json({ok:false,error:'Sesión inexistente, vencida o revocada'},401);
  const db=env.STAGING_DB;
  if(request.method==='GET'){
   if(!await emptyBody110(request))return json({ok:false,error:'No se admite un cuerpo'},400);
   if(route.kind==='single'){
    const row=await db.prepare('SELECT revision,created_at,envelope FROM encrypted_snapshots_v11 WHERE account_id=? AND revision=?').bind(owner.account_id,route.revision).first();
    if(!row)return json({ok:false,error:'Revisión no encontrada'},404);
    // Malformed/corrupted stored envelope never goes back to a client.
    let envelope;try{envelope=JSON.parse(row.envelope);}catch{return json(ERR_SERVER,503);}
    if(!validEnvelope112(envelope))return json(ERR_SERVER,503);
    return json({...SUCCESS,revision:row.revision,created_at:row.created_at,envelope});
   }
   const list=(await db.prepare('SELECT revision,created_at FROM encrypted_snapshots_v11 WHERE account_id=? ORDER BY revision DESC LIMIT 20').bind(owner.account_id).all()).results||[];
   return json({...SUCCESS,head:list[0]?.revision??0,versions:list});
  }
  const input=await parseBody112(request);
  if(input.error)return json(input.error===400?ERR_INVALID:{ok:false,error:'Solicitud demasiado grande o tipo incorrecto'},input.error);
  const {expectedRevision,envelope}=input.value;
  // Atomic per-account compare-and-swap AND session revalidation in the WRITE statement.
  // Concurrency cannot duplicate or overwrite revisions, even with simultaneous requests.
  const now=Date.now();
  const row=await db.prepare(`INSERT INTO encrypted_snapshots_v11(account_id,revision,envelope,created_at)
   SELECT ?,?,?,? WHERE EXISTS (
    SELECT 1 FROM auth_sessions_v111 WHERE token_digest=? AND account_id=? AND expires_at>?
   ) AND COALESCE((SELECT MAX(revision) FROM encrypted_snapshots_v11 WHERE account_id=?),0)=?
   RETURNING revision`).bind(owner.account_id,expectedRevision+1,JSON.stringify(envelope),new Date(now).toISOString(),owner.digest,owner.account_id,now,owner.account_id,expectedRevision).first();
  if(!row)return json({ok:false,error:'Conflicto de revisión o sesión revocada; consultá la versión vigente'},409);
  return json({...SUCCESS,revision:row.revision},201);
 }catch{
  return json(ERR_SERVER,503);
 }
}
