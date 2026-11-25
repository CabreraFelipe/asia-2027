// V11.11d — Regression tests for an actual Cloudflare Workers runtime difference.
// No network, secrets, real accounts or remote calls.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createWorker1111} from '../src/worker1111.mjs';

const origin='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const db=new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON;');
db.exec(readFileSync(new URL('../../V11.9-LAB/migrations/0001_staging.sql',import.meta.url),'utf8'));
db.exec(readFileSync(new URL('../migrations/0006_identity_oidc.sql',import.meta.url),'utf8'));
const D1={prepare(sql){return {bind(...values){return {first:async()=>db.prepare(sql).get(...values)||null,run:async()=>db.prepare(sql).run(...values),all:async()=>({results:db.prepare(sql).all(...values)})};}}}};
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_DB:D1,STAGING_GOOGLE_CLIENT_ID:'test.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-not-real',STAGING_ALLOWED_EMAILS:'test@example.test',STAGING_ALLOW_SYNTHETIC_SNAPSHOTS:'false'};
let checks=0;
async function scenario({tokenResponse=null,jwksResponse=null,expectedPhase='INTERCAMBIO_GOOGLE',expectCalls=1}={}){
 let called=0;
 const fetchImpl=async(url,init)=>{
   // Reproduce workerd: its native fetch would THROW before contacting Google if redirect==='error'.
   assert.equal(init.redirect,'manual','Cloudflare-compatible redirect mode');checks++;
   assert(init.signal instanceof AbortSignal);checks++;
   assert(url==='https://oauth2.googleapis.com/token'||url==='https://www.googleapis.com/oauth2/v3/certs');checks++;
   called++;
   const response=url.endsWith('/token')?tokenResponse:jwksResponse;
   if(response)return response;
   throw Error('NETWORK_DISABLED');
 };
 const worker=createWorker1111({fetchImpl});
 const start=await worker.fetch(new Request(origin+'/v11.11/auth/start'),env);
 assert.equal(start.status,303);checks++;
 const authURL=new URL(start.headers.get('Location'));
 const callback=new URL(origin+'/v11.11/auth/callback');
 callback.searchParams.set('state',authURL.searchParams.get('state'));
 callback.searchParams.set('code','fake-authorization-code');
 const flowCookie=start.headers.get('Set-Cookie').split(';')[0];
 const result=await worker.fetch(new Request(callback,{headers:{Cookie:flowCookie}}),env);
 assert.equal(result.status,400);checks++;
 const payload=await result.json();
 assert.equal(payload.fase,expectedPhase);checks++;
 assert.equal(payload.error,'IDENTIDAD_NO_VERIFICADA');checks++;
 assert.equal(payload.diagnostico,'NO_DETERMINADO');checks++;
 assert.equal(called,expectCalls);checks++;
 assert(!JSON.stringify(payload).includes('fake-authorization-code'));checks++;
 assert(!JSON.stringify(payload).includes('synthetic-not-real'));checks++;
}
// Google token endpoint unexpectedly redirects: must not follow, even with sensitive POST body.
await scenario({tokenResponse:new Response(null,{status:302,headers:{Location:'https://untrusted.example/steal'}})});
// With a JSON token but redirecting JWKS, must reject before requesting redirected location.
await scenario({tokenResponse:new Response(JSON.stringify({id_token:'synthetic-id-token'}),{status:200}),jwksResponse:new Response(null,{status:301,headers:{Location:'https://untrusted.example/keys'}}),expectedPhase:'CLAVES_GOOGLE',expectCalls:2});
// Provider HTTP error must still map to a known fixed code without leaking descriptions.
let called=0;
const failure=createWorker1111({fetchImpl:async(url,init)=>{assert.equal(init.redirect,'manual');called++;return new Response(JSON.stringify({error:'invalid_client',error_description:'sensitive'}),{status:401});}});
const start=await failure.fetch(new Request(origin+'/v11.11/auth/start'),env);
const authURL=new URL(start.headers.get('Location'));
const u=new URL(origin+'/v11.11/auth/callback');u.searchParams.set('state',authURL.searchParams.get('state'));u.searchParams.set('code','fake-code');
const r=await failure.fetch(new Request(u,{headers:{Cookie:start.headers.get('Set-Cookie').split(';')[0]}}),env);
const p=await r.json();
assert.equal(called,1);checks++;
assert.equal(r.status,400);checks++;
assert.deepEqual(p,{ok:false,error:'IDENTIDAD_NO_VERIFICADA',fase:'INTERCAMBIO_GOOGLE',diagnostico:'INVALID_CLIENT'});checks++;
assert(!JSON.stringify(p).includes('sensitive'));checks++;
console.log(`V11.11d: ${checks} comprobaciones Cloudflare Fetch/redirect y errores seguros; sin red ni cuentas reales.`);
