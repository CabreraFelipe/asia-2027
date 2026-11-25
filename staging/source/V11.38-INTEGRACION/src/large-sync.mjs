// Synthetic-only append-only encrypted objects. D1 index is the publication point.
export const MAX_BYTES=41000000;
const check=(x,m)=>{if(!x)throw Error(m)};
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const bytes=s=>new TextEncoder().encode(s);
export async function hashBytes(b){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join('')}
const b64=(s,n)=>typeof s==='string'&&s.length===n&&/^[A-Za-z0-9+/]+={0,2}$/.test(s);
export function validLargeEnvelope(e){
 return exact(e,['format','salt','iv','cipher'])&&e.format==='asia84-encrypted-v1'&&b64(e.salt,24)&&/^[A-Za-z0-9+/]{22}==$/.test(e.salt)&&b64(e.iv,16)&&typeof e.cipher==='string'&&e.cipher.length>=24&&e.cipher.length<=40000024&&e.cipher.length%4===0&&/^[A-Za-z0-9+/]+={0,2}$/.test(e.cipher)&&bytes(JSON.stringify(e)).length<=MAX_BYTES;
}
async function bounded(request){
 check(/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')||'')&&request.body,'Cuerpo inválido');
 const length=request.headers.get('content-length');check(length===null||/^\d+$/.test(length)&&Number(length)<=MAX_BYTES+128,'Límite excedido');
 const reader=request.body.getReader(),chunks=[];let n=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>MAX_BYTES+128){await reader.cancel();throw Error('Límite excedido')}chunks.push(value)}
 const out=new Uint8Array(n);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(out))}
 finally{reader.releaseLock()}
}
const headers={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'};
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers});
const err=(status,error)=>json({ok:false,error},status);
export async function handleLargeSync(request,{db,bucket,session,validWrite,enabled=false,now=Date.now}){
 if(!enabled||!bucket||typeof bucket.put!=='function')return err(403,'DESACTIVADO');
 if(!session||!/^acct_[a-f0-9]{32}$/.test(session.id)||!session.digest)return err(401,'NO_AUTORIZADO');
 const u=new URL(request.url),match=/^\/v11\.38\/sync(?:\/([1-9]\d{0,2}))?$/.exec(u.pathname);
 if(!match||u.search||['X-Asia-Account','X-Account-ID','X-User-ID'].some(k=>request.headers.has(k)))return err(404,'RUTA_INVALIDA');
 const revision=match[1]?Number(match[1]):null;
 if(revision>200||!['GET','POST'].includes(request.method)||revision&&request.method!=='GET')return err(405,'METODO_INVALIDO');
 const liveSQL='EXISTS(SELECT 1 FROM auth_oidc_sessions_v1111 WHERE token_digest=? AND account_id=? AND expires_at>?)',args=()=>[session.digest,session.id,now()];
 async function live(){return !!(await db.prepare('SELECT 1 AS yes WHERE '+liveSQL).bind(...args()).first())}
 try{
  if(!await live())return err(401,'NO_AUTORIZADO');
  if(request.method==='GET'){
   if(request.body!==null)return err(400,'CUERPO_INVALIDO');
   if(!revision){const rows=(await db.prepare('SELECT revision,bytes,created_at FROM sync_v1138_objects WHERE account_id=? AND '+liveSQL+' ORDER BY revision DESC LIMIT 20').bind(session.id,...args()).all()).results||[];return json({ok:true,head:rows[0]?.revision||0,versions:rows})}
   const row=await db.prepare('SELECT * FROM sync_v1138_objects WHERE account_id=? AND revision=? AND '+liveSQL).bind(session.id,revision,...args()).first();
   if(!row)return err(404,'NO_ENCONTRADA');
   const object=await bucket.get(row.object_key);
   if(!object||object.size!==row.bytes||row.bytes>MAX_BYTES)return err(503,'COPIA_CORRUPTA');
   const raw=new Uint8Array(await object.arrayBuffer());if(raw.length!==row.bytes||await hashBytes(raw)!==row.sha256)return err(503,'COPIA_CORRUPTA');
   const envelope=JSON.parse(new TextDecoder().decode(raw));if(!validLargeEnvelope(envelope))return err(503,'COPIA_CORRUPTA');
   if(!await live())return err(401,'NO_AUTORIZADO');
   return json({ok:true,revision,envelope,created_at:row.created_at});
  }
  if(!validWrite(request))return err(403,'CSRF_INVALIDO');
  let input;try{input=await bounded(request)}catch{return err(400,'CUERPO_INVALIDO')}
  if(!exact(input,['expectedRevision','envelope'])||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||input.expectedRevision>=200||!validLargeEnvelope(input.envelope))return err(400,'SOBRE_INVALIDO_O_CUOTA');
  if(!await live())return err(401,'NO_AUTORIZADO');
  const raw=bytes(JSON.stringify(input.envelope)),sha=await hashBytes(raw),key='synthetic-sync-v1138/'+session.id+'/'+crypto.randomUUID();
  // Unique object; never replace an earlier revision. No delete on ambiguous D1 outcome.
  await bucket.put(key,raw);
  const stamp=now(),row=await db.prepare('INSERT INTO sync_v1138_objects(account_id,revision,object_key,bytes,sha256,created_at) SELECT ?,?,?,?,?,? WHERE '+liveSQL+' AND COALESCE((SELECT MAX(revision) FROM sync_v1138_objects WHERE account_id=?),0)=? RETURNING revision').bind(session.id,input.expectedRevision+1,key,raw.length,sha,new Date(stamp).toISOString(),...args(),session.id,input.expectedRevision).first();
  if(!row){try{await bucket.delete(key)}catch{}return err(409,'CONFLICTO_O_REVOCADA')}
  return json({ok:true,revision:row.revision},201);
 }catch{return err(503,'ALMACENAMIENTO_NO_DISPONIBLE')}
}
