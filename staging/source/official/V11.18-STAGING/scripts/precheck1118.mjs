// GET-only remote precondition. Never pass cookies, keys, user data or auth headers.
const base='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
try{
 const r=await fetch(base+'/v11.11/status',{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(r.status!==200)throw Error('HTTP '+r.status+' en status');
 const s=await r.json();if(s.version!=='11.17'||s.configured!==true||s.production!==false||s.health!==false||s.publicRegistration!==false)throw Error('Worker STAGING no está en V11.17, detenido por seguridad');
 const h=await fetch(base+'/v11.17/',{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(h.status!==200||!(await h.text()).includes('V11.17 · STAGING'))throw Error('Pantalla V11.17 no encontrada');
 console.log('PRECHECK V11.18: V11.17 real y exclusivamente staging confirmada.');
}catch(e){console.error('PRECHECK V11.18 ERROR: '+e.message);process.exit(1);}
