// Real local workerd D1 and R2 bindings, disposable, no cloud account.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import worker from '../dist/server/index.mjs';
import {digest} from '../dist/server/staging/source/official/V11.24-STAGING/src/security1111.mjs';
import {hashBytes} from '../dist/server/staging/source/V11.38-INTEGRACION/src/large-sync.mjs';
import {generateAccountSecret} from '../src/account-key1150.mjs';
import {encrypt84,decrypt84} from '../../../../model84.mjs';
const root=process.env.ASIA_MINIFLARE_ROOT;assert.ok(root);
const require=createRequire(join(root,'package.json'));
const {Miniflare}=require('miniflare');
// Pin stable v4 API independently of Wrangler's changing beta dependency.
const mf=new Miniflare({modules:true,script:"export default {fetch(){return new Response('synthetic')}}",d1Databases:{STAGING_DB:'asia-ci-local-d1'},r2Buckets:{STAGING_SYNC_OBJECTS:'asia-ci-local-r2'}});
try{
 const db=await mf.getD1Database('STAGING_DB'),bucket=await mf.getR2Bucket('STAGING_SYNC_OBJECTS');
 const files=['0001_staging.sql','0006_identity_oidc.sql','0007_synthetic_journal_v115.sql','0009_large_sync.sql'].map(n=>new URL('../dist/migrations/'+n,import.meta.url).pathname).concat(['0010_managed_keys.proposed.sql','0011_remote_rekey.proposed.sql'].map(n=>new URL('../migrations/'+n,import.meta.url).pathname));
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
 const committed=await rekey(a,{action:'commit',operationId,confirmed:true,oldPhrase:phrase,consent:'transient-server-rekey-v1'});assert.equal(committed.status,200);assert.equal((await committed.json()).operation.phase,'committed');
 const keyResponse=await worker.fetch(new Request(origin+'/v11.52/account-key',{method:'POST',headers:{Cookie:'__Host-asia1111_session='+b.token,Origin:origin,'X-Asia-CSRF':b.csrf}}),env);assert.equal(keyResponse.status,200);const secret=(await keyResponse.json()).secret;
 const remote=await call(b,'/v11.38/sync/2');assert.equal(remote.status,200);assert.deepEqual(await decrypt84((await remote.json()).envelope,secret),plain);
 assert.equal((await write(b,2)).status,409);
 const managed=await encrypt84(plain,secret);
 await run('DELETE FROM auth_oidc_sessions_v1111 WHERE token_digest=?',await digest(a.token));
 assert.equal((await write(a,2,managed,'managed-v1')).status,401);
 assert.equal((await write(b,2,managed,'managed-v1')).status,201);
 assert.equal((await (await call(b,'/v11.38/sync')).json()).head,3);
 assert.deepEqual(new Uint8Array(await (await bucket.get(source.object_key)).arrayBuffer()),original);
 assert.equal((await first('SELECT COUNT(*) AS n FROM sync_v1138_objects WHERE account_id=?',other)).n,0);
 console.log('Local workerd D1/R2: exact migration chain, concurrent CAS, isolated accounts, rekey trigger transaction, session revocation and original ciphertext PASS');
}finally{await mf.dispose()}
