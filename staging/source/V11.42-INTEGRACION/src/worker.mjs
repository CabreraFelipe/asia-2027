// Isolated synthetic pilot only. The asset binding MUST run behind this Worker.
import {createServiceWorker} from '../../V11.39-INTEGRACION/src/service-worker.mjs';
import {handleManagedKey} from './managed-key1152.mjs';
const scope='/v11.42/',home=scope+'index.html',pub=new Set(['index.html','manifest.json','shell.css','entry.js','sw.js','offline.html','asia-icon-v4-192.png','asia-icon-v4-512.png','asia-icon-v4-180.png'].map(p=>scope+p));
const originPattern=/^https:\/\/asia-v1142-candidate-staging\.[a-z0-9-]+\.workers\.dev$/;
const common={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'};
const csp=diary=>"default-src 'self'; script-src 'self'"+(diary?" 'unsafe-inline'":"")+"; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:"+(diary?" https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/":"")+"; media-src 'self' data: blob:; connect-src "+(diary?"'none'":"'self'")+"; worker-src "+(diary?"'none'":"'self'")+"; object-src 'none'; frame-src "+(diary?"'none'":"'self'")+"; frame-ancestors "+(diary?"'self'":"'none'")+"; form-action 'none'; base-uri 'none'";
const deny=status=>new Response(null,{status,headers:common});
export function createPwaWorker({assetPaths,fetchImpl=fetch}={}){
 const original=createServiceWorker({provider:{read:async()=>[]},fetchImpl});
 return {async fetch(request,env){
  const u=new URL(request.url),p=u.pathname;
  if(env.STAGING_ALLOW_V1142_TESTS!=='true'||!originPattern.test(env.STAGING_ORIGIN||'')||u.origin!==env.STAGING_ORIGIN||!env.STAGING_PWA_ASSETS||['X-Asia-Account','X-Account-ID','X-User-ID','Authorization'].some(k=>request.headers.has(k)))return deny(403);
  if((p==='/'||p===scope)&&request.method==='GET'&&!u.search)return new Response(null,{status:303,headers:{...common,Location:home}});
  if(['/v11.11/auth/start','/v11.11/auth/callback','/v11.11/auth/me','/v11.11/auth/renew','/v11.11/auth/logout'].includes(p)){
   const r=await original.fetch(request,env);
   if(p.endsWith('/callback')&&r.status===303){const h=new Headers(r.headers);h.set('Location',home);return new Response(null,{status:303,headers:h})}return r;
  }
  if(p==='/v11.52/account-key')return handleManagedKey(request,env,{authenticate:async()=>{const r=await original.fetch(new Request(u.origin+'/v11.11/auth/me',{headers:{Cookie:request.headers.get('Cookie')||''}}),env);return r.ok?await r.json():null}});
  if(p==='/v11.38/sync'||/^\/v11\.38\/sync\/[1-9]\d{0,2}$/.test(p)||/^\/v11\.39\/services\/(health|workouts|coach|chat|diet|weekly|training)$/.test(p))return original.fetch(request,env);
  if(request.method!=='GET'||request.body!==null)return deny(405);
  if(u.search&&!/^\?v=\d{1,8}$/.test(u.search)||!assetPaths.has(p))return deny(404);
  if(!pub.has(p)){
   const r=await original.fetch(new Request(u.origin+'/v11.11/auth/me',{headers:{Cookie:request.headers.get('Cookie')||''}}),env);
   if(!r.ok)return deny(r.status);const s=await r.json();if(s.ok!==true||s.syntheticOnly!==true||!/^acct_[a-f0-9]{32}$/.test(s.accountId))return deny(401);
  }
  const a=await env.STAGING_PWA_ASSETS.fetch(new Request(u.origin+p));if(!a.ok)return deny(a.status);
  const h=new Headers(a.headers);for(const [k,v] of Object.entries(common))h.set(k,v);h.set('Content-Security-Policy',csp(p.includes('/diary/')));
  if(p===scope+'sw.js')h.set('Service-Worker-Allowed',scope);
  return new Response(a.body,{status:200,headers:h});
 }};
}
