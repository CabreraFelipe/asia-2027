// GET-only validation for safe cumulative upgrade to V11.21.
// The deployed origin can be either V11.17 or V11.18; no user data or credentials sent.
const base='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const origins=new Set(['11.17','11.18']);
try{
 const r=await fetch(base+'/v11.11/status',{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(r.status!==200)throw Error('Status HTTP '+r.status);
 const s=await r.json();
 if(!s?.ok||!origins.has(s.version)||s.configured!==true||s.production!==false||s.health!==false||s.publicRegistration!==false)
  throw Error('Staging debe estar en V11.17 o V11.18; version informada: '+(s?.version??'desconocida')+'. Ningun cambio realizado.');
 const prior=s.version;
 const h=await fetch(base+'/v'+prior+'/',{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(h.status!==200||!(await h.text()).includes('V'+prior+' · STAGING'))throw Error('No se pudo confirmar la pantalla V'+prior+' de staging. Ningun cambio realizado.');
 console.log('PRECHECK V11.21: V'+prior+' real y exclusivamente staging confirmada. Actualizacion acumulativa autorizable.');
}catch(e){console.error('PRECHECK V11.21 ERROR: '+e.message);process.exitCode=1;}
