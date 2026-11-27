// Exercise actual packaged OAuth routes with locally signed fixture JWTs, no external requests.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createPwaWorker} from '../dist/server/staging/source/V11.42-INTEGRACION/src/worker.mjs';
import {accountId,digest,b64url} from '../dist/server/staging/source/official/V11.24-STAGING/src/security1111.mjs';
import {generateAccountSecret} from '../src/account-key1150.mjs';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
for(const n of ['0001_staging.sql','0006_identity_oidc.sql','0007_synthetic_journal_v115.sql','0009_large_sync.sql'])db.exec(readFileSync(new URL('../dist/migrations/'+n,import.meta.url),'utf8'));
const email='legacy@example.invalid',otherEmail='other@example.invalid',sub='fixture-legacy',issuer='https://accounts.google.com',A=await accountId(issuer,sub),B=await accountId(issuer,'fixture-other');
const origin='https://asia-v1142-candidate-staging.example.workers.dev',clientId='fixture.apps.googleusercontent.com';
for(const [id,s] of [[A,sub],[B,'fixture-other']])db.prepare('INSERT INTO accounts_v11 VALUES(?,?,?,?)').run(id,issuer,s,new Date().toISOString());
db.prepare('INSERT INTO encrypted_snapshots_v11 VALUES(?,?,?,?)').run(A,1,'preserved-ciphertext',new Date().toISOString());
for(const n of ['0010_managed_keys.proposed.sql','0015_new_account_enrollment.proposed.sql','0016_pilot_fresh_profiles.proposed.sql'])db.exec(readFileSync(new URL('../migrations/'+n,import.meta.url),'utf8'));
const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'fixture',alg:'RS256',use:'sig'};
const te=new TextEncoder();let claims;
const jwt=async()=>{const now=Math.floor(Date.now()/1000),part=x=>b64url(te.encode(JSON.stringify(x)));const input=part({alg:'RS256',kid:'fixture',typ:'JWT'})+'.'+part({iss:issuer,aud:clientId,iat:now,exp:now+300,email_verified:true,...claims});return input+'.'+b64url(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,te.encode(input))))};
const worker=createPwaWorker({assetPaths:new Set(),fetchImpl:async url=>{
 if(url==='https://oauth2.googleapis.com/token')return Response.json({id_token:await jwt()});
 if(url==='https://www.googleapis.com/oauth2/v3/certs')return Response.json({keys:[jwk]});
 throw Error('Red prohibida');
}});
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_ALLOW_V1142_TESTS:'true',STAGING_ALLOW_V1138_TESTS:'true',STAGING_ALLOW_V1139_TESTS:'true',STAGING_ALLOW_MANAGED_KEYS_1152:'true',STAGING_ALLOW_PILOT_FRESH_PROFILE_V12:'true',STAGING_MANAGED_KEK_ID_1152:'fixture',STAGING_MANAGED_KEK_1152:generateAccountSecret(),STAGING_GOOGLE_CLIENT_ID:clientId,STAGING_GOOGLE_CLIENT_SECRET:'synthetic-only',STAGING_ALLOWED_EMAILS:[email,otherEmail,'new@example.invalid'].join(','),STAGING_PWA_ASSETS:{},STAGING_DB:{prepare(sql){let a=[];return {bind(...args){a=args;return this},async first(){return db.prepare(sql).get(...a)||null},async run(){return db.prepare(sql).run(...a)}}}}};
const req=(path,opts={},config=env)=>worker.fetch(new Request(origin+path,opts),config);
const cookieFrom=(r,name)=>{const value=r.headers.getSetCookie().find(v=>v.startsWith(name+'='));assert.ok(value,name);return value.split(';')[0]};
async function login(subject,mail,overrides={}){
 const start=await req('/v11.11/auth/start');assert.equal(start.status,303);const url=new URL(start.headers.get('Location'));
 claims={sub:subject,email:mail,nonce:url.searchParams.get('nonce'),...overrides};
 const result=await req('/v11.11/auth/callback?'+new URLSearchParams({state:url.searchParams.get('state'),code:'fixture-code'}),{headers:{Cookie:cookieFrom(start,'__Host-asia1111_flow')}});
 return result;
}
const me=async cookie=>{const r=await req('/v11.11/auth/me',{headers:{Cookie:cookie}});assert.equal(r.status,200);return r.json()};
const post=(path,cookie,s,extra={},config=env,body='')=>req(path,{method:'POST',headers:{Cookie:cookie,Origin:origin,'X-Asia-CSRF':s.csrf,...extra},body},config);
try{
 const prior=await login(sub,email);assert.equal(prior.status,303);const oldCookie=cookieFrom(prior,'__Host-asia1111_session'),old=await me(oldCookie);assert.equal(old.accountId,A);
 const old2=await login(sub,email);assert.equal(old2.status,303);const oldCookie2=cookieFrom(old2,'__Host-asia1111_session');
 const other=await login('fixture-other',otherEmail);assert.equal(other.status,303);const otherCookie=cookieFrom(other,'__Host-asia1111_session');assert.equal((await me(otherCookie)).accountId,B);
 assert.equal((await post('/v11.52/account-key',oldCookie,old,{},env,'x')).status,400);
 const legacy=await post('/v11.52/account-key',oldCookie,old);assert.equal(legacy.status,409);assert.equal((await legacy.json()).freshProfileAvailable,true);
 assert.equal((await post('/v11.11/auth/renew',oldCookie,old,{},env,'x')).status,400);
 assert.equal((await post('/v11.11/auth/renew',oldCookie,old)).status,200);
 assert.equal((await post('/v12/pilot/fresh-profile',oldCookie,old,{'X-Asia-Fresh-Profile':'archive-legacy-v1'},env,'x')).status,403);
 assert.equal((await post('/v12/pilot/fresh-profile',oldCookie,old,{'X-Asia-Fresh-Profile':'archive-legacy-v1'})).status,200);
 for(const cookie of [oldCookie,oldCookie2])assert.equal((await req('/v11.11/auth/me',{headers:{Cookie:cookie}})).status,401);
 assert.equal((await me(otherCookie)).accountId,B);
 const fresh=db.prepare('SELECT fresh_account_id FROM pilot_fresh_profiles_v12 WHERE legacy_account_id=?').get(A).fresh_account_id;
 assert.notEqual(fresh,A);assert.equal(db.prepare('SELECT envelope FROM encrypted_snapshots_v11 WHERE account_id=?').get(A).envelope,'preserved-ciphertext');
 const wrong=await login(sub,email,{nonce:'wrong'});assert.notEqual(wrong.status,303);
 const again=await login(sub,email);assert.equal(again.status,303);const cookie=cookieFrom(again,'__Host-asia1111_session'),s=await me(cookie);assert.equal(s.accountId,fresh);
 const key=await post('/v11.52/account-key',cookie,s);assert.equal(key.status,200);const secret=(await key.json()).secret;
 const repeated=await login(sub,email);assert.equal(repeated.status,303);const c2=cookieFrom(repeated,'__Host-asia1111_session'),s2=await me(c2);assert.equal(s2.accountId,fresh);assert.equal((await (await post('/v11.52/account-key',c2,s2)).json()).secret,secret);
 assert.notEqual((await post('/v12/pilot/fresh-profile',cookie,s,{'X-Asia-Fresh-Profile':'archive-legacy-v1'})).status,200);
 const newLogin=await login('fixture-new','new@example.invalid');assert.equal(newLogin.status,303);const cn=cookieFrom(newLogin,'__Host-asia1111_session'),sn=await me(cn);assert.equal(sn.accountId,await accountId(issuer,'fixture-new'));const newKey=await post('/v11.52/account-key',cn,sn);assert.equal(newKey.status,200);assert.notEqual((await newKey.json()).secret,secret);
 console.log('Packaged OAuth: locally signed JWT, legacy reset, old-session revocation, unrelated account isolation, same Google successor and automatic new-account key PASS');
}finally{db.close()}
