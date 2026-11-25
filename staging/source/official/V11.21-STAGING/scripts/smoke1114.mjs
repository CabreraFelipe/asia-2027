// Read-only health check after user's explicit deployment. No cookies, keys, writes or real user data.
const origin='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const checks=[['/v11.11/status',200],['/v11.14/',200],['/v11.14/app.js',200],['/v11.14/asia106-original.css',200],['/v11.13/',200],['/v11.11/auth/me',401]];
let error='';
for(let attempt=1;attempt<=4;attempt++){
 try{
  for(const [path,status] of checks){
   const r=await fetch(origin+path,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(7000)});
   if(r.status!==status)throw Error(`${path} HTTP ${r.status}, se esperaba ${status}`);
   if(path==='/v11.14/'){const html=await r.text();if(!html.includes('V11.14')||!html.includes('SOLO ACTIVIDADES FICTICIAS'))throw Error('HTML V11.14 incorrecto');}
   if(path==='/v11.11/status'){const j=await r.json();if(!j.ok||!j.configured||j.production!==false)throw Error('Worker no configurado en staging');}
  }
  console.log(`V11.14 STAGING: ${checks.length}/${checks.length} verificaciones HTTP de solo lectura correctas.`);
  console.log('No se utilizaron cookies, secretos ni datos personales.');process.exit(0);
 }catch(e){error=e.message;await new Promise(resolve=>setTimeout(resolve,1000));}
}
console.error('No se confirmó V11.14 en Cloudflare: '+error);process.exit(1);
