// V10.6 backup844-compatible persistence. This module is NOT deployed by this package.
// The caller must pass a server-verified session; never accept account IDs from request data.
const MAX=1_400_000, LIMIT=200, ROUTE='/v11.25/data/integral';
const headers={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
const error=(status,code)=>json({ok:false,error:code},status);
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const bytes=s=>new TextEncoder().encode(s).length;
function validBase64(s,min,max){if(typeof s!=='string'||s.length<min||s.length>max||s.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(s))return false;try{return btoa(atob(s))===s;}catch{return false;}}
export function validIntegralEnvelope(e){return exact(e,['format','salt','iv','cipher'])&&e.format==='asia84-encrypted-v1'&&validBase64(e.salt,24,24)&&atob(e.salt).length===16&&validBase64(e.iv,16,16)&&atob(e.iv).length===12&&validBase64(e.cipher,24,MAX)&&atob(e.cipher).length>=16&&bytes(JSON.stringify(e))<=MAX;}
async function boundedJSON(r){const ct=r.headers.get('content-type')||'',declared=r.headers.get('content-length');if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(ct)||!r.body||declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>MAX+128))throw Error('BODY');const reader=r.body.getReader();let length=0;const chunks=[];try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX+128){await reader.cancel();throw Error('SIZE');}chunks.push(value);}const result=new Uint8Array(length);let offset=0;for(const c of chunks){result.set(c,offset);offset+=c.length;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(result));}finally{reader.releaseLock();}}
export async function handleIntegral(request,{db,session,validWrite,now=Date.now,enabled=false}){
 if(!enabled)return error(403,'INTEGRACION_DESACTIVADA');
 const url=new URL(request.url),part=url.pathname.slice(ROUTE.length);
 if((url.pathname!==ROUTE&&!url.pathname.startsWith(ROUTE+'/'))||url.search)return error(404,'RUTA_INVALIDA');
 if(['X-Asia-Account','X-Account-ID','X-User-ID'].some(k=>request.headers.has(k)))return error(403,'CUENTA_INVALIDA');
 if(!session||!/^acct_[a-f0-9]{32}$/.test(session.id)||typeof session.digest!=='string'||!session.digest)return error(401,'NO_AUTORIZADO');
 const revision=part&&/^\/[1-9]\d{0,15}$/.test(part)?Number(part.slice(1)):null;
 if(part&&(!Number.isSafeInteger(revision)||revision<=0))return error(404,'RUTA_INVALIDA');
 if((part&&request.method!=='GET')||(!part&&!['GET','POST'].includes(request.method)))return error(405,'METODO_INVALIDO');
 if(request.method==='GET'&&request.body!==null)return error(400,'CUERPO_INVALIDO');
 // The session is rechecked in the query to prevent read/write after revocation.
 const sessionSQL='EXISTS(SELECT 1 FROM auth_oidc_sessions_v1111 WHERE token_digest=? AND account_id=? AND expires_at>?)';
 const stamp=now(),args=[session.digest,session.id,stamp];
 try{
  if(request.method==='GET'){
   const live=await db.prepare(`SELECT 1 AS yes WHERE ${sessionSQL}`).bind(...args).first();if(!live)return error(401,'NO_AUTORIZADO');
   if(part){const row=await db.prepare(`SELECT revision,envelope,bytes,created_at FROM integral_v106_backups WHERE account_id=? AND revision=? AND ${sessionSQL}`).bind(session.id,revision,...args).first();if(!row)return error(404,'NO_ENCONTRADA');let envelope;try{envelope=JSON.parse(row.envelope);}catch{return error(503,'COPIA_CORRUPTA');}if(!validIntegralEnvelope(envelope)||bytes(row.envelope)!==row.bytes)return error(503,'COPIA_CORRUPTA');return json({ok:true,revision:row.revision,envelope,created_at:row.created_at});}
   const rows=await db.prepare(`SELECT revision,created_at,bytes FROM integral_v106_backups WHERE account_id=? AND ${sessionSQL} ORDER BY revision DESC LIMIT 20`).bind(session.id,...args).all();const versions=rows.results||[];return json({ok:true,head:versions[0]?.revision||0,versions});
  }
  if(!validWrite(request))return error(403,'CSRF_INVALIDO');
  let input;try{input=await boundedJSON(request);}catch{return error(400,'CUERPO_INVALIDO');}
  if(!exact(input,['expectedRevision','envelope'])||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||input.expectedRevision>=LIMIT||!validIntegralEnvelope(input.envelope))return error(400,'SOBRE_INVALIDO_O_CUOTA');
  const envelope=JSON.stringify(input.envelope),writeTime=now();
  const row=await db.prepare(`INSERT INTO integral_v106_backups(account_id,revision,envelope,bytes,created_at) SELECT ?,?,?,?,? WHERE ${sessionSQL} AND COALESCE((SELECT MAX(revision) FROM integral_v106_backups WHERE account_id=?),0)=? RETURNING revision`).bind(session.id,input.expectedRevision+1,envelope,bytes(envelope),new Date(writeTime).toISOString(),session.digest,session.id,writeTime,session.id,input.expectedRevision).first();
  return row?json({ok:true,revision:row.revision},201):error(409,'CONFLICTO_O_SESION_REVOCADA');
 }catch{return error(503,'BASE_NO_DISPONIBLE');}
}
