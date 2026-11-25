// GET-only real smoke. Never calls write endpoints or Cloudflare production.
const base='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const paths=[['/v11.11/status',200],['/v11.24/',200],['/v11.24/app.js',200],['/v11.24/stage124.css',200],['/v11.24/stage121.css',200],['/v11.24/kit118.js',200],['/v11.21/',200],['/v11.18/',200],['/v11.17/',200],['/v11.16/',200],['/v11.15/',200],['/v11.14/',200],['/v11.13/',200],['/v11.15/data/journal',401],['/v11.11/data/snapshots',401],['/v11.11/auth/me',401]];
try{
 for(const [path,expected] of paths){
  const r=await fetch(base+path,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(14000)});
  if(r.status!==expected)throw Error(path+' HTTP '+r.status+' (esperado '+expected+')');
  if(path==='/v11.11/status'){
   const j=await r.json();if(j.version!=='11.24'||j.production!==false||j.health!==false||j.publicRegistration!==false||j.configured!==true)throw Error('Staging inseguro o version incorrecta');
  }
  if(path==='/v11.24/'&&!(await r.text()).includes('V11.24 · STAGING'))throw Error('Cabecera V11.24 ausente');
 }
 console.log('SMOKE V11.24 OK: '+paths.length+' rutas y estado real verificados; solo GET sin autenticacion.');
}catch(e){console.error('SMOKE V11.24 ERROR: '+(e?.message||String(e)));process.exitCode=1;}
