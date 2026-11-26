import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import '../../../../accounts106.js';
import {createRemoteRekey1157} from '../dist/server/staging/source/V11.42-INTEGRACION/src/remote-rekey1157.mjs';
import {generateAccountSecret,importWrappingKey,unwrapAccountSecret} from '../src/account-key1150.mjs';
import {hashBytes} from '../dist/server/staging/source/V11.38-INTEGRACION/src/large-sync.mjs';
import {encrypt84,decrypt84,checksum84} from '../../../../model84.mjs';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
for(const n of ['0001_staging.sql','0006_identity_oidc.sql','0007_synthetic_journal_v115.sql','0009_large_sync.sql'])db.exec(readFileSync(new URL('../dist/migrations/'+n,import.meta.url),'utf8'));
for(const n of ['0010_managed_keys.proposed.sql','0011_remote_rekey.proposed.sql'])db.exec(readFileSync(new URL('../migrations/'+n,import.meta.url),'utf8'));
const accounts=['a','b','c','d'].map(x=>({id:'acct_'+x.repeat(32),digest:x.repeat(64),csrf:x.repeat(43)}));
for(const a of accounts){db.prepare('INSERT INTO accounts_v11 VALUES(?,?,?,?)').run(a.id,'https://accounts.google.com',a.id,new Date().toISOString());db.prepare('INSERT INTO auth_oidc_sessions_v1111 VALUES(?,?,?,?,?,?)').run(a.digest,a.id,a.csrf,a.digest,Date.now(),Date.now()+600000);db.prepare('INSERT INTO managed_account_keys_v1152(account_id,enrollment_kind) VALUES(?,\'new\')').run(a.id)}
const [A,B,C,D]=accounts,objects=new Map(),oldPhrase='frase anterior sintética',kekSecret=generateAccountSecret(),kekId='fixture-v1';let onPut=null,loseCommitAck=false;
const adapter={prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){const result=db.prepare(sql).get(...args)||null;if(loseCommitAck&&sql.startsWith("UPDATE remote_rekeys_v1157 SET phase='committed'")){loseCommitAck=false;throw Error('respuesta perdida')}return result}}}};
const bucket={async put(k,v){objects.set(k,new Uint8Array(v));const cb=onPut;onPut=null;if(cb)await cb()},async get(k){const v=objects.get(k);return v?{size:v.length,arrayBuffer:async()=>v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength)}:null}};
const service=(a,override={})=>createRemoteRekey1157({db:adapter,bucket,session:a,kekId,kekSecret,policy:globalThis.asiaAccounts106,enabled:true,...override});
const rows=a=>db.prepare('SELECT * FROM sync_v1138_objects WHERE account_id=? ORDER BY revision').all(a.id);
const keys=a=>db.prepare('SELECT * FROM managed_account_keys_v1152 WHERE account_id=?').get(a.id);
const operation=(a,source)=>({operationId:crypto.randomUUID(),expectedRevision:source.revision,expectedSha:source.sha256,confirmed:true});
async function seed(a,revision=1){
 const plain={format:'asia-v1136-sync-v1',accountId:a.id,payload:{entries:[['asia2027-v1',JSON.stringify({body:{'2026-11-26':{weight:81}},diet:{},work:{},settings:{},photos:{}})]],modules:{coach:{history:['preservar']},visual:{photos:['referencia']}}}};
 const envelope=await encrypt84(plain,oldPhrase),raw=new TextEncoder().encode(JSON.stringify(envelope)),object='legacy/'+a.id+'/'+revision,sha=await hashBytes(raw);objects.set(object,raw);
 db.prepare('INSERT INTO sync_v1138_objects VALUES(?,?,?,?,?,?)').run(a.id,revision,object,raw.length,sha,new Date().toISOString());return {plain,raw,source:rows(a).at(-1)};
}
try{
 assert.throws(()=>service(A,{enabled:false}));
 const a=await seed(A),b=await seed(B),c=await seed(C),d=await seed(D,200);
 const op=operation(A,a.source),s=service(A);
 await assert.rejects(s.begin({...op,expectedSha:'0'.repeat(64)}));assert.equal(keys(A).migration_lock,null);
 await assert.rejects(s.begin({...op,confirmed:false}));
 assert.equal((await s.begin(op)).phase,'locked');assert.equal(keys(A).migration_lock,op.operationId);assert.equal(keys(A).envelope,null);
 assert.deepEqual(await s.begin(op),await s.inspect(op.operationId));
 await assert.rejects(s.begin({...op,operationId:crypto.randomUUID()}));
 await assert.rejects(service(B).inspect(op.operationId));
 await assert.rejects(s.commit({operationId:op.operationId,confirmed:true,oldPhrase:'frase incorrecta'}));
 assert.deepEqual(rows(A),[a.source]);assert.equal(keys(A).migration_lock,op.operationId);
 // Lost response after D1 publication: retry finds durable receipt, not a second revision.
 loseCommitAck=true;await assert.rejects(s.commit({operationId:op.operationId,confirmed:true,oldPhrase}));
 const receipt=await s.commit({operationId:op.operationId,confirmed:true});assert.equal(receipt.phase,'committed');assert.equal(receipt.revision,2);
 assert.equal(rows(A).length,2);assert.deepEqual(rows(A)[0],a.source);assert.deepEqual(objects.get(a.source.object_key),a.raw);
 assert.equal(keys(A).migration_lock,null);assert.ok(keys(A).envelope);
 const secret=await unwrapAccountSecret({accountId:A.id,kekId,key:await importWrappingKey(kekSecret),envelope:JSON.parse(keys(A).envelope)});
 const target=JSON.parse(new TextDecoder().decode(objects.get(rows(A)[1].object_key)));
 assert.equal(await checksum84(await decrypt84(target,secret)),await checksum84(a.plain));await assert.rejects(decrypt84(target,oldPhrase));
 assert.equal(db.prepare('SELECT wrapped_key FROM remote_rekeys_v1157 WHERE account_id=?').get(A.id).wrapped_key,null);
 await assert.rejects(s.cancel({operationId:op.operationId,confirmed:true}));
 const opB=operation(B,b.source),sb=service(B);await sb.begin(opB);assert.equal((await sb.cancel({operationId:opB.operationId,confirmed:true})).phase,'canceled');assert.equal(keys(B).migration_lock,null);assert.equal(keys(B).envelope,null);assert.deepEqual(rows(B),[b.source]);
 await assert.rejects(sb.commit({operationId:opB.operationId,confirmed:true,oldPhrase}));
 const opC=operation(C,c.source),sc=service(C);await sc.begin(opC);
 // Revocation after upload prevents publishing, without discarding source.
 onPut=()=>db.prepare('DELETE FROM auth_oidc_sessions_v1111 WHERE account_id=?').run(C.id);
 await assert.rejects(sc.commit({operationId:opC.operationId,confirmed:true,oldPhrase}));assert.deepEqual(rows(C),[c.source]);assert.equal(keys(C).migration_lock,opC.operationId);assert.equal(keys(C).envelope,null);
 const resumed={...C,digest:'e'.repeat(64)};db.prepare('INSERT INTO auth_oidc_sessions_v1111 VALUES(?,?,?,?,?,?)').run(resumed.digest,C.id,C.csrf,C.digest,Date.now(),Date.now()+600000);
 const sr=service(resumed);assert.equal((await sr.inspect(opC.operationId)).phase,'locked');
 assert.equal((await sr.commit({operationId:opC.operationId,confirmed:true,oldPhrase})).revision,2);assert.deepEqual(rows(C)[0],c.source);
 await assert.rejects(service(D).begin(operation(D,d.source)));assert.equal(keys(D).migration_lock,null);
 console.log('Remote rekey: authenticated durable lock/receipt, exact old ciphertext, atomic key+revision, wrong phrase, isolation, cancellation, revoked upload, resumed session and lost commit acknowledgement PASS.');
}finally{db.close()}
