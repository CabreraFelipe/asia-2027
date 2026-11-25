// Adapter matching the original backup844/autoBackup846 request(method,body,id) contract.
// Same origin only; credentials never stored and no historic bearer token accepted.
export function createIntegralRequest({fetcher=fetch,origin,csrf,stillCurrent=()=>true}){
 if(typeof origin!=='string'||new URL(origin).origin!==origin||!origin.startsWith('https://')||typeof csrf!=='string'||!csrf||typeof stillCurrent!=='function')throw Error('Sesión inválida');
 return async function request(method,body=null,id=null){
  if(!stillCurrent())throw Error('Sesión finalizada');
  if(!['GET','POST'].includes(method)||id!==null&&(!Number.isSafeInteger(id)||id<1||method!=='GET')||method==='GET'&&body!==null||method==='POST'&&!body)throw Error('Solicitud inválida');
  const r=await fetcher(origin+'/v11.25/data/integral'+(id===null?'':'/'+id),{method,credentials:'same-origin',cache:'no-store',redirect:'error',headers:method==='POST'?{'Content-Type':'application/json','X-Asia-CSRF':csrf}:{},...(method==='POST'?{body:JSON.stringify(body)}:{})});
  if(!stillCurrent())throw Error('Sesión finalizada');
  if(!r.ok){const e=Error('No se completó la operación de respaldo');e.status=r.status;throw e;}
  return r.json();
 };
}
