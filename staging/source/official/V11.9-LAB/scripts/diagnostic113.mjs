// V11.3: READ-ONLY remote reachability and unauthorized-access smoke.
// Does not need/rotate secrets and does NOT create accounts or access private data.
const endpoints=[
 ['API','https://asia-v11-api-staging.cabrerafelipe2003.workers.dev/v11/status','GET'],
 ['REST','https://asia-v11-rest-staging.cabrerafelipe2003.workers.dev/v11/probe','POST']
];
let failures=0;
for(const [label,url,method] of endpoints){
 try{
  const r=await fetch(url,{method,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
  let j=null;try{j=await r.json()}catch{}
  if(r.status===401&&j?.ok===false){console.log(`OK ${label}: HTTP 401, endpoint protegido, sin credenciales`);}
  else{console.error(`NO VALIDADO ${label}: HTTP ${r.status} (esperado 401 sin credencial)`);failures++;}
 }catch(e){console.error(`NO VALIDADO ${label}: red o endpoint inaccesible`);failures++;}
}
if(failures){process.exitCode=1;console.log('No desplegar ni rotar secretos automáticamente. Revisar primero el diagnóstico.');}
else console.log('Diagnóstico de acceso externo completado. No verifica la DB ni autoriza importar datos.');
