import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createServiceWorker} from '../src/service-worker.mjs';
import {createAccountServices} from '../src/service-client.mjs';
import {digest} from '../../official/V11.24-STAGING/src/security1111.mjs';
const db=new DatabaseSync(':memory:');
db.exec("CREATE TABLE staging_identity_v110(id INTEGER PRIMARY KEY,marker TEXT);INSERT INTO staging_identity_v110 VALUES(1,'asia-v11-staging-110');CREATE TABLE auth_oidc_sessions_v1111(token_digest TEXT PRIMARY KEY,account_id TEXT,csrf TEXT,expires_at INTEGER,email_digest TEXT);");
const origin='https://asia-v1111-identity-staging.example.workers.dev',A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),ta='A'.repeat(43),tb='B'.repeat(43);
for(const [id,t,c,e] of [[A,ta,'a','a@example.invalid'],[B,tb,'b','b@example.invalid']])db.prepare('INSERT INTO auth_oidc_sessions_v1111 VALUES(?,?,?,?,?)').run(await digest(t),id,c,Date.now()+600000,await digest(e));
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_DB:{prepare(sql){let a=[];return {bind(...args){a=args;return this},async first(){return db.prepare(sql).get(...a)||null}}}},STAGING_GOOGLE_CLIENT_ID:'example.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-only',STAGING_ALLOWED_EMAILS:'a@example.invalid,b@example.invalid',STAGING_ALLOW_V1139_TESTS:'true'};
let revoke=false;
// Synthetic data are intentionally distinct by account, source and type.
// These fixtures exercise the authenticated service boundary, not real providers.
const fixture={
 [A]:{health:[{id:A,kind:'health',source:'apple-health-fixture',steps:1234}],workouts:[{id:A,kind:'workouts',source:'apple-health-fixture',duration:17}]},
 [B]:{health:[{id:B,kind:'health',source:'health-connect-fixture',steps:4321}],workouts:[{id:B,kind:'workouts',source:'health-connect-fixture',duration:29}]}
};
const worker=createServiceWorker({provider:{async read(id,kind){if(revoke)db.prepare('DELETE FROM auth_oidc_sessions_v1111 WHERE account_id=?').run(id);return structuredClone(fixture[id]?.[kind]??[])}},fetchImpl:()=>{throw Error('Red prohibida')}});
let accountId=A,csrf='a',token=ta;
const fetcher=(url,opt={})=>worker.fetch(new Request(url,{...opt,headers:{Cookie:'__Host-asia1111_session='+token,...(opt.method==='POST'?{Origin:origin}:{}),...opt.headers}}),env);
const readSession=async()=>({accountId,csrf}),create=()=>createAccountServices({origin,readSession,fetcher});
const a=await create();assert.deepEqual(await a.request('health'),fixture[A].health);assert.deepEqual(await a.request('workouts'),fixture[A].workouts);
assert.equal((await fetcher(origin+'/v11.39/services/health',{headers:{'X-Asia-Account':B}})).status,403);
assert.equal((await fetcher(origin+'/v11.39/services/health?accountId='+B)).status,403);
const coach={mode:'chat',question:'prueba',context:{},conversation:[]};
assert.match((await a.request('coach',coach)).result.answer,/SIMULACIÓN/);
assert.match((await a.request('chat',{data:{question:'prueba'}})).result,/SIMULACIÓN/);
const route=origin+'/v11.39/services/coach',post=(payload,headers={})=>fetcher(route,{method:'POST',headers:{'Content-Type':'application/json','X-Asia-CSRF':csrf,...headers},body:JSON.stringify(payload)});
assert.equal((await post(coach,{'X-Asia-CSRF':'bad'})).status,403);
assert.equal((await post({...coach,context:{accountId:B}})).status,400);
assert.equal((await post({...coach,context:{image:'x'}})).status,400);
assert.equal((await fetcher(origin+'/v11.39/services/vision')).status,404);
assert.equal((await worker.fetch(new Request(origin+'/v11.39/services/health'),env)).status,401);
accountId=B;csrf='b';token=tb;await assert.rejects(()=>a.request('health'),/sesión cambió/);
const b=await create();assert.deepEqual(await b.request('health'),fixture[B].health);assert.deepEqual(await b.request('workouts'),fixture[B].workouts);
assert.equal((await fetcher(origin+'/v11.39/services/workouts',{headers:{'X-Account-ID':A}})).status,403);
revoke=true;await assert.rejects(()=>b.request('health'),/no disponible/);
db.close();console.log('V11.39 Worker real: synthetic service contracts, CSRF, scope, no credentials/images, isolation, revocation during read.');
