// No live upstream. The only inference provider is a deterministic synthetic response.
import {createWorker} from '../../V11.38-INTEGRACION/src/worker.mjs';
const reads=new Set(['health','workouts']),inferences=new Set(['coach','chat','diet','weekly','training']);
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const error=(status)=>json({ok:false,error:'SERVICIO_NO_DISPONIBLE'},status);
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
async function body(request){
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('Content-Type')||'')||!request.body)throw Error('body');
 const reader=request.body.getReader(),parts=[];let n=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>100000){await reader.cancel();throw Error('size')}parts.push(value)}
 const raw=new Uint8Array(n);let offset=0;for(const p of parts){raw.set(p,offset);offset+=p.length}
 const x=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));if(!plain(x)||JSON.stringify(x).length>25000)throw Error('shape');
 // Reject credentials, image fields and caller identity anywhere in the submitted context.
 const walk=[x];let count=0;while(walk.length){const a=walk.pop();if(++count>50000)throw Error('shape');if(a&&typeof a==='object')for(const [k,v] of Object.entries(a)){if(/^(?:__proto__|constructor|prototype|accountId|account_id|userId|authorization|token|password|secret|apiKey|image|images)$/i.test(k))throw Error('field');walk.push(v)}else if(typeof a==='string'&&a.startsWith('data:image/'))throw Error('image')}
 return x;
 }finally{reader.releaseLock()}
}
export function createServiceWorker({assets,provider,fetchImpl=fetch}={}){
 const original=createWorker({assets,provider,fetchImpl});
 return {async fetch(request,env){
  const u=new URL(request.url),prefix='/v11.39/services/';
  if(!u.pathname.startsWith(prefix))return original.fetch(request,env);
  if(env.STAGING_ALLOW_V1139_TESTS!=='true'||u.origin!==env.STAGING_ORIGIN||u.search||['X-Asia-Account','X-Account-ID','X-User-ID','Authorization'].some(k=>request.headers.has(k)))return error(403);
  const kind=u.pathname.slice(prefix.length),reading=reads.has(kind);
  if(!reading&&!inferences.has(kind))return error(404);
  const cookie=request.headers.get('cookie')||'';
  async function auth(){const r=await original.fetch(new Request(u.origin+'/v11.11/auth/me',{headers:{Cookie:cookie}}),env);return r.ok?await r.json():null}
  try{
   const s=await auth();if(s?.ok!==true||s.syntheticOnly!==true||!/^acct_[a-f0-9]{32}$/.test(s.accountId))return error(401);
   const current=async()=>{const a=await auth();return a?.accountId===s.accountId&&a.csrf===s.csrf};
   if(reading){
    if(request.method!=='GET'||request.body!==null||!provider)return error(405);
    const rows=await provider.read(s.accountId,kind);if(!await current())return error(401);
    if(!Array.isArray(rows)||rows.length>10000||JSON.stringify(rows).length>1000000)return error(503);
    return json({ok:true,syntheticOnly:true,[kind==='health'?'records':'workouts']:rows});
   }
   if(request.method!=='POST')return error(405);
   if(request.headers.get('Origin')!==env.STAGING_ORIGIN||request.headers.get('X-Asia-CSRF')!==s.csrf)return error(403);
   let x;try{x=await body(request)}catch{return error(400)}
   if(kind==='coach'?!(typeof x.mode==='string'&&typeof x.question==='string'&&plain(x.context)&&Array.isArray(x.conversation)):!plain(x.data))return error(400);
   if(!await current())return error(401);
   // No provider call, no quota/billing claim, no persistence of submitted context.
   const answer='[SIMULACIÓN STAGING] Respuesta técnica de prueba; no es una recomendación de IA.';
   return json({ok:true,syntheticOnly:true,model:'fixture-sintético',remaining:0,result:kind==='coach'?{answer,proposal:null}:answer});
  }catch{return error(503)}
 }};
}
