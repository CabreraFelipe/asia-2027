// Parent-session capability; never mount in a synthetic account.
import {validatePlanFile,validateExtractedPlan} from './document-plan-import.mjs';
const check=(v,m)=>{if(!v)throw Error(m)},valid=s=>s?.ok===true&&s.syntheticOnly===false&&typeof s.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>=16;
export async function openDocumentImportClient({enabled=false,origin,readSession,fetcher=fetch,timeoutMs=30000}={}){
 check(enabled===true&&typeof origin==='string'&&new URL(origin).origin===origin&&origin.startsWith('https://')&&typeof readSession==='function'&&typeof fetcher==='function'&&Number.isInteger(timeoutMs)&&timeoutMs>=1&&timeoutMs<=60000,'Importación no disponible');
 const initial=await readSession();check(valid(initial),'Sesión inválida');const {accountId,csrf}=initial;
 let closed=false,busy=false,epoch=0,abort=null;
 function discard(){epoch++;abort?.abort()}
 function close(){closed=true;discard()}
 async function verify(){check(!closed,'Importación cerrada');let s;try{s=await readSession()}catch{close();throw Error('Sesión no verificable')}if(!valid(s)||s.accountId!==accountId||s.csrf!==csrf){close();throw Error('Cambió la sesión')}check(!closed,'Importación cerrada')}
 async function analyze(file,consent){
  check(!closed&&!busy&&consent===true,'Autorizá el análisis de este archivo');const safe=validatePlanFile(file),mark=epoch,controller=new AbortController();abort=controller;busy=true;let timer;
  try{
   const work=(async()=>{await verify();check(mark===epoch&&!controller.signal.aborted,'Análisis descartado');
    const r=await fetcher(origin+'/v12/import/plan',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal,headers:{'Content-Type':safe.mime,'X-Asia-CSRF':csrf,'X-Asia-Import-Consent':'reviewed-v1','X-Asia-Import-Request':crypto.randomUUID()},body:safe.bytes});
    check(r.ok&&r.body&&/application\/json/i.test(r.headers.get('Content-Type')||''),'Análisis no disponible');
    const reader=r.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});let text='',n=0;
    try{for(;;){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;check(n<=150000,'Respuesta demasiado grande');text+=decoder.decode(value,{stream:true})}}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
    const x=JSON.parse(text+decoder.decode());check(x?.ok===true&&Object.keys(x).length===2&&Object.hasOwn(x,'plan'),'Respuesta inválida');
    const plan=validateExtractedPlan(x.plan);await verify();check(mark===epoch&&!controller.signal.aborted,'Análisis descartado');return plan;
   })();
   const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'))},timeoutMs)});
   return await Promise.race([work,timeout]);
  }finally{clearTimeout(timer);controller.abort();abort=null;busy=false;safe.bytes.fill(0)}
 }
 await verify();return Object.freeze({mode:'provider',analyze,discard,close,available:()=>!closed});
}
