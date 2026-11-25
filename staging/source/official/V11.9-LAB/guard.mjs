export const VERSION='11.0';
export const MARKER='asia-v11-staging-110';
export function json(value,status=200,extra={}){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});}
const validSecret=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{43,128}$/.test(s);
async function same(a,b){const enc=new TextEncoder();const [x,y]=await Promise.all([a,b].map(s=>crypto.subtle.digest('SHA-256',enc.encode(s))));let n=0;const u=new Uint8Array(x),v=new Uint8Array(y);for(let i=0;i<u.length;i++)n|=u[i]^v[i];return n===0;}
// In Workers, a POST with zero bytes may still expose a non-null ReadableStream.
// Read only enough to distinguish a genuinely empty request from a supplied body.
export async function emptyBody110(request){
 const declared=request.headers.get('Content-Length');
 if(declared!==null&&declared!=='0')return false;
 if(request.body===null)return true;
 let reader;
 try{
  reader=request.body.getReader();
  for(let i=0;i<8;i++){
   const {done,value}=await reader.read();
   if(done)return true;
   if(value?.byteLength)return false;
  }
  return false;
 }catch{return false}
 finally{if(reader){try{await reader.cancel();}catch{}try{reader.releaseLock();}catch{}}}
}
// Reused by V11.1 test-account routes; no CORS and no public registration.
export async function checkOperator110(request,env,secretName){
 if(env?.STAGING_MODE!==MARKER||!validSecret(env?.[secretName]))return json({ok:false,error:'Staging no configurado'},503);
 if(request.headers.has('Origin'))return json({ok:false,error:'Origen no admitido'},403);
 const bearer=request.headers.get('Authorization')||'';
 if(!bearer.startsWith('Bearer ')||!validSecret(bearer.slice(7))||!await same(bearer.slice(7),env[secretName]))return json({ok:false,error:'No autorizado'},401,{'WWW-Authenticate':'Bearer'});
 return null;
}
export async function guard(request,env,secretName){
 const denied=await checkOperator110(request,env,secretName);if(denied)return denied;
 const url=new URL(request.url);
 if(url.search||!await emptyBody110(request))return json({ok:false,error:'No se admiten parámetros ni cuerpos'},400);
 return null;
}
export function unavailable(){return json({ok:false,error:'Recurso no disponible en V11.0'},404);}
