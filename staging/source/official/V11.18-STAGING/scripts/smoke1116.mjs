// Only GET without cookies: verify V11.16 deployment and historical routes. NEVER send personal data.
const origin='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const checks=[['/v11.11/status',200],['/v11.16/',200],['/v11.16/app.js',200],['/v11.16/archive116.js',200],['/v11.16/stage116.css',200],['/v11.16/asia106-original.css',200],['/v11.15/',200],['/v11.14/',200],['/v11.15/data/journal',401],['/v11.11/auth/me',401]];
let issue='';
for(let attempt=0;attempt<3;attempt++){
 try{
  for(const [path,status] of checks){
   const r=await fetch(origin+path,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(9000)});
   if(r.status!==status)throw Error(path+': HTTP '+r.status+' en vez de '+status);
   if(path==='/v11.11/status'){const data=await r.json();if(data.version!=='11.16'||data.production!==false||data.configured!==true||data.publicRegistration!==false||data.health!==false)throw Error('Versión, entorno, D1 o control de acceso inconsistentes');}
   if(path==='/v11.16/'){const html=await r.text();if(!html.includes('V11.16 · STAGING')||!html.includes('SOLO DATOS FICTICIOS'))throw Error('La cabecera visible no es V11.16');}
   if(path==='/v11.15/data/journal'){const data=await r.json();if(data.ok||data.error!=='NO_AUTORIZADO')throw Error('La API acepta solicitudes sin sesión');}
  }
  console.log('V11.16 STAGING: '+checks.length+'/'+checks.length+' rutas verificadas sin credenciales.');process.exit(0);
 }catch(e){issue=e.message;if(attempt<2)await new Promise(done=>setTimeout(done,1200));}
}
console.error('V11.16 STAGING no verificada: '+issue);process.exit(1);
