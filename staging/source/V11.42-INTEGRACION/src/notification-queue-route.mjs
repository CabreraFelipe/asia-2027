// Proposed route, intentionally not mounted in the synthetic Worker.
// The trusted host must supply a verified cookie session AND server-issued device binding.
import {openNotificationQueue} from './notification-queue.mjs';
const path='/v12/notifications/queue',limit=8192;
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'};
const response=(status,data)=>new Response(JSON.stringify(data),{status,headers});
const exact=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const valid=s=>s?.ok===true&&s.syntheticOnly===false&&typeof s.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.deviceId==='string'&&/^dev_[a-f0-9]{32}$/.test(s.deviceId)&&typeof s.csrf==='string'&&s.csrf.length>=16;
async function parseBody(request){
 if(!request.body||!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('Content-Type')||''))throw Error('invalid');
 const length=request.headers.get('Content-Length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>limit))throw Error('size');
 const reader=request.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});let count=0,text='';
 try{for(;;){const {done,value}=await reader.read();if(done)break;count+=value.byteLength;if(count>limit){await reader.cancel();throw Error('size')}text+=decoder.decode(value,{stream:true})}return JSON.parse(text+decoder.decode())}finally{reader.releaseLock()}
}
export async function handleNotificationQueue(request,{enabled=false,origin,db,authenticate,now=Date.now}={}){
 if(enabled!==true||typeof origin!=='string'||!/^https:\/\/[^/]+$/.test(origin)||typeof authenticate!=='function')return response(404,{ok:false});
 const u=new URL(request.url);
 if(u.origin!==origin||u.pathname!==path||u.search||['Authorization','X-Asia-Account','X-Account-ID','X-User-ID','X-Device-ID'].some(k=>request.headers.has(k)))return response(403,{ok:false});
 if(request.method!=='POST')return response(405,{ok:false});
 if(request.headers.get('Origin')!==origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return response(403,{ok:false});
 let s;try{s=await authenticate(request)}catch{return response(401,{ok:false})}
 if(!valid(s)||request.headers.get('X-Asia-CSRF')!==s.csrf)return response(403,{ok:false});
 let body;try{body=await parseBody(request)}catch(e){return response(e.message==='size'?413:400,{ok:false})}
 const read=exact(body,['op','channel'])&&body.op==='read',replace=exact(body,['op','channel','expected','events'])&&body.op==='replace';
 if(!(read||replace)||!['agenda','rest'].includes(body.channel))return response(400,{ok:false});
 let queue;try{
  // Revalidate against the identity checked before parsing; never accept a different session.
  const readSession=async()=>{const fresh=await authenticate(request);return valid(fresh)&&fresh.accountId===s.accountId&&fresh.deviceId===s.deviceId&&fresh.csrf===s.csrf?fresh:null};
  queue=await openNotificationQueue({enabled:true,db,readSession,now});
  const result=read?await queue.read(body.channel):await queue.replace(body.channel,body.expected,body.events);
  return response(200,{ok:true,...result});
 }catch{return response(409,{ok:false})}finally{queue?.close()}
}
