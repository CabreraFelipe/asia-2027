// Read-only live smoke; optional AFTER a deliberate NEW staging Worker deployment.
const origin=process.env.ASIA1111_ORIGIN||'https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
if(!/^https:\/\/asia-v1111-identity-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin))throw Error('ORIGEN_NO_ES_STAGING');
async function check(path,status){const c=new AbortController(),t=setTimeout(()=>c.abort(),7000);try{const r=await fetch(origin+path,{redirect:'error',signal:c.signal,headers:{Accept:'application/json'}});if(r.status!==status)throw Error(`${path}: esperaba ${status}, recibió ${r.status}`);if(path.endsWith('/status')){const x=await r.json();if(x.version!=='11.11'||x.configured!==true)throw Error('IDENTIDAD_NO_CONFIGURADA');}console.log(`OK ${path}: HTTP ${r.status}`);}finally{clearTimeout(t);}}
await check('/v11.11/status',200);
await check('/v11.11/auth/me',401);
await check('/v11.11/data/snapshots',403); // disabled by default
console.log('V11.11: diagnóstico de solo lectura completado. No valida aún el login Google real.');
