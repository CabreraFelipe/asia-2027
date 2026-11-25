// Read-only precondition: V11.16 must actually be deployed, configured, and on the exact staging hostname.
const origin='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
try{
 const r=await fetch(origin+'/v11.11/status',{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(r.status!==200)throw Error('El entorno remoto devolvió HTTP '+r.status);
 const info=await r.json();
 if(info?.version!=='11.16'||!info.configured||info.production!==false||info.publicRegistration!==false||info.health!==false)throw Error('Se esperaba V11.16 operativa en el Worker staging, pero el estado no coincide');
 const page=await fetch(origin+'/v11.16/',{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(page.status!==200||(await page.text()).includes('V11.16 · STAGING')===false)throw Error('La pantalla V11.16 no está disponible');
 console.log('Precondición OK: V11.16 real en staging, sin datos de producción.');
}catch(e){console.error('PRECHECK V11.17 ERROR: '+e.message);process.exit(1);}
