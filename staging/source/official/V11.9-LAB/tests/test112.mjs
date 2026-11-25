import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import api from '../api-staging.mjs';
import {b64u111} from '../auth111-crypto.mjs';
let count=0;
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const ok=(a,label)=>{assert.ok(a,label);count++;};
const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON;');
for(const f of ['0001_staging.sql','0002_auth_staging.sql','0003_auth_test_keys.sql'])sql.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
const wrap=db=>({prepare(query){let args=[];return {query,get q(){return query;},get args(){return args;},bind(...xs){args=xs;return this;},async first(){return db.prepare(query).get(...args)||null;},async all(){return {results:db.prepare(query).all(...args)};},async run(){return {meta:{changes:Number(db.prepare(query).run(...args).changes)}};}};},async batch(statements){db.exec('BEGIN IMMEDIATE');try{const result=statements.map(x=>db.prepare(x.query).run(...x.args));db.exec('COMMIT');return result.map(x=>({meta:{changes:Number(x.changes)}}));}catch(e){db.exec('ROLLBACK');throw e;}}});
const operator='o'.repeat(43),env={STAGING_MODE:'asia-v11-staging-110',STAGING_API_TOKEN:operator,STAGING_DB:wrap(sql),AUTH_PEPPER_V111:b64u111(randomBytes(32))};
const base='https://staging.invalid',root='/v11/data/snapshots';
const make=(path,method='GET',{session,auth=true,body,headers={}}={})=>new Request(base+path,{method,headers:{...(auth?{Authorization:'Bearer '+operator}:{}),...(session?{'X-Asia-Session':session}:{}),...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)})});
async function request(path,method='GET',opts={},expected=200){const r=await api.fetch(make(path,method,opts),env);eq(r.status,expected,`${method} ${path}`);eq(r.headers.get('Cache-Control'),'no-store');eq(r.headers.get('Access-Control-Allow-Origin'),null);eq(r.headers.get('Set-Cookie'),null);return r.json();}
async function requestEnv(path,method,opts,environment,expected){const r=await api.fetch(make(path,method,opts),environment);eq(r.status,expected);return r.json();}
const shell=()=>({format:'asia84-encrypted-v1',salt:randomBytes(16).toString('base64'),iv:randomBytes(12).toString('base64'),cipher:randomBytes(48).toString('base64')});
const register=async u=>{const r=await request('/v11/auth/register','POST',{body:{username:u}},201);return r.test_key;};
const login=async(u,key)=>{const r=await request('/v11/auth/login','POST',{body:{username:u,test_key:key}});return r.session;};
const keyA=await register('test_alfa112'),keyB=await register('test_bravo112');
const a=await login('test_alfa112',keyA),b=await login('test_bravo112',keyB);
const list=async(session,expected=200)=>request(root,'GET',{session},expected);
const read=async(session,revision,expected=200)=>request(root+'/'+revision,'GET',{session},expected);
const append=async(session,expectedRevision,envelope=shell(),expected=201)=>request(root,'POST',{session,body:{expectedRevision,envelope}},expected);
eq((await request('/v11/status')).version,'11.2');
for(const p of ['/v11/data/snapshots','/v11/data/snapshots/1']){await request(p,'GET',{},401);await request(p,'GET',{auth:false,session:a},401);await request(p,'GET',{session:'acct_'+'a'.repeat(32)},401);}
for(const p of ['/v11/data/snapshots?account_id=acct_aaa','/v11/data/snapshots/1?revision=2'])await request(p,'GET',{session:a},400);
for(const header of ['X-Asia-Account','X-Account-ID','X-User-ID'])await request(root,'GET',{session:a,headers:{[header]:'acct_'+'b'.repeat(32)}},400);
await request(root,'GET',{session:a,headers:{Origin:'https://other.invalid'}},403);
await request(root,'GET',{session:a,headers:{Authorization:'Bearer invalid'}},401);
await request(root,'DELETE',{session:a},405);
await request(root+'/1','POST',{session:a,body:{}},405);
for(const extra of ['/0','/0001','/1/delete','/abc','/1e2','/-1','/10001','/1%2F2','/9999999999999'])await request(root+extra,'GET',{session:a},404);
await request('/v11/data/devices','GET',{session:a},404);
for(const [envPatch,expected] of [[{STAGING_DB:null},503],[{DB:{prepare(){}}},503],[{AUTH_PEPPER_V111:'wrong'},503],[{STAGING_MODE:'production'},503]])await requestEnv(root,'GET',{session:a},{...env,...envPatch},expected);
eq((await list(a)).head,0);eq((await list(b)).head,0);
await read(a,1,404);
const envA=shell(),envB=shell();const rA=await append(a,0,envA);eq(rA.revision,1);
eq((await list(a)).head,1);eq((await list(b)).head,0);
await read(b,1,404);
const loadedA=await read(a,1);eq(loadedA.envelope,envA);ok(!JSON.stringify(loadedA).includes('acct_'));
const rB=await append(b,0,envB);eq(rB.revision,1);
eq((await read(b,1)).envelope,envB);eq((await read(a,1)).envelope,envA);
eq((await list(b)).versions.length,1);eq((await list(a)).versions.length,1);
await append(a,0,shell(),409);await append(b,0,shell(),409);
const rA2=await append(a,1);eq(rA2.revision,2);await read(b,2,404);
await request(root,'POST',{session:a,body:{account_id:'acct_'+'b'.repeat(32),expectedRevision:2,envelope:shell()}},400);
await request(root,'POST',{session:a,body:{expectedRevision:2,envelope:shell(),subject:'test_bravo112'}},400);
await request(root,'POST',{session:a,body:{expectedRevision:2,envelope:shell()},headers:{'X-Account-ID':'acct_'+'b'.repeat(32)}},400);
for(const rev of [-1,2.5,'2','2 OR 1=1',10000,Number.MAX_SAFE_INTEGER])await request(root,'POST',{session:a,body:{expectedRevision:rev,envelope:shell()}},400);
for(const change of [{salt:'fake'},{iv:'not base64'},{cipher:'?bad'},{cipher:'AA=='},{format:'plaintext'},{extra:'text'},{cipher:'a'.repeat(100001)}])await request(root,'POST',{session:a,body:{expectedRevision:2,envelope:{...shell(),...change}}},400);
for(const invalid of [null,{},[],{format:'asia84-encrypted-v1'},'plaintext'])await request(root,'POST',{session:a,body:{expectedRevision:2,envelope:invalid}},400);
await request(root,'POST',{session:a,body:JSON.stringify({expectedRevision:2,envelope:shell()})+'\nTRAILING'},400);
await request(root,'POST',{session:a,body:{expectedRevision:2,envelope:shell()},headers:{'Content-Type':'text/plain'}},415);
await request(root,'POST',{session:a,body:{expectedRevision:2,envelope:shell()},headers:{'Content-Length':'99999999'}},413);
const huge=shell();huge.cipher='A'.repeat(900100);await request(root,'POST',{session:a,body:{expectedRevision:2,envelope:huge}},413);
// Connection-scope validation: malicious account selector never reaches an unscoped SQL query.
const statements=[];const recorder={prepare(q){statements.push(q);return env.STAGING_DB.prepare(q);},batch:env.STAGING_DB.batch};
await requestEnv(root,'GET',{session:a},{...env,STAGING_DB:recorder},200);
for(const q of statements.filter(q=>/encrypted_snapshots_v11/.test(q)))ok(/account_id\s*=\s*\?/.test(q),'Query must filter by bound account ID');
const responses=await Promise.all([api.fetch(make(root,'POST',{session:a,body:{expectedRevision:2,envelope:shell()}}),env),api.fetch(make(root,'POST',{session:a,body:{expectedRevision:2,envelope:shell()}}),env)]);eq(responses.map(x=>x.status).sort((x,y)=>x-y),[201,409]);
// The order of responses is nondeterministic; assert via DB directly instead.
eq(sql.prepare('SELECT MAX(revision) AS v FROM encrypted_snapshots_v11 WHERE account_id=(SELECT account_id FROM accounts_v11 WHERE subject=?)').get('test_alfa112').v,3);
const acctA=sql.prepare('SELECT account_id FROM accounts_v11 WHERE subject=?').get('test_alfa112').account_id;
const acctB=sql.prepare('SELECT account_id FROM accounts_v11 WHERE subject=?').get('test_bravo112').account_id;
eq(sql.prepare('SELECT COUNT(*) AS n FROM encrypted_snapshots_v11 WHERE account_id=?').get(acctA).n,3);
eq(sql.prepare('SELECT COUNT(*) AS n FROM encrypted_snapshots_v11 WHERE account_id=?').get(acctB).n,1);
// Reverse order & account-specific revisions; append one more only on B.
await append(b,1);eq((await list(a)).head,3);eq((await list(b)).head,2);
await request('/v11/auth/logout','POST',{session:a});await list(a,401);await read(a,1,401);
eq((await read(b,1)).envelope,envB);
const a2=await login('test_alfa112',keyA);eq((await list(a2)).head,3);
// Expire session in real SQLite: account A loses access but B remains valid.
sql.prepare('UPDATE auth_sessions_v111 SET created_at=?,expires_at=? WHERE account_id=?').run(Date.now()-10800000,Date.now()-1000,acctA);
await list(a2,401);eq((await list(b)).head,2);
// Corrupt test row: reject it on read without leaking invalid ciphertext.
sql.prepare('UPDATE encrypted_snapshots_v11 SET envelope=? WHERE account_id=? AND revision=1').run('{"format":"plaintext"}',acctB);
await read(b,1,503);
// Mismatched marker and legacy production schema fail closed.
sql.exec('DELETE FROM staging_identity_v110');await list(b,503);
sql.prepare('INSERT INTO staging_identity_v110(id,marker) VALUES(1,?)').run('asia-v11-staging-110');sql.exec('CREATE TABLE health_daily(dummy TEXT)');await list(b,503);
eq(sql.prepare('PRAGMA integrity_check').get().integrity_check,'ok');eq(sql.prepare('PRAGMA foreign_key_check').all().length,0);
console.log(`V11.2: ${count} assertions verified (SQLite/WebCrypto reales; API de D1 simulada; dos cuentas ficticias).`);
