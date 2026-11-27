// Unmounted authenticated file route. The host must provide a durable import-specific quota.
import {extractDocumentPlan} from './document-plan-import.mjs';
import {requestId1186} from './coach-quota1186.mjs';
const limit=10*1024*1024,valid=s=>s?.ok===true&&s.syntheticOnly===false&&typeof s.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>=16;
const headers={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const reply=(status,data={ok:false})=>new Response(JSON.stringify(data),{status,headers});
async function bytes(request){
 if(!request.body)throw Error('file');
 const size=request.headers.get('Content-Length');if(size!==null&&(!/^\d+$/.test(size)||Number(size)>limit))throw Error('size');
 const rd=request.body.getReader(),parts=[];let n=0;
 try{for(;;){const {done,value}=await rd.read();if(done)break;n+=value.byteLength;if(n>limit){await rd.cancel();throw Error('size')}parts.push(value)}const result=new Uint8Array(n);let i=0;for(const part of parts){result.set(part,i);i+=part.length}return result}finally{rd.releaseLock()}
}
export function createDocumentImportGateway({enabled=false,origin,authenticate,reserve,provider}={}){
 if(enabled!==true||typeof origin!=='string'||new URL(origin).origin!==origin||!origin.startsWith('https://')||typeof authenticate!=='function'||typeof reserve!=='function'||typeof provider?.extract!=='function')throw Error('Importación no habilitada');
 return Object.freeze({async fetch(request){
  let file;
  try{
   const u=new URL(request.url),mime=request.headers.get('Content-Type'),requestId=request.headers.get('X-Asia-Import-Request');
   if(u.origin!==origin||u.pathname!=='/v12/import/plan'||u.search||request.method!=='POST'||request.headers.get('Origin')!==origin||request.headers.get('Sec-Fetch-Site')==='cross-site'||['Authorization','X-Asia-Account','X-Account-ID','X-User-ID'].some(k=>request.headers.has(k)))return reply(403);
   const s=await authenticate(request);if(!valid(s))return reply(401);
   const account=s.accountId,csrf=s.csrf;
   if(request.headers.get('X-Asia-CSRF')!==csrf||request.headers.get('X-Asia-Import-Consent')!=='reviewed-v1')return reply(403);
   if(!['application/pdf','image/jpeg','image/png'].includes(mime)||!requestId1186(requestId))return reply(400);
   try{file=await bytes(request)}catch(e){return reply(e.message==='size'?413:400)}
   const readSession=async()=>{const f=await authenticate(request);return valid(f)&&f.accountId===account&&f.csrf===csrf?f:null};
   if(!await readSession())return reply(401);
   if(await reserve(account,requestId)!==true)return reply(429);
   const plan=await extractDocumentPlan({enabled:true,consent:true,file:{mime,bytes:file},readSession,extract:f=>provider.extract(f)});
   if(!await readSession())return reply(401);
   return reply(200,{ok:true,plan});
  }catch{return reply(503)}finally{file?.fill(0)}
 }});
}
