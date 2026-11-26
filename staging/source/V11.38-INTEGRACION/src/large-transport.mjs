// Standalone transport for the next integration. Separate namespace from V11.25.
import {validLargeEnvelope,MAX_BYTES} from './large-sync.mjs';
export function createLargeTransport({origin,readSession,fetcher=fetch,managedWrite=false,legacySeed=false}){
 if(managedWrite&&legacySeed)throw Error('Modo de escritura incompatible');
 if(!/^https:\/\/asia-v1111-identity-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin))throw Error('Origen inválido');
 return async(method,body=null,revision=null)=>{
  if(!['GET','POST'].includes(method)||revision!==null&&(!Number.isSafeInteger(revision)||revision<1||revision>200||method!=='GET')||method==='GET'&&body!==null||method==='POST'&&(!body||!validLargeEnvelope(body.envelope)))throw Error('Solicitud inválida');
  if(legacySeed&&(method!=='POST'||body.expectedRevision!==0))throw Error('Solo copia inicial');
  const s=await readSession(),r=await fetcher(origin+'/v11.38/sync'+(revision===null?'':'/'+revision),{method,credentials:'same-origin',cache:'no-store',redirect:'error',headers:method==='POST'?{'Content-Type':'application/json','X-Asia-CSRF':s.csrf,...(managedWrite?{'X-Asia-Key-Epoch':'managed-v1'}:legacySeed?{'X-Asia-Key-Epoch':'legacy-seed-v1'}:{})}:{},...(method==='POST'?{body:JSON.stringify(body)}:{})});
  const after=await readSession();if(s.accountId!==after.accountId||s.csrf!==after.csrf)throw Error('La sesión cambió');
  if(!r.ok){const e=Error('Sincronización no completada');e.status=r.status;throw e}
  const x=await r.json();if(x.ok!==true||revision!==null&&(!validLargeEnvelope(x.envelope)||x.revision!==revision))throw Error('Respuesta inválida');
  if(method==='GET'&&revision===null&&(!Array.isArray(x.versions)||x.versions.some(v=>v.bytes>MAX_BYTES)))throw Error('Índice inválido');
  return x;
 };
}
