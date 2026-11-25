// GET-only unauthenticated staging checks after manual deployment; no secrets sent.
const base='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const paths=[['/v11.11/status',200],['/v11.18/',200],['/v11.18/app.js',200],['/v11.18/kit118.js',200],['/v11.18/bundle117.js',200],['/v11.18/stage118.css',200],['/v11.18/asia106-original.css',200],['/v11.17/',200],['/v11.16/',200],['/v11.15/',200],['/v11.14/',200],['/v11.13/',200],['/v11.15/data/journal',401],['/v11.11/data/snapshots',401],['/v11.11/auth/me',401]];
let issue='';
for(let attempt=0;attempt<3;attempt++){
 try{
  for(const [path,code] of paths){const r=await fetch(base+path,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(11000)});if(r.status!==code)throw Error(path+' HTTP '+r.status+' != '+code);
   if(path==='/v11.11/status'){const s=await r.json();if(s.version!=='11.18'||s.production!==false||s.health!==false||s.publicRegistration!==false||s.configured!==true)throw Error('Estado no esperado');}
   if(path==='/v11.18/'&&!((await r.text()).includes('V11.18 · STAGING')))throw Error('Cabecera incorrecta');
   if(path==='/v11.15/data/journal'){const data=await r.json();if(data.ok||data.error!=='NO_AUTORIZADO')throw Error('Autorización D1 inesperada');}
  }
  console.log('V11.18: '+paths.length+' endpoints staging verificados sin credenciales.');process.exit(0);
 }catch(e){issue=e.message;if(attempt<2)await new Promise(res=>setTimeout(res,1250));}
}
console.error('V11.18: Smoke fallido: '+issue);process.exit(1);
