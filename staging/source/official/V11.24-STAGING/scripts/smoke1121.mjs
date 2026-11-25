// Only unauthenticated GETs to staging. No secrets and no production domain.
const base='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const paths=[['/v11.11/status',200],['/v11.21/',200],['/v11.21/app.js',200],['/v11.21/stage121.css',200],['/v11.21/kit118.js',200],['/v11.18/',200],['/v11.17/',200],['/v11.16/',200],['/v11.15/',200],['/v11.14/',200],['/v11.13/',200],['/v11.15/data/journal',401],['/v11.11/data/snapshots',401],['/v11.11/auth/me',401]];
try{
 for(const [path,code] of paths){const r=await fetch(base+path,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(12000)});if(r.status!==code)throw Error(path+' HTTP '+r.status+' != '+code);if(path==='/v11.11/status'){const j=await r.json();if(j.version!=='11.21'||j.production!==false||j.health!==false||j.publicRegistration!==false||j.configured!==true)throw Error('Modo no seguro');}if(path==='/v11.21/'&&!((await r.text()).includes('V11.21 · STAGING')))throw Error('Cabecera ausente');}
 console.log('V11.21 smoke: '+paths.length+' rutas de staging verificadas sin autenticación.');
}catch(e){console.error('SMOKE V11.21 ERROR: '+e.message);process.exit(1);}
