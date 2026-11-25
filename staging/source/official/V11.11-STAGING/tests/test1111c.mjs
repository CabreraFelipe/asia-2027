// V11.11c — diagnostic classifications; 100% offline, synthetic auth only.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createWorker1111} from '../src/worker1111.mjs';

const origin='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const clientId='test-1111c.apps.googleusercontent.com';
const db=new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
db.exec(readFileSync(new URL('../../V11.9-LAB/migrations/0001_staging.sql',import.meta.url),'utf8'));
db.exec(readFileSync(new URL('../migrations/0006_identity_oidc.sql',import.meta.url),'utf8'));
const d1={prepare(sql){return {bind(...args){return {first:async()=>db.prepare(sql).get(...args)||null,run:async()=>db.prepare(sql).run(...args),all:async()=>({results:db.prepare(sql).all(...args)})};}}}};
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_DB:d1,STAGING_GOOGLE_CLIENT_ID:clientId,STAGING_GOOGLE_CLIENT_SECRET:'synthetic-not-a-real-secret',STAGING_ALLOWED_EMAILS:'test@example.test',STAGING_ALLOW_SYNTHETIC_SNAPSHOTS:'false'};
let checks=0;
async function runCase(fetchImpl,expectedPhase,expectedDiagnostic,override={}){
 const worker=createWorker1111({fetchImpl});
 const start=await worker.fetch(new Request(origin+'/v11.11/auth/start'),env);
 assert.equal(start.status,303,'start flow must be allowed');checks++;
 const toGoogle=new URL(start.headers.get('Location'));
 const state=toGoogle.searchParams.get('state'),cookie=start.headers.get('Set-Cookie').split(';')[0];
 const callback=new URL(origin+'/v11.11/auth/callback');callback.searchParams.set('state',state);callback.searchParams.set('code','synthetic-auth-code');
 const actualEnv={...env,...override};
 const res=await worker.fetch(new Request(callback,{headers:{Cookie:cookie}}),actualEnv);
 assert.equal(res.status,400,'failure must be explicit');checks++;
 const result=await res.json();
 assert.deepEqual(result,{ok:false,error:'IDENTIDAD_NO_VERIFICADA',fase:expectedPhase,diagnostico:expectedDiagnostic});checks++;
 assert(!JSON.stringify(result).includes('synthetic-auth-code'),'no auth code leaked');checks++;
 assert(!JSON.stringify(result).includes('synthetic-not-a-real-secret'),'no secret leaked');checks++;
 assert(!JSON.stringify(result).includes(state),'no state leaked');checks++;
 assert.equal(res.headers.get('Set-Cookie').includes('Max-Age=0'),true,'flow cookie cleared');checks++;
}
const providerFailure=code=>async(url)=>{
 assert.equal(url,'https://oauth2.googleapis.com/token');
 return new Response(JSON.stringify({error:code,error_description:'secret-description-DO-NOT-LEAK',access_token:'secret-access-token-DO-NOT-LEAK'}),{status:400,headers:{'Content-Type':'application/json'}});
};
await runCase(providerFailure('invalid_client'),'INTERCAMBIO_GOOGLE','INVALID_CLIENT');
await runCase(providerFailure('invalid_grant'),'INTERCAMBIO_GOOGLE','INVALID_GRANT');
await runCase(providerFailure('unexpected_sensitive_provider_error'),'INTERCAMBIO_GOOGLE','NO_DETERMINADO');
await runCase(async url=>{
 if(url==='https://oauth2.googleapis.com/token')return new Response(JSON.stringify({id_token:'synthetic-jwt'}),{status:200});
 assert.equal(url,'https://www.googleapis.com/oauth2/v3/certs');
 return new Response(JSON.stringify({error:'temporary unavailable'}),{status:503});
},'CLAVES_GOOGLE','NO_DETERMINADO');
await runCase(async url=>{
 if(url==='https://oauth2.googleapis.com/token')return new Response(JSON.stringify({id_token:'invalid-token'}),{status:200});
 return new Response(JSON.stringify({keys:[]}),{status:200});
},'TOKEN_GOOGLE','NO_DETERMINADO');
const brokenD1={prepare(sql){if(sql.startsWith('DELETE FROM auth_oidc_flows_v1111 WHERE state_digest='))throw Error('Sensitive-SQL-message');return d1.prepare(sql);}};
await runCase(async()=>{throw Error('should never fetch');},'FLUJO_D1','NO_DETERMINADO',{STAGING_DB:brokenD1});
console.log(`V11.11c: ${checks} comprobaciones de clasificación seguras; sin Google real, sin red ni credenciales.`);
