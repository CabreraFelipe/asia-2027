// Real local workerd D1 and R2 bindings, disposable, no cloud account.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import worker from '../dist/server/index.mjs';
import {digest} from '../dist/server/staging/source/official/V11.24-STAGING/src/security1111.mjs';
import {hashBytes} from '../dist/server/staging/source/V11.38-INTEGRACION/src/large-sync.mjs';
import {generateAccountSecret} from '../src/account-key1150.mjs';
import {createCoachQuota1186} from '../dist/server/staging/source/V11.42-INTEGRACION/src/coach-quota1186.mjs';
import {createCoachRoute1186} from '../dist/server/staging/source/V11.42-INTEGRACION/src/coach-route1186.mjs';
import {encrypt84,decrypt84} from '../../../../model84.mjs';
const root=process.env.ASIA_MINIFLARE_ROOT;assert.ok(root);
const require=createRequire(join(root,'package.json'));
const {Miniflare}=require('miniflare');
// Pin stable v4 API independently of Wrangler's changing beta dependency.
const mf=new Miniflare({modules:true,script:"export default {fetch(){return new Response('synthetic')}}",d1Databases:{STAGING_DB:'asia-ci-local-d1'},r2Buckets:{STAGING_SYNC_OBJECTS:'asia-ci-local-r2'}});
try{
 const db=await mf.getD1Database('STAGING_DB'),bucket=await mf.getR2Bucket('STAGING_SYNC_OBJECTS');
 const files=['0001_staging.sql','0006_identity_oidc.sql','0007_synthetic_journal_v115.sql','0009_large_sync.sql'].map(n=>new URL('../dist/migrations/'+n,import.meta.url).pathname).concat(['0010_managed_keys.proposed.sql','0011_remote_rekey.proposed.sql','0012_coach_quota.proposed.sql'].map(n=>new URL('../migrations/'+n,import.meta.url).pathname));
 // SQLite's own complete_statement handles triggers, quoted semicolons and comments.
 const split="import sqlite3,sys,json\na=[]\nfor path in sys.argv[1:]:\n s=''\n for line in open(path):\n  if not s.strip() and line.lstrip().startswith('--'): continue\n  s+=line\n  if sqlite3.complete_statement(s): a.append(s.strip());s=''\n if s.strip() and not all(x.strip().startswith('--') or not x.strip() for x in s.splitlines()): raise ValueError('Incomplete SQL')\nprint(json.dumps(a))";
 const statements=JSON.parse(execFileSync('python3',['-c',split,...files],{encoding:'utf8'}));
 for(const sql of statements)await db.prepare(sql).run();
 const origin='https://asia-v1142-candidate-staging.example.workers.dev',id='acct_'+'a'.repeat(32),other='acct_'+'b'.repeat(32);
 const sessions=[{id,token:'A'.repeat(43),csrf:'a'.repeat(43),email:'a@example.invalid'},{id,token:'B'.repeat(43),csrf:'b'.repeat(43),email:'a@example.invalid'},{id:other,token:'C'.repeat(43),csrf:'c'.repeat(43),email:'b@example.invalid'}];
 const run=(sql,...args)=>db.prepare(sql).bind(...args).run(),first=(sql,...args)=>db.prepare(sql).bind(...args).first();
 for(const [account,subject] of [[id,'a'],[other,'b']])await run('INSERT INTO accounts_v11 VALUES(?,?,?,?)',account,'https://accounts.google.com',subject,new Date().toISOString());
 for(const s of sessions)await run('INSERT INTO auth_oidc_sessions_v1111 VALUES(?,?,?,?,?,?)',await digest(s.token),s.id,s.csrf,await digest(s.email),Date.now(),Date.now()+600000);
 await run("INSERT INTO managed_account_keys_v1152(account_id,enrollment_kind) VALUES(?,'legacy')",id);
 const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_ALLOW_V1142_TESTS:'true',STAGING_ALLOW_V1138_TESTS:'true',STAGING_ALLOW_MANAGED_KEYS_1152:'true',STAGING_ALLOW_REMOTE_REKEY_1159:'true',STAGING_MANAGED_KEK_ID_1152:'ci-v1',STAGING_MANAGED_KEK_1152:generateAccountSecret(),STAGING_GOOGLE_CLIENT_ID:'test.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-only',STAGING_ALLOWED_EMAILS:'a@example.invalid,b@example.invalid',STAGING_PWA_ASSETS:{},STAGING_DB:db,STAGING_SYNC_OBJECTS:bucket};
 const call=(s,path,body,epoch)=>worker.fetch(new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{Cookie:'__Host-asia1111_session='+s.token,Origin:origin,'X-Asia-CSRF':s.csrf,...(body===undefined?{}:{'Content-Type':'application/json'}),...(epoch?{'X-Asia-Key-Epoch':epoch}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
 // Real D1 atomic reservations; no provider request from synthetic account.
 let clock=Date.now();const quota=createCoachQuota1186({db,now:()=>clock,perMinute:2,perDay:3,globalPerDay:4});
 const reqId=()=>crypto.randomUUID(),duplicate=reqId();
 const repeat=await Promise.all([quota(id,duplicate),quota(id,duplicate)]);assert.equal(repeat.filter(Boolean).length,1);
 const race=await Promise.all([quota(id,reqId()),quota(id,reqId()),quota(id,reqId())]);assert.equal(race.filter(Boolean).length,1);
 assert.equal(await quota(other,reqId()),true);
 clock+=60001;assert.equal(await quota(id,reqId()),true);assert.equal(await quota(id,reqId()),false);assert.equal(await quota(other,reqId()),false);
 clock+=86400001;assert.equal(await quota(id,duplicate),false);assert.equal(await quota(other,reqId()),true);
 assert.equal(await quota('acct_'+'f'.repeat(32),reqId()),false);
 const session={ok:true,syntheticOnly:false,accountId:id,csrf:'fixture-csrf-token-long-123'},input={version:1,question:'Prueba sintética',goal:'Fuerza',routine:[{name:'Press banca con barra',sets:3,min:8,max:10,rest:90}],availableMinutes:60,scope:'once',choices:[]},reply={kind:'advice',answer:'Respuesta inyectada de prueba',questions:[],operations:[]};
 let auth=session,upstream=0;const setup={origin,authenticate:async()=>auth,db,now:()=>clock,apiKey:'fixture-not-real-secret-123456',model:'test-model',limits:{perMinute:2,perDay:3,globalPerDay:4},fetchImpl:async()=>{upstream++;return new Response(JSON.stringify({status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(reply)}]}]}),{headers:{'Content-Type':'application/json'}})}};
 assert.throws(()=>createCoachRoute1186(setup));const route=createCoachRoute1186({...setup,enabled:true}),request=reqId();
 const ask=()=>new Request(origin+'/coach/v1/suggest',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Asia-CSRF':session.csrf,'X-Asia-Coach-Consent':'reviewed-v1','X-Asia-Coach-Request':request},body:JSON.stringify(input)});
 auth={...session,syntheticOnly:true};assert.equal((await route.fetch(ask())).status,401);assert.equal(upstream,0);
 auth=session;const calls=await Promise.all([route.fetch(ask()),route.fetch(ask())]);assert.deepEqual(calls.map(x=>x.status).sort(),[200,429]);assert.equal(upstream,1);
 assert.deepEqual(await calls.find(x=>x.status===200).json(),{ok:true,reply});
 assert.equal((await worker.fetch(ask(),env)).status,405); // production composition NOT mounted in pilot
 const [a,b,c]=sessions,phrase='frase sintética runtime D1';
 const plain={format:'asia-v1136-sync-v1',accountId:id,payload:{entries:[['asia2027-v1',JSON.stringify({body:{'2026-11-26':{weight:81}},diet:{},work:{},settings:{},photos:{}})]],modules:{}}};
 const envelope=await encrypt84(plain,phrase),write=(s,expectedRevision,e=envelope,epoch)=>call(s,'/v11.38/sync',{expectedRevision,envelope:e},epoch);
 const attempts=await Promise.all([write(a,0),write(b,0)]);assert.deepEqual(attempts.map(r=>r.status).sort(),[201,409]);
 const source=await first('SELECT * FROM sync_v1138_objects WHERE account_id=? AND revision=1',id);assert.ok(source);
 const original=new Uint8Array(await (await bucket.get(source.object_key)).arrayBuffer());assert.equal(await hashBytes(original),source.sha256);
 assert.equal((await call(c,'/v11.38/sync/1')).status,404);
 const operationId=crypto.randomUUID(),rekey=(s,body)=>call(s,'/v11.59/rekey',body);
 const started=await rekey(a,{action:'begin',operationId,expectedRevision:1,expectedSha:source.sha256,confirmed:true});assert.equal(started.status,200);assert.equal((await started.json()).operation.phase,'locked');
 assert.equal((await write(b,1)).status,409);
 // Rotate during an existing migration: the old operation's wrapper remains readable.
 Object.assign(env,{STAGING_ALLOW_KEK_ROTATION_1172:'true',STAGING_PREVIOUS_KEK_ID_1172:env.STAGING_MANAGED_KEK_ID_1152,STAGING_PREVIOUS_KEK_1172:env.STAGING_MANAGED_KEK_1152,STAGING_MANAGED_KEK_ID_1152:'ci-v2',STAGING_MANAGED_KEK_1152:generateAccountSecret()});
 const committed=await rekey(a,{action:'commit',operationId,confirmed:true,oldPhrase:phrase,consent:'transient-server-rekey-v1'});assert.equal(committed.status,200);assert.equal((await committed.json()).operation.phase,'committed');
 const keyResponse=await worker.fetch(new Request(origin+'/v11.52/account-key',{method:'POST',headers:{Cookie:'__Host-asia1111_session='+b.token,Origin:origin,'X-Asia-CSRF':b.csrf}}),env);assert.equal(keyResponse.status,200);const secret=(await keyResponse.json()).secret;
 assert.equal(JSON.parse((await first('SELECT envelope FROM managed_account_keys_v1152 WHERE account_id=?',id)).envelope).kekId,'ci-v2');
 const remote=await call(b,'/v11.38/sync/2');assert.equal(remote.status,200);assert.deepEqual(await decrypt84((await remote.json()).envelope,secret),plain);
 assert.equal((await write(b,2)).status,409);
 const managed=await encrypt84(plain,secret);
 await run('DELETE FROM auth_oidc_sessions_v1111 WHERE token_digest=?',await digest(a.token));
 assert.equal((await write(a,2,managed,'managed-v1')).status,401);
 assert.equal((await write(b,2,managed,'managed-v1')).status,201);
 assert.equal((await (await call(b,'/v11.38/sync')).json()).head,3);
 assert.deepEqual(new Uint8Array(await (await bucket.get(source.object_key)).arrayBuffer()),original);
 assert.equal((await first('SELECT COUNT(*) AS n FROM sync_v1138_objects WHERE account_id=?',other)).n,0);
 // Actual D1 trigger transaction for a legacy pilot profile, using account B.
 for(const n of ['0015_new_account_enrollment.proposed.sql','0016_pilot_fresh_profiles.proposed.sql']){
  const path=new URL('../migrations/'+n,import.meta.url).pathname;
  for(const sql of JSON.parse(execFileSync('python3',['-c',split,path],{encoding:'utf8'})))await db.prepare(sql).run();
 }
 Object.assign(env,{STAGING_ALLOW_PILOT_FRESH_PROFILE_V12:'true'});
 const reset=()=>worker.fetch(new Request(origin+'/v12/pilot/fresh-profile',{method:'POST',headers:{Cookie:'__Host-asia1111_session='+c.token,Origin:origin,'X-Asia-CSRF':c.csrf,'X-Asia-Fresh-Profile':'archive-legacy-v1'}}),env);
 const resets=await Promise.all([reset(),reset()]);
 assert.equal(resets.filter(r=>r.status===200).length,1);
 const successor=await first('SELECT fresh_account_id FROM pilot_fresh_profiles_v12 WHERE legacy_account_id=?',other);
 assert.ok(successor?.fresh_account_id&&successor.fresh_account_id!==other);
 assert.equal((await first('SELECT enrollment_kind FROM managed_account_keys_v1152 WHERE account_id=?',successor.fresh_account_id)).enrollment_kind,'new');
 assert.equal((await first('SELECT COUNT(*) AS n FROM auth_oidc_sessions_v1111 WHERE account_id=?',other)).n,0);
 assert.equal((await call(c,'/v11.11/auth/me')).status,401);
 assert.equal((await call(b,'/v11.11/auth/me')).status,200);
 assert.deepEqual(new Uint8Array(await (await bucket.get(source.object_key)).arrayBuffer()),original);
 console.log('Local workerd D1/R2: exact migration chain, concurrent CAS, isolated accounts, rekey trigger transaction, session revocation and original ciphertext PASS');
}finally{await mf.dispose()}
