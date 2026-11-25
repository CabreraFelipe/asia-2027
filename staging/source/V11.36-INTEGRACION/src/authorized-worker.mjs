// Candidate route wrapper, not deployed. Reuses real V11.24 identity; no public asset fallback.
import {createWorker1111} from '../../official/V11.24-STAGING/src/worker1124.mjs';
import {digest} from '../../official/V11.24-STAGING/src/security1111.mjs';
import {handleIntegral} from '../../V11.25-INTEGRACION/src/integral-v106.mjs';
const prefix='/v11.36/candidate/',route='/v11.25/data/integral';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'"};
const error=(status)=>new Response(null,{status,headers});
export function createAuthorizedWorker({assets=new Map(),fetchImpl=fetch}={}){
 const original=createWorker1111({fetchImpl});
 return {async fetch(request,env){
  const url=new URL(request.url),p=url.pathname,isAsset=p.startsWith(prefix),isSync=p===route||p.startsWith(route+'/');
  if(!isAsset&&!isSync)return original.fetch(request,env);
  if(env.STAGING_ALLOW_SYNC_V1136_TESTS!=='true'||url.origin!==env.STAGING_ORIGIN||url.search||['X-Asia-Account','X-Account-ID','X-User-ID'].some(k=>request.headers.has(k)))return error(403);
  const cookie=request.headers.get('cookie')||'';
  const response=await original.fetch(new Request(url.origin+'/v11.11/auth/me',{headers:{Cookie:cookie}}),env);
  if(!response.ok)return error(response.status);
  const s=await response.json();
  if(s.ok!==true||s.syntheticOnly!==true||!/^acct_[a-f0-9]{32}$/.test(s.accountId)||typeof s.csrf!=='string'||!s.csrf)return error(403);
  if(isAsset){
   if(request.method!=='GET'||request.body!==null)return error(405);
   // Only build-supplied assets, not arbitrary filesystem paths. No service worker.
   const name=p.slice(prefix.length);
   if(!/^[a-zA-Z0-9_.-]+$/.test(name)||name==='sw.js'||name==='manifest.json')return error(404);
   const asset=assets.get(name);if(!asset)return error(404);
   return new Response(asset.body,{headers:{...headers,'Content-Type':asset.type}});
  }
  const tokens=cookie.split(';').map(x=>x.trim()).filter(x=>x.startsWith('__Host-asia1111_session='));
  if(tokens.length!==1)return error(401);
  const token=tokens[0].split('=')[1];if(!/^[A-Za-z0-9_-]{43}$/.test(token))return error(401);
  return handleIntegral(request,{db:env.STAGING_DB,session:{id:s.accountId,digest:await digest(token)},validWrite:r=>r.headers.get('Origin')===env.STAGING_ORIGIN&&r.headers.get('X-Asia-CSRF')===s.csrf,enabled:true});
 }};
}
