import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.mjs';
import {digest} from '../dist/server/staging/source/official/V11.24-STAGING/src/security1111.mjs';
import {generateAccountSecret} from '../src/account-key1150.mjs';
import {encrypt84,decrypt84} from '../../../../model84.mjs';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
for(const n of ['0001_staging.sql','0006_identity_oidc.sql','0007_synthetic_journal_v115.sql','0009_large_sync.sql'])db.exec(readFileSync(new URL('../dist/migrations/'+n,import.meta.url),'utf8'));
db.exec(readFileSync(new URL('../migrations/0010_managed_keys.proposed.sql',import.meta.url),'utf8'));
const origin='https://asia-v1142-candidate-staging.example.workers.dev';
const accounts=['a','b','c','d','e'].map(x=>({id:'acct_'+x.repeat(32),token:x.toUpperCase().repeat(43),csrf:x.repeat(43),email:x+'@example.invalid'}));
for(const a of accounts){db.prepare('INSERT INTO accounts_v11 VALUES(?,?,?,?)').run(a.id,'https://accounts.google.com',a.email,new Date().toISOString());db.prepare('INSERT INTO auth_oidc_sessions_v1111 VALUES(?,?,?,?,?,?)').run(await digest(a.token),a.id,a.csrf,await digest(a.email),Date.now(),Date.now()+600000)}
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_ALLOW_V1142_TESTS:'true',STAGING_ALLOW_MANAGED_KEYS_1152:'true',STAGING_MANAGED_KEK_ID_1152:'fixture-v1',STAGING_MANAGED_KEK_1152:generateAccountSecret(),STAGING_GOOGLE_CLIENT_ID:'test.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-only',STAGING_ALLOWED_EMAILS:accounts.map(a=>a.email).join(','),STAGING_PWA_ASSETS:{},STAGING_DB:{prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return db.prepare(sql).get(...args)||null},async run(){return db.prepare(sql).run(...args)}}}}};
const [A,B,C,D,E]=accounts;
const req=(a=A,o={})=>worker.fetch(new Request(origin+'/v11.52/account-key'+(o.query||''),{method:o.method||'POST',headers:{...(o.anonymous?{}:{Cookie:'__Host-asia1111_session='+a.token}),Origin:o.origin||origin,'X-Asia-CSRF':o.csrf||a.csrf,...o.headers},...(o.body?{body:'invalid'}:{})}),{...env,...o.env});
const enroll=a=>db.prepare('INSERT INTO managed_account_keys_v1152(account_id,enrollment_kind) VALUES(?,\'new\')').run(a.id);
const row=a=>db.prepare('SELECT envelope FROM managed_account_keys_v1152 WHERE account_id=?').get(a.id);
try{
 assert.equal((await req(A,{env:{STAGING_ALLOW_MANAGED_KEYS_1152:'false'}})).status,404);
 assert.equal((await req(A,{anonymous:true})).status,401);
 assert.equal((await req(A,{method:'GET'})).status,405);
 assert.equal((await req(A,{query:'?x=1'})).status,404);
 assert.equal((await req(A,{body:true})).status,400);
 assert.equal((await req(A,{csrf:B.csrf})).status,403);
 assert.equal((await req(A,{origin:'https://other.invalid'})).status,403);
 assert.equal((await req(A,{headers:{'X-Asia-Account':B.id}})).status,403);
 assert.equal((await req(A)).status,409);assert.equal(row(A),undefined);
 // Existing accounts remain untouched, even when OAuth retries the original INSERT OR IGNORE.
 db.exec(readFileSync(new URL('../migrations/0015_new_account_enrollment.proposed.sql',import.meta.url),'utf8'));
 db.prepare('INSERT OR IGNORE INTO accounts_v11 VALUES(?,?,?,?)').run(A.id,'https://accounts.google.com',A.email,new Date().toISOString());
 assert.equal(row(A),undefined);
 assert.equal((await req(A)).status,409);
 const F={id:'acct_'+'f'.repeat(32),token:'F'.repeat(43),csrf:'f'.repeat(43),email:'f@example.invalid'};
 db.prepare('INSERT OR IGNORE INTO accounts_v11 VALUES(?,?,?,?)').run(F.id,'https://accounts.google.com',F.email,new Date().toISOString());
 assert.deepEqual({...db.prepare('SELECT enrollment_kind,envelope FROM managed_account_keys_v1152 WHERE account_id=?').get(F.id)},{enrollment_kind:'new',envelope:null});
 db.prepare('INSERT INTO auth_oidc_sessions_v1111 VALUES(?,?,?,?,?,?)').run(await digest(F.token),F.id,F.csrf,await digest(F.email),Date.now(),Date.now()+600000);
 const extraEnv={STAGING_ALLOWED_EMAILS:F.email};
 const first=await req(F,{env:extraEnv});assert.equal(first.status,200);const firstSecret=(await first.json()).secret;
 db.prepare('INSERT OR IGNORE INTO accounts_v11 VALUES(?,?,?,?)').run(F.id,'https://accounts.google.com',F.email,new Date().toISOString());
 assert.equal((await (await req(F,{env:extraEnv})).json()).secret,firstSecret);
 // Legacy test profile G: old ciphertext remains, no managed key existed.
 const G={id:'acct_'+'1'.repeat(32),token:'G'.repeat(43),csrf:'g'.repeat(43),email:'g@example.invalid'};
 // Install the successor schema, then create a fixture representing an account predating 0015.
 db.exec(readFileSync(new URL('../migrations/0016_pilot_fresh_profiles.proposed.sql',import.meta.url),'utf8'));
 db.prepare('INSERT INTO accounts_v11 VALUES(?,?,?,?)').run(G.id,'https://accounts.google.com',G.email,new Date().toISOString());
 db.prepare('DELETE FROM managed_account_keys_v1152 WHERE account_id=?').run(G.id);
 db.prepare('INSERT INTO auth_oidc_sessions_v1111 VALUES(?,?,?,?,?,?)').run(await digest(G.token),G.id,G.csrf,await digest(G.email),Date.now(),Date.now()+600000);
 db.prepare('INSERT INTO encrypted_snapshots_v11 VALUES(?,?,?,?)').run(G.id,1,'old-ciphertext',new Date().toISOString());
 const resetEnv={...env,STAGING_ALLOWED_EMAILS:G.email,STAGING_ALLOW_PILOT_FRESH_PROFILE_V12:'true'};
 const reset=(extra={},config=resetEnv)=>worker.fetch(new Request(origin+'/v12/pilot/fresh-profile',{method:'POST',headers:{Cookie:'__Host-asia1111_session='+G.token,Origin:origin,'X-Asia-CSRF':G.csrf,'X-Asia-Fresh-Profile':'archive-legacy-v1',...extra}}),config);
 assert.equal((await reset({}, {...resetEnv,STAGING_ALLOW_PILOT_FRESH_PROFILE_V12:'false'})).status,404);
 assert.equal((await reset({'X-Asia-CSRF':A.csrf})).status,403);
 assert.equal((await reset({}, {...resetEnv,STAGING_MANAGED_KEK_1152:'invalid'})).status,409);
 const eligibility=await req(G,{env:resetEnv});assert.equal(eligibility.status,409);assert.equal((await eligibility.json()).freshProfileAvailable,true);
 assert.equal((await reset()).status,200);
 const successor=db.prepare('SELECT fresh_account_id FROM pilot_fresh_profiles_v12 WHERE legacy_account_id=?').get(G.id).fresh_account_id;
 assert.notEqual(successor,G.id);
 assert.equal(db.prepare('SELECT envelope FROM encrypted_snapshots_v11 WHERE account_id=?').get(G.id).envelope,'old-ciphertext');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM auth_oidc_sessions_v1111 WHERE account_id=?').get(G.id).n,0);
 assert.equal(db.prepare('SELECT enrollment_kind FROM managed_account_keys_v1152 WHERE account_id=?').get(successor).enrollment_kind,'new');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM encrypted_snapshots_v11 WHERE account_id=?').get(successor).n,0);
 assert.notEqual((await reset()).status,200);
 assert.throws(()=>db.prepare('INSERT INTO auth_oidc_sessions_v1111 VALUES(?,?,?,?,?,?)').run('0'.repeat(64),G.id,G.csrf,'1'.repeat(64),Date.now(),Date.now()+600000));
 enroll(A);enroll(B);enroll(C);enroll(D);enroll(E);
 const responses=await Promise.all(Array.from({length:5},()=>req(A)));
 for(const r of responses){assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/)}
 const result=await Promise.all(responses.map(r=>r.json())),secret=result[0].secret;
 assert.ok(result.every(x=>x.accountId===A.id&&x.secret===secret));assert.match(secret,/^[A-Za-z0-9_-]{43}$/);assert.ok(!row(A).envelope.includes(secret));
 const br=await req(B);assert.equal(br.status,200);const other=await br.json();assert.notEqual(other.secret,secret);
 const encrypted=await encrypt84({history:['keep']},secret);assert.deepEqual(await decrypt84(encrypted,(await (await req(A)).json()).secret),{history:['keep']});await assert.rejects(decrypt84(encrypted,other.secret));
 const original=row(A).envelope;
 assert.equal((await req(A,{env:{STAGING_MANAGED_KEK_1152:generateAccountSecret()}})).status,503);
 assert.equal((await req(A,{env:{STAGING_MANAGED_KEK_ID_1152:'other'}})).status,503);assert.equal(row(A).envelope,original);
 db.prepare('INSERT INTO sync_v1138_objects VALUES(?,?,?,?,?,?)').run(C.id,1,'old-object',10,'old-hash',new Date().toISOString());
 db.prepare('INSERT INTO synthetic_journal_v115 VALUES(?,?,?,?)').run(D.id,1,'x'.repeat(24),new Date().toISOString());
 db.prepare('INSERT INTO encrypted_snapshots_v11 VALUES(?,?,?,?)').run(E.id,1,'old',new Date().toISOString());
 for(const a of [C,D,E]){assert.equal((await req(a)).status,409);assert.equal(row(a).envelope,null)}
 const rotation={STAGING_ALLOW_KEK_ROTATION_1172:'true',STAGING_MANAGED_KEK_ID_1152:'fixture-v2',STAGING_MANAGED_KEK_1152:generateAccountSecret(),STAGING_PREVIOUS_KEK_ID_1172:env.STAGING_MANAGED_KEK_ID_1152,STAGING_PREVIOUS_KEK_1172:env.STAGING_MANAGED_KEK_1152};
 assert.equal((await req(A,{env:{...rotation,STAGING_ALLOW_KEK_ROTATION_1172:'false'}})).status,503);assert.equal(row(A).envelope,original);
 assert.equal((await req(A,{env:{...rotation,STAGING_PREVIOUS_KEK_1172:generateAccountSecret()}})).status,503);assert.equal(row(A).envelope,original);
 const rotated=await Promise.all(Array.from({length:5},()=>req(A,{env:rotation})));
 for(const r of rotated){assert.equal(r.status,200);assert.equal((await r.json()).secret,secret)}
 const updated=row(A).envelope;assert.notEqual(updated,original);assert.equal(JSON.parse(updated).kekId,'fixture-v2');
 assert.deepEqual(await decrypt84(encrypted,(await (await req(A,{env:rotation})).json()).secret),{history:['keep']});
 assert.equal((await req(A)).status,503);assert.equal(row(A).envelope,updated);
 db.prepare('DELETE FROM auth_oidc_sessions_v1111 WHERE account_id=?').run(A.id);
 assert.equal((await req(A,{env:rotation})).status,401);assert.equal(row(A).envelope,updated);
 console.log('Managed account key: disabled by default, explicit enrollment, 5 concurrent requests, isolation, legacy cloud blockers, KEK failure and revoked session PASS.');
}finally{db.close()}
