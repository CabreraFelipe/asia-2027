// Post-deployment read-only smoke. NEVER submits any credentials, cookies or personal information.
const origin='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const checks=[['/v11.11/status',200],['/v11.13/',200],['/v11.13/app.js',200],['/v11.12/',200],['/v11.11/auth/me',401]];
let last='';
for(let attempt=1;attempt<=5;attempt++){
 try{
  let passed=0;
  for(const [path,status] of checks){
   const r=await fetch(origin+path,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(6000)});
   if(r.status!==status)throw Error(`${path} esperaba HTTP ${status}, recibió HTTP ${r.status}`);
   if(path==='/v11.11/status'){
    const j=await r.json();if(j.version!=='11.13'||j.configured!==true||j.production!==false)throw Error('Estado Worker o D1 inesperado');
   }
   if(path==='/v11.13/'){
    const body=await r.text();if(!body.includes('v11.13')||!body.includes('SOLO PRUEBAS'))throw Error('HTML de versión inesperado');
   }
   passed++;
  }
  console.log(`V11.13 STAGING: ${passed}/${checks.length} comprobaciones HTTP de solo lectura superadas.`);
  console.log('No se enviaron cookies, datos personales ni credenciales.');
  process.exit(0);
 }catch(e){last=e.message;await new Promise(r=>setTimeout(r,1000));}
}
console.error('V11.13 STAGING: no se pudo validar el despliegue. '+last);
process.exit(1);
