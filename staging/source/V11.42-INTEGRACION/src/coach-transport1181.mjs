// Unmounted production candidate; no default connection to synthetic services.
import {validateInput,validateReply} from './coach-contract1185.mjs';
const check=(ok,m)=>{if(!ok)throw Error(m)},clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),valid=s=>s?.ok===true&&s.syntheticOnly===false&&typeof s.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>=16;
export async function createCoachTransport1181({origin,readSession,fetcher=fetch,now=Date.now,ttlMs=120000,timeoutMs=25000,newRequestId=()=>crypto.randomUUID()}){
 check(/^https:\/\/[a-z0-9.-]+$/.test(origin)&&typeof readSession==='function'&&typeof now==='function'&&Number.isInteger(ttlMs)&&ttlMs>=1000&&ttlMs<=300000&&Number.isInteger(timeoutMs)&&timeoutMs>=1&&timeoutMs<=30000&&typeof newRequestId==='function','Transporte inválido');
 const identity=await readSession();check(valid(identity),'Coach no disponible en esta cuenta');let closed=false,flight=false,pending=null,result=null,generation=0,activeAbort=null;
 async function verify(){check(!closed,'Coach cerrado');const s=await readSession();if(!valid(s)||s.accountId!==identity.accountId||s.csrf!==identity.csrf){closed=true;pending=null;result=null;throw Error('Cambió la sesión');}}
 function preview(input){check(!closed&&!flight,'Coach ocupado o cerrado');validateInput(input);const requestId=newRequestId();check(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(requestId),'Identificador de consulta inválido');pending={payload:clone(input),expiresAt:now()+ttlMs,requestId};result=null;return clone(pending);}
 function discard(){generation++;pending=null;result=null;activeAbort?.abort();}
 async function send(review,consent){
  check(!closed&&!flight&&pending&&consent===true&&eq(review,pending)&&now()<pending.expiresAt,'Revisá nuevamente el contexto y autorizá el envío');
  const approved=pending,epoch=generation;pending=null;result=null;flight=true;
  const controller=new AbortController();activeAbort=controller;let timer;try{const work=(async()=>{await verify();check(!controller.signal.aborted&&epoch===generation&&now()<approved.expiresAt,'Consentimiento vencido o descartado');
   const r=await fetcher(origin+'/coach/v1/suggest',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal,headers:{'Content-Type':'application/json','X-Asia-CSRF':identity.csrf,'X-Asia-Coach-Consent':'reviewed-v1','X-Asia-Coach-Request':approved.requestId},body:JSON.stringify(approved.payload)});
   check(r.ok&&/application\/json/i.test(r.headers.get('Content-Type')||'')&&r.body,'Coach no disponible');
   const reader=r.body.getReader(),parts=[];let n=0;try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>32000){await reader.cancel();throw Error('Respuesta demasiado grande')}parts.push(value)}}finally{reader.releaseLock()}
   const bytes=new Uint8Array(n);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length}const x=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
   check(x?.ok===true&&Object.keys(x).length===2&&Object.hasOwn(x,'reply'),'Respuesta inválida');const reply=validateReply(x.reply,approved.payload);await verify();
   check(!controller.signal.aborted&&epoch===generation&&now()<approved.expiresAt,'La revisión venció o se descartó durante la consulta');return {input:clone(approved.payload),reply:clone(reply),expiresAt:approved.expiresAt};})();
   const limit=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'))},Math.min(timeoutMs,Math.max(1,approved.expiresAt-now())))});const out=await Promise.race([work,limit]);check(epoch===generation&&!controller.signal.aborted,'Consulta descartada');result=out;return clone(result);
  }catch{result=null;throw Error('Consulta no completada. No se guardaron cambios.')}finally{clearTimeout(timer);controller.abort();activeAbort=null;flight=false}
 }
 async function take(reviewed){check(!closed&&!flight&&result&&eq(reviewed,result)&&now()<result.expiresAt,'La respuesta ya no está vigente');await verify();check(result&&eq(reviewed,result)&&now()<result.expiresAt,'La respuesta cambió');const out=clone(result);result=null;return out;}
 return Object.freeze({preview,send,take,discard,close(){closed=true;discard()},available:()=>!closed});
}
