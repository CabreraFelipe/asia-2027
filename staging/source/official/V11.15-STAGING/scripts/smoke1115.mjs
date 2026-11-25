// Live staging verification after explicit deploy: read-only, no cookies or user content.
const origin='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const checks=[['/v11.11/status',200],['/v11.15/',200],['/v11.15/app.js',200],['/v11.15/crypto115.js',200],['/v11.15/journal115.js',200],['/v11.15/asia106-original.css',200],['/v11.15/data/journal',401],['/v11.14/',200],['/v11.11/auth/me',401]];
let problem='';
for(let attempt=0;attempt<4;attempt++){
 try{
  for(const [path,expected] of checks){
   const r=await fetch(origin+path,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(8000)});
   if(r.status!==expected)throw Error(`${path}: HTTP ${r.status} (esperado ${expected})`);
   if(path==='/v11.11/status'){const status=await r.json();if(!status.ok||!status.configured||status.production!==false||status.version!=='11.15')throw Error('Worker, migración o entorno incorrecto');}
   if(path==='/v11.15/'){const html=await r.text();if(!html.includes('V11.15 · STAGING')||!html.includes('SOLO DATOS FICTICIOS'))throw Error('HTML V11.15 equivocado');}
   if(path==='/v11.15/data/journal'){const data=await r.json();if(data.ok||data.error!=='NO_AUTORIZADO')throw Error('Se requiere sesión de Google');}
  }
  console.log(`V11.15 STAGING: ${checks.length}/${checks.length} rutas de solo lectura verificadas.`);
  console.log('Sin cookies, sin credenciales, sin modificar datos personales.');process.exit(0);
 }catch(e){problem=e.message;if(attempt<3)await new Promise(resolve=>setTimeout(resolve,1100));}
}
console.error('V11.15 STAGING no quedó confirmada: '+problem);process.exit(1);
