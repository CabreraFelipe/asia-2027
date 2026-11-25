// Offline V11.11 tests: real SQLite + WebCrypto, fake Google provider; NO external network.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {generateKeyPairSync,sign,randomBytes,createCipheriv} from 'node:crypto';
import {createWorker1111} from '../src/worker1111.mjs';
import {stagingClient1111} from '../src/client1111.mjs';
import {rand,b64url,sha256,digest,pkce,eq,accountId,verifyGoogleIdToken,validEnvelope} from '../src/security1111.mjs';
const base=new URL('../',import.meta.url),read=file=>readFileSync(new URL(file,base),'utf8');
let unit=0,api=0,sql=0;
function check(x,label){assert.ok(x,label);unit++;}
function same(a,b,label){assert.deepEqual(a,b,label);unit++;}
async function rejectsPromise(f,expected){await assert.rejects(f,e=>e.message===expected,expected);unit++;}
function expect(r,status,label){assert.equal(r.status,status,label||`expected ${status} got ${r.status}`);api++;return r;}
const origin='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev',clientId='test-123.apps.googleusercontent.com';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON;');db.exec(read('../V11.9-LAB/migrations/0001_staging.sql'));db.exec(read('migrations/0006_identity_oidc.sql'));sql+=2;
const counts=()=>Object.fromEntries(['accounts_v11','auth_oidc_flows_v1111','auth_oidc_sessions_v1111','encrypted_snapshots_v11'].map(t=>[t,db.prepare(`SELECT count(*) AS n FROM ${t}`).get().n]));
const D1={prepare(query){return {bind(...args){return {first:async()=>db.prepare(query).get(...args)||null,all:async()=>({results:db.prepare(query).all(...args)}),run:async()=>({meta:db.prepare(query).run(...args)})};}}}};
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_DB:D1,STAGING_GOOGLE_CLIENT_ID:clientId,STAGING_GOOGLE_CLIENT_SECRET:'synthetic-secret-1111',STAGING_ALLOWED_EMAILS:'a@example.test,b@example.test',STAGING_ALLOW_SYNTHETIC_SNAPSHOTS:'false'};
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});const jwk={...publicKey.export({format:'jwk'}),use:'sig',alg:'RS256',kid:'test-key-1'};let context=null,tokenCalls=0,jwksCalls=0;
const jwt=(claims,header={alg:'RS256',typ:'JWT',kid:'test-key-1'},key=privateKey)=>{const a=b64url(Buffer.from(JSON.stringify(header))),b=b64url(Buffer.from(JSON.stringify(claims)));return a+'.'+b+'.'+sign('RSA-SHA256',Buffer.from(a+'.'+b),key).toString('base64url');};
const tokenClaims=(ctx=context)=>{const now=Math.floor(Date.now()/1000);return {iss:'https://accounts.google.com',aud:clientId,sub:ctx.subject,nonce:ctx.nonce,exp:now+300,iat:now,auth_time:now,email:ctx.email,email_verified:true};};
const fetchImpl=async(url,options)=>{assert.ok(typeof url==='string');check(options.redirect==='manual','Provider redirects are manual and checked by Worker');check(options.signal instanceof AbortSignal,'Provider timeout enabled');if(url==='https://oauth2.googleapis.com/token'){tokenCalls++;check(options.method==='POST','Code exchange POST');const body=new URLSearchParams(options.body);same(body.get('code_verifier'),context?.verifier,'PKCE verifier');same(body.get('redirect_uri'),origin+'/v11.11/auth/callback','Exact redirect URI');return new Response(JSON.stringify({id_token:jwt(tokenClaims())}),{status:200,headers:{'Content-Type':'application/json'}});}if(url==='https://www.googleapis.com/oauth2/v3/certs'){jwksCalls++;return new Response(JSON.stringify({keys:[jwk]}),{status:200});}throw Error('EXTERNAL_REQUEST_BLOCKED');};
const app=createWorker1111({fetchImpl});
const call=(path,opts={},environment=env)=>app.fetch(new Request(origin+path,opts),environment);
const cookieByName=(r,name)=>{const v=r.headers.getSetCookie().find(c=>c.startsWith(name+'='));assert.ok(v,`cookie ${name} expected`);api++;return v.split(';')[0];};
const get=(url,cookie)=>call(url,{headers:cookie?{Cookie:cookie}:{}});
const body=()=>{const key=randomBytes(32),salt=randomBytes(16),iv=randomBytes(12),aes=createCipheriv('aes-256-gcm',key,iv);const cipher=Buffer.concat([aes.update(Buffer.from('synthetic encrypted content')),aes.final(),aes.getAuthTag()]);return {format:'asia84-encrypted-v1',salt:salt.toString('base64'),iv:iv.toString('base64'),cipher:cipher.toString('base64')};};
async function begin(subject,email){const start=expect(await get('/v11.11/auth/start'),303,'Start login');const loc=new URL(start.headers.get('Location'));same(loc.origin,'https://accounts.google.com','Auth fixed provider');same(loc.searchParams.get('client_id'),clientId,'Google client');same(loc.searchParams.get('code_challenge_method'),'S256','Google PKCE method');same(loc.searchParams.get('scope'),'openid email','Google scopes');const flow=cookieByName(start,'__Host-asia1111_flow');context={subject,email,nonce:loc.searchParams.get('nonce'),verifier:'',state:loc.searchParams.get('state')};const d=await digest(context.state);const rec=db.prepare('SELECT nonce,verifier,expires_at FROM auth_oidc_flows_v1111 WHERE state_digest=?').get(d);same(rec.nonce,context.nonce,'Stored nonce');same(await pkce(rec.verifier),loc.searchParams.get('code_challenge'),'PKCE check');context.verifier=rec.verifier;return {flow,state:context.state};}
async function finish({flow,state},opts={}){const q=new URLSearchParams({state,code:opts.code||'synthetic-code-1111'});for(const [key,value] of (opts.extras||[]))q.append(key,value);return call('/v11.11/auth/callback?'+q,{headers:{Cookie:opts.cookie===undefined?flow:opts.cookie}});}
async function login(subject,email){const flow=await begin(subject,email);const r=expect(await finish(flow),303,'Successful callback');const session=cookieByName(r,'__Host-asia1111_session');const profile=expect(await get('/v11.11/auth/me',session),200);const user=await profile.json();same(user.ok,true,'Session authenticated');return {session,accountId:user.accountId,csrf:user.csrf,subject,email};}
const post=(path,s,csrf,value,opts={})=>call(path,{method:'POST',headers:{Cookie:s,Origin:opts.origin||origin,'X-Asia-CSRF':csrf,'Content-Type':'application/json',...(opts.headers||{})},body:JSON.stringify(value)});
const store=(s,csrf,expectedRevision,envelope)=>post('/v11.11/data/snapshots',s,csrf,{expectedRevision,envelope});
// WebCrypto and token validation contracts.
check(rand().length===43,'Random 256-bit');check((await digest('abc')).length===64,'SHA-256 digest');check((await sha256('abc')).length===32,'SHA-256 bytes');check((await pkce('x'.repeat(43))).length===43,'PKCE length');check(eq('same','same'),'Constant time positive');check(!eq('same','different'),'Constant time negative');check((await accountId('iss','sub')).startsWith('acct_'),'Account id canonical');check(validEnvelope(body()),'Valid encrypted envelope');check(!validEnvelope({...body(),format:'plaintext'}),'No plaintext envelope');
const realClaims=tokenClaims({subject:'google-user-a',email:'a@example.test',nonce:rand()});const realJWT=jwt(realClaims);const proof={clientId,nonce:realClaims.nonce,jwks:{keys:[jwk]}};
same((await verifyGoogleIdToken(realJWT,proof)).subject,'google-user-a','Valid signed ID token');
for(const [claims,reason] of [[{...realClaims,iss:'https://evil.invalid'},'ISSUER_INVALID'],[{...realClaims,aud:'wrong'},'AUDIENCE_INVALID'],[{...realClaims,nonce:rand()},'NONCE_INVALID'],[{...realClaims,exp:1},'EXP_INVALID'],[{...realClaims,iat:1},'IAT_INVALID'],[{...realClaims,email_verified:false},'EMAIL_INVALID'],[{...realClaims,azp:'evil-client'},'AZP_INVALID'],[{...realClaims,nbf:Math.floor(Date.now()/1000)+300},'NBF_INVALID'],[{...realClaims,sub:''},'SUB_INVALID']])await rejectsPromise(()=>verifyGoogleIdToken(jwt(claims),proof),reason);
await rejectsPromise(()=>verifyGoogleIdToken(jwt(realClaims,{alg:'none',kid:'test-key-1'}),proof),'TOKEN_ALG_INVALID');
const bad=generateKeyPairSync('rsa',{modulusLength:2048});await rejectsPromise(()=>verifyGoogleIdToken(jwt(realClaims,undefined,bad.privateKey),proof),'SIGNATURE_INVALID');
await rejectsPromise(()=>verifyGoogleIdToken(realJWT,{...proof,jwks:{keys:[]}}),'JWKS_KEY_INVALID');
// Config must fail closed. Real production bindings are forbidden in this worker.
expect(await get('/v11.11/status'),200);const status=await(await get('/v11.11/status')).json();check(status.configured&&status.production===false,'Staging-only status');
expect(await call('/v11.11/auth/start',{}, {...env,STAGING_MODE:'wrong'}),503);expect(await call('/v11.11/auth/start',{}, {...env,STAGING_GOOGLE_CLIENT_SECRET:undefined}),503);expect(await call('/v11.11/auth/start',{}, {...env,DB:{}}),503);expect(await call('/v11.11/auth/start',{}, {...env,STAGING_ALLOWED_EMAILS:''}),503);
expect(await call('/v11.11/auth/start',{}, {...env,STAGING_DB:{prepare:()=>({bind:()=>({first:async()=>({marker:'wrong'})})})}}),503);
expect(await call('/v11.11/auth/me',{headers:{'X-Asia-Account':'other'}}),403);expect(await call('/v11.11/auth/start',{headers:{'X-Account-ID':'a'}}),403);
expect(await get('/v11.11/auth/me'),401);expect(await get('/v11.11/data/snapshots'),403);expect(await get('/v11.11/'),200);
// Real Google callbacks frequently include scope/authuser/prompt in addition to state/code.
// Reject duplicate/missing security-critical parameters and missing/mismatched state cookies.
let flow=await begin('user-invalid','a@example.test');
let response=expect(await finish(flow,{cookie:''}),400,'Missing flow cookie');
same((await response.json()).error,'FLUJO_COOKIE_AUSENTE','Clear diagnostic for missing browser state cookie');
expect(await finish(flow,{cookie:'__Host-asia1111_flow='+rand()}),400,'Wrong flow cookie');
expect(await finish(flow,{extras:[['state',flow.state]]}),400,'Duplicate state rejected');
expect(await finish(flow,{extras:[['code','another-code']]}),400,'Duplicate code rejected');
expect(await finish(flow,{extras:[['error','access_denied']]}),400,'Conflicting provider error rejected');
expect(await finish(flow,{extras:[['junk','x'.repeat(8200)]]}),400,'Oversized callback rejected');
expect(await finish(flow,{extras:[['scope','openid email'],['authuser','0'],['prompt','consent'],['hd','example.test']]}),303,'Google callback with optional fields accepted'); // state remains until valid browser consumes it
let r=expect(await finish(flow),400,'No callback replay');check((await r.json()).error==='FLUJO_VENCIDO','Once-only state');
flow=await begin('user-other-email','stranger@example.test');r=expect(await finish(flow),403);check((await r.json()).error==='CUENTA_NO_AUTORIZADA','Email allowlist');
const a=await login('google-a','a@example.test');const b=await login('google-b','b@example.test');check(a.accountId!==b.accountId,'Account separation');
expect(await get('/v11.11/auth/me','__Host-asia1111_session='+rand()),401);expect(await get('/v11.11/data/snapshots',a.session),403,'Snapshots disabled by default');
env.STAGING_ALLOW_SYNTHETIC_SNAPSHOTS='true';
const aV1=body(),bV1=body();expect(await store(a.session,a.csrf,0,aV1),201);expect(await store(b.session,b.csrf,0,bV1),201);expect(await store(a.session,a.csrf,0,body()),409,'CAS conflict');
const listA=expect(await get('/v11.11/data/snapshots',a.session),200),listB=expect(await get('/v11.11/data/snapshots',b.session),200);same((await listA.json()).head,1,'A head');same((await listB.json()).head,1,'B head');
const aRead=await(await get('/v11.11/data/snapshots/1',a.session)).json();const bRead=await(await get('/v11.11/data/snapshots/1',b.session)).json();same(aRead.envelope,aV1,'A reads own ciphertext');same(bRead.envelope,bV1,'B reads own ciphertext');check(aRead.envelope.cipher!==bRead.envelope.cipher,'Ciphertexts isolated');
expect(await get('/v11.11/data/snapshots?accountId='+b.accountId,a.session),400);expect(await call('/v11.11/data/snapshots',{headers:{Cookie:a.session,'X-Account-ID':b.accountId}}),403);
expect(await post('/v11.11/data/snapshots',a.session,rand(),{expectedRevision:1,envelope:body()}),403);expect(await post('/v11.11/data/snapshots',a.session,a.csrf,{expectedRevision:1,envelope:body()},{origin:'https://evil.invalid'}),403);
expect(await post('/v11.11/data/snapshots',a.session,a.csrf,{expectedRevision:1,envelope:{...body(),format:'plaintext'}}),400);
expect(await post('/v11.11/data/snapshots',a.session,a.csrf,{expectedRevision:1,envelope:body(),accountId:b.accountId}),400);
expect(await call('/v11.11/data/snapshots',{method:'POST',headers:{Cookie:a.session,Origin:origin,'X-Asia-CSRF':a.csrf,'Content-Type':'text/plain'},body:'x'}),400);
const [race1,race2]=await Promise.all([store(a.session,a.csrf,1,body()),store(a.session,a.csrf,1,body())]);same([race1.status,race2.status].sort(),[201,409],'Concurrent updates CAS');
expect(await get('/v11.11/data/snapshots/1',b.session),200);expect(await get('/v11.11/data/snapshots/3',a.session),404);
expect(await call('/v11.11/auth/logout',{method:'POST',headers:{Cookie:a.session,Origin:origin,'X-Asia-CSRF':'fake'}}),403);
expect(await call('/v11.11/auth/logout',{method:'POST',headers:{Cookie:a.session,Origin:origin,'X-Asia-CSRF':a.csrf}}),200);expect(await get('/v11.11/auth/me',a.session),401);expect(await get('/v11.11/data/snapshots',a.session),401);expect(await get('/v11.11/auth/me',b.session),200);
// Rotating the allowlist revokes sessions of accounts no longer authorized.
env.STAGING_ALLOWED_EMAILS='a@example.test';expect(await get('/v11.11/auth/me',b.session),401);expect(await get('/v11.11/auth/me',a.session),401); // A was explicitly logged out earlier
env.STAGING_ALLOWED_EMAILS='a@example.test,b@example.test';expect(await get('/v11.11/auth/me',b.session),200);
// Browser transport uses ONLY server-verified session/cookie; never sends an account id or decrypted content.
assert.throws(()=>stagingClient1111({origin:'http://localhost:4177'}),/ORIGIN_REQUIRES_HTTPS/);unit++;
const client=stagingClient1111({origin,fetchImpl:async(url,options)=>{const headers=new Headers(options.headers||{});headers.set('Cookie',b.session);if(options.method==='POST')headers.set('Origin',origin);return app.fetch(new Request(url,{...options,headers}),env);}});
same((await client.session()).status,200,'Browser transport session');same((await client.list()).head,1,'Browser transport lists B only');same((await client.read(1)).envelope,bV1,'Browser transport reads own cipher');same((await client.save(1,body())).status,201,'Browser transport CAS');await assert.rejects(()=>client.save(1,{format:'plaintext'}),/SOBRE_INVALIDO/);unit++;same((await client.logout()).status,200,'Browser transport logout');same((await client.list()).status,401,'Browser transport session revoked');
// Broken stored ciphertext must never be returned. Empty users stay isolated.
const b2=await login('google-b','b@example.test');db.prepare("UPDATE encrypted_snapshots_v11 SET envelope='invalid' WHERE account_id=? AND revision=1").run(b.accountId);expect(await get('/v11.11/data/snapshots/1',b2.session),503);
check(tokenCalls>=4&&jwksCalls>=4,'Google protocol used in callback');check(counts().accounts_v11>=2,'Identities persisted');check(counts().auth_oidc_sessions_v1111>=1,'Sessions persisted');check(counts().encrypted_snapshots_v11===4,'CAS did not create duplicates');
console.log(`V11.11: ${unit} comprobaciones criptográficas/contratos + ${api} comprobaciones Worker HTTP + ${sql} migraciones SQLite.`);
console.log('Sin red externa, sin credenciales reales, sin datos personales, sin despliegue.');
