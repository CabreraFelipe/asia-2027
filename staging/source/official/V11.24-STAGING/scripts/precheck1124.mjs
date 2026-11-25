// Strict GET-only validation of actual prior staging; NO deploy, NO credentials.
const base='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
try{
 const r=await fetch(base+'/v11.11/status',{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(14000)});
 if(r.status!==200)throw Error('Status HTTP '+r.status);
 const s=await r.json();
 if(!s?.ok||s.version!=='11.21'||s.configured!==true||s.production!==false||s.health!==false||s.publicRegistration!==false)
   throw Error('Staging debe informar V11.21 y modo seguro; version: '+(s?.version??'desconocida')+'. Nada fue modificado.');
 const h=await fetch(base+'/v11.21/',{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(14000)});
 if(h.status!==200||!(await h.text()).includes('V11.21 · STAGING'))throw Error('No se pudo confirmar la interfaz V11.21. Nada fue modificado.');
 console.log('PRECHECK V11.24: V11.21 real y STAGING seguro confirmado; actualizacion permitida.');
}catch(e){console.error('PRECHECK V11.24 ERROR: '+(e?.message||String(e)));process.exitCode=1;}
