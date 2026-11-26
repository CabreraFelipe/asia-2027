// Actual packaged Worker + SQLite and R2-shaped disposable memory fixture.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.mjs';
import {digest} from '../dist/server/staging/source/official/V11.24-STAGING/src/security1111.mjs';
import {generateAccountSecret} from '../src/account-key1150.mjs';
import {encrypt84} from '../../../../model84.mjs';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
for(const n of ['0001_staging.sql','0006_identity_oidc.sql','0007_synthetic_journal_v115.sql','0009_large_sync.sql'])db.exec(readFileSync(new URL('../dist/migrations/'+n,import.meta.url),'utf8'));
db.exec(readFileSync(new URL('../migrations/0010_managed_keys.proposed.sql',import.meta.url),'utf8'));
const origin='https://asia-v1142-candidate-staging.example.workers.dev';
const accounts=['a','b','c','d'].map(x=>({id:'acct_'+x.repeat(32),token:x.toUpperCase().repeat(43),csrf:x.repeat(43),email:x+'@example.invalid'}));
for(const a of accounts){db.prepare('INSERT INTO accounts_v11 VALUES(?,?,?,?)').run(a.id,'https://accounts.google.com',a.email,new Date().toISOString());db.prepare('INSERT INTO auth_oidc_sessions_v1111 VALUES(?,?,?,?,?,?)').run(await digest(a.token),a.id,a.csrf,await digest(a.email),Date.now(),Date.now()+600000)}
const [A,B,C,D]=accounts,objects=new Map();let onPut=null,puts=0;
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_ALLOW_V1142_TESTS:'true',STAGING_ALLOW_V1138_TESTS:'true',STAGING_ALLOW_MANAGED_KEYS_1152:'true',STAGING_MANAGED_KEK_ID_1152:'fixture-v1',STAGING_MANAGED_KEK_1152:generateAccountSecret(),STAGING_GOOGLE_CLIENT_ID:'test.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-only',STAGING_ALLOWED_EMAILS:accounts.map(a=>a.email).join(','),STAGING_PWA_ASSETS:{},STAGING_DB:{prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){return db.prepare(sql).run(...args)}}}},
 STAGING_SYNC_OBJECTS:{async put(k,v){puts++;objects.set(k,new Uint8Array(v));const callback=onPut;onPut=null;if(callback)await callback()},async get(k){const v=objects.get(k);return v?{size:v.length,arrayBuffer:async()=>v.buffer.slice(0)}:null},async delete(k){objects.delete(k)}}};
const headers=a=>({Cookie:'__Host-asia1111_session='+a.token,Origin:origin,'X-Asia-CSRF':a.csrf});
const key=a=>worker.fetch(new Request(origin+'/v11.52/account-key',{method:'POST',headers:headers(a)}),env);
const legacy=await encrypt84({history:['legacy fixture']},'frase sintética legacy');
const write=(a,expectedRevision,envelope=legacy,epoch=null,overrides={})=>worker.fetch(new Request(origin+'/v11.38/sync',{method:'POST',headers:{...headers(a),'Content-Type':'application/json',...(epoch===null?{}:{'X-Asia-Key-Epoch':epoch})},body:JSON.stringify({expectedRevision,envelope})}),{...env,...overrides});
const read=(a,revision=null)=>worker.fetch(new Request(origin+'/v11.38/sync'+(revision===null?'':'/'+revision),{headers:headers(a)}),env);
const rows=a=>db.prepare('SELECT * FROM sync_v1138_objects WHERE account_id=? ORDER BY revision').all(a.id);
const enroll=a=>db.prepare('INSERT INTO managed_account_keys_v1152(account_id) VALUES(?)').run(a.id);
const lock=a=>db.prepare('UPDATE managed_account_keys_v1152 SET migration_lock=? WHERE account_id=?').run(crypto.randomUUID(),a.id);
const unlock=a=>db.prepare('UPDATE managed_account_keys_v1152 SET migration_lock=NULL WHERE account_id=?').run(a.id);
try{
 // Legacy writer remains compatible when no migration state exists.
 assert.equal((await write(A,0)).status,201);
 const original=rows(A),originalBytes=Buffer.from(objects.get(original[0].object_key));
 enroll(A);lock(A);
 const before=puts;
 assert.equal((await write(A,1)).status,409);
 assert.equal((await write(A,1,legacy,'managed-v1')).status,409);
 assert.equal(puts,before);
 const locked=await key(A);assert.equal(locked.status,409);assert.equal((await locked.json()).error,'MIGRACION_EN_CURSO');
 assert.equal((await read(A,1)).status,200);assert.deepEqual(rows(A),original);
 assert.deepEqual(Buffer.from(objects.get(original[0].object_key)),originalBytes);
 // Managed account rejects stale clients while correct marked writes work.
 enroll(B);const br=await key(B);assert.equal(br.status,200);const secret=(await br.json()).secret;
 const managed=await encrypt84({history:['managed fixture']},secret);
 assert.equal((await write(B,0)).status,409);
 assert.equal((await write(B,0,managed,'unknown')).status,400);
 assert.equal((await write(B,0,managed,'managed-v1',{STAGING_ALLOW_MANAGED_KEYS_1152:'false'})).status,409);
 assert.equal((await write(B,0,managed,'managed-v1')).status,201);
 const originalB=rows(B),originalBBytes=Buffer.from(objects.get(originalB[0].object_key));
 // Fence begins while upload is in flight: final D1 CAS refuses publication.
 onPut=()=>lock(B);assert.equal((await write(B,1,managed,'managed-v1')).status,409);
 assert.deepEqual(rows(B),originalB);assert.deepEqual(Buffer.from(objects.get(originalB[0].object_key)),originalBBytes);
 assert.equal(objects.size,2);assert.equal((await key(B)).status,409);unlock(B);
 assert.equal((await write(B,1,managed,'managed-v1')).status,201);
 // Race: first key issuance happens after an old writer has uploaded but
 // before its D1 publication. Issuance wins; stale writer never becomes head.
 enroll(C);let issued;
 onPut=async()=>{const response=await key(C);assert.equal(response.status,200);issued=(await response.json()).secret};
 assert.equal((await write(C,0)).status,409);assert.equal(rows(C).length,0);assert.match(issued,/^[A-Za-z0-9_-]{43}$/);
 assert.equal((await write(C,0,await encrypt84({history:['new']},issued),'managed-v1')).status,201);
 // Conversely a committed legacy write blocks subsequent key issuance.
 enroll(D);assert.equal((await write(D,0)).status,201);
 const blocked=await key(D);assert.equal(blocked.status,409);assert.equal((await blocked.json()).error,'MIGRACION_REQUERIDA');
 assert.equal(db.prepare('SELECT envelope FROM managed_account_keys_v1152 WHERE account_id=?').get(D.id).envelope,null);
 assert.equal((await write(D,1,legacy,'managed-v1')).status,409);
 assert.deepEqual(rows(A),original);
 console.log('Write fence: legacy compatibility, account isolation, lock, stale writer, in-flight lock/issuance races, original ciphertext retained PASS.');
}finally{db.close()}
