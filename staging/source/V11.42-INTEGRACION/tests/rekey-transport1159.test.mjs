// Actual packaged Worker + SQLite and R2-shaped disposable memory fixture.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.mjs';
import {digest} from '../dist/server/staging/source/official/V11.24-STAGING/src/security1111.mjs';
import {generateAccountSecret} from '../src/account-key1150.mjs';
import {encrypt84,decrypt84,checksum84} from '../../../../model84.mjs';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
for(const n of ['0001_staging.sql','0006_identity_oidc.sql','0007_synthetic_journal_v115.sql','0009_large_sync.sql'])db.exec(readFileSync(new URL('../dist/migrations/'+n,import.meta.url),'utf8'));
db.exec(readFileSync(new URL('../migrations/0010_managed_keys.proposed.sql',import.meta.url),'utf8'));
db.exec(readFileSync(new URL('../migrations/0011_remote_rekey.proposed.sql',import.meta.url),'utf8'));
const origin='https://asia-v1142-candidate-staging.example.workers.dev';
const accounts=['a','b','c','d','e','f'].map(x=>({id:'acct_'+x.repeat(32),token:x.toUpperCase().repeat(43),csrf:x.repeat(43),email:x+'@example.invalid'}));
for(const a of accounts){db.prepare('INSERT INTO accounts_v11 VALUES(?,?,?,?)').run(a.id,'https://accounts.google.com',a.email,new Date().toISOString());db.prepare('INSERT INTO auth_oidc_sessions_v1111 VALUES(?,?,?,?,?,?)').run(await digest(a.token),a.id,a.csrf,await digest(a.email),Date.now(),Date.now()+600000)}
const [A,B,C,D,E,F]=accounts,objects=new Map();let onPut=null,puts=0;
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_ALLOW_V1142_TESTS:'true',STAGING_ALLOW_V1138_TESTS:'true',STAGING_ALLOW_MANAGED_KEYS_1152:'true',STAGING_ALLOW_REMOTE_REKEY_1159:'true',STAGING_MANAGED_KEK_ID_1152:'fixture-v1',STAGING_MANAGED_KEK_1152:generateAccountSecret(),STAGING_GOOGLE_CLIENT_ID:'test.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-only',STAGING_ALLOWED_EMAILS:accounts.slice(0,5).map(a=>a.email).join(','),STAGING_PWA_ASSETS:{},STAGING_DB:{prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){return db.prepare(sql).run(...args)}}}},
 STAGING_SYNC_OBJECTS:{async put(k,v){puts++;objects.set(k,new Uint8Array(v));const callback=onPut;onPut=null;if(callback)await callback()},async get(k){const v=objects.get(k);return v?{size:v.length,arrayBuffer:async()=>v.buffer.slice(0)}:null},async delete(k){objects.delete(k)}}};
const headers=a=>({Cookie:'__Host-asia1111_session='+a.token,Origin:origin,'X-Asia-CSRF':a.csrf});
const key=a=>worker.fetch(new Request(origin+'/v11.52/account-key',{method:'POST',headers:headers(a)}),env);
const legacy=await encrypt84({history:['legacy fixture']},'frase sintética legacy');
const write=(a,expectedRevision,envelope=legacy,epoch=null,overrides={})=>worker.fetch(new Request(origin+'/v11.38/sync',{method:'POST',headers:{...headers(a),'Content-Type':'application/json',...(epoch===null?{}:{'X-Asia-Key-Epoch':epoch})},body:JSON.stringify({expectedRevision,envelope})}),{...env,...overrides});
const read=(a,revision=null)=>worker.fetch(new Request(origin+'/v11.38/sync'+(revision===null?'':'/'+revision),{headers:headers(a)}),env);
const rows=a=>db.prepare('SELECT * FROM sync_v1138_objects WHERE account_id=? ORDER BY revision').all(a.id);
const enroll=a=>db.prepare('INSERT INTO managed_account_keys_v1152(account_id,enrollment_kind) VALUES(?,\'new\')').run(a.id);
const lock=a=>db.prepare('UPDATE managed_account_keys_v1152 SET migration_lock=? WHERE account_id=?').run(crypto.randomUUID(),a.id);
const unlock=a=>db.prepare('UPDATE managed_account_keys_v1152 SET migration_lock=NULL WHERE account_id=?').run(a.id);
import '../../../../accounts106.js';
import {createRekeyClient1159,prepareMigration1159} from '../dist/assets/v11.42/staging/source/V11.42-INTEGRACION/src/rekey-client1159.mjs';
import {hashBytes} from '../dist/server/staging/source/V11.38-INTEGRACION/src/large-sync.mjs';
const phrase='frase anterior sintética transport',consent='transient-server-rekey-v1';
const send=(a,input,overrides={},opts={})=>worker.fetch(new Request(origin+'/v11.59/rekey'+(opts.query||''),{method:opts.method||'POST',headers:{...headers(a),'Content-Type':'application/json',...opts.headers},...((opts.method||'POST')==='POST'?{body:opts.raw??JSON.stringify(input)}:{})}),{...env,...overrides});
const clientFor=a=>createRekeyClient1159({origin,readSession:async()=>({accountId:a.id,csrf:a.csrf}),fetcher:(url,options)=>worker.fetch(new Request(url,{...options,headers:{...headers(a),...options.headers}}),env)});
async function seed(a,{localOnly=false}={}){
 enroll(a);if(localOnly)db.prepare("UPDATE managed_account_keys_v1152 SET enrollment_kind='legacy' WHERE account_id=?").run(a.id);const diary={body:{'2026-11-26':{weight:81}},diet:{},work:{},settings:{},photos:{}};
 const entries=[['asia2027-v1',JSON.stringify(diary)]],modules={coach:{history:['preservar']},visual:{photos:['referencia']}},plain={format:'asia-v1136-sync-v1',accountId:a.id,payload:{entries,modules}};
 const envelope=await encrypt84(plain,phrase);if(!localOnly)assert.equal((await write(a,0,envelope)).status,201);
 const local={format:'asia-v1126-local-vault-v1',accountId:a.id,revision:1,entries:[...entries,['asia-timers-v4','null']]};
 const mod={format:'asia-v1128-modules-v1',accountId:a.id,revision:1,modules:Object.fromEntries(Object.entries(modules).map(([name,payload])=>[name,{name,revision:1,payload}]))};
 let row={local:{revision:1,envelope:await encrypt84(local,phrase)},modules:{revision:1,envelope:await encrypt84(mod,phrase)},baseline:null},backup=null;
 const repository={readSync:async()=>structuredClone(row),readRekey:async()=>structuredClone(backup),async commitRekey(id,source,target,receipt){assert.equal(id,a.id);assert.deepEqual(source,row);assert.equal(backup,null);backup={receipt:structuredClone(receipt),source:structuredClone(source)};row=structuredClone(target);return 'applied'}};
 return {plain,local,mod,repository,source:structuredClone(row),remote:rows(a)[0]};
}
try{
 const a=await seed(A),b=await seed(B),c=await seed(C),d=await seed(D,{localOnly:true}),e=await seed(E,{localOnly:true});enroll(F);
 const discover={action:'discover'};
 // The real identity Worker rejects configurations above five emails.
 // Keep six isolated fixture rows, but never allow six identities at once.
 const invalidAllowlist={STAGING_ALLOWED_EMAILS:accounts.map(a=>a.email).join(',')};
 assert.equal((await send(A,discover,invalidAllowlist)).status,401);
 assert.equal((await send(F,discover)).status,401);
 assert.equal((await send(A,discover,{STAGING_ALLOW_REMOTE_REKEY_1159:'false'})).status,404);
 assert.equal((await send(A,discover,{STAGING_ALLOW_MANAGED_KEYS_1152:'false'})).status,404);
 assert.equal((await send(A,discover,{}, {headers:{Cookie:''}})).status,401);
 assert.equal((await send(A,discover,{}, {headers:{'X-Asia-CSRF':B.csrf}})).status,403);
 assert.equal((await send(A,discover,{}, {headers:{Origin:'https://other.invalid'}})).status,403);
 assert.equal((await send(A,discover,{}, {query:'?secret=invalid'})).status,404);
 assert.equal((await send(A,discover,{}, {method:'GET'})).status,405);
 assert.equal((await send(A,{...discover,accountId:B.id})).status,400);
 assert.equal((await send(A,discover,{}, {raw:'x'.repeat(2049)})).status,400);
 const ar=await send(A,discover);assert.equal(ar.status,200);assert.match(ar.headers.get('cache-control'),/no-store/);assert.equal((await ar.json()).operation,null);
 const client=await clientFor(A),pending={inspect:async()=>null};
 const options={client,repository:a.repository,pending,policy:globalThis.asiaAccounts106,oldPhrase:phrase,maintenanceConfirmed:true};
 const plan=await prepareMigration1159(options);assert.equal(plan.kind,'ready');
 await assert.rejects(plan.apply({confirmed:true}));assert.equal(await client.discover(),null);
 const ready=await prepareMigration1159(options);const applied=await ready.apply({confirmed:true,consent});assert.equal(applied.kind,'applied');
 const receipt=await client.discover();assert.equal(receipt.phase,'committed');assert.equal(rows(A).length,2);assert.deepEqual(rows(A)[0],a.remote);
 const secret=await client.managedKey(),current=await a.repository.readSync(A.id);
 assert.equal(await checksum84(await decrypt84(current.local.envelope,secret)),await checksum84({...a.local,revision:2}));
 assert.deepEqual((await a.repository.readRekey(A.id)).source,a.source);
 const resumed=await prepareMigration1159(options);assert.equal((await resumed.apply({confirmed:true,consent})).kind,'already-applied');assert.equal(rows(A).length,2);
 const other=await clientFor(B);await assert.rejects(other.inspect(receipt.operationId));
 const locked=await other.begin({operationId:crypto.randomUUID(),expectedRevision:1,expectedSha:b.remote.sha256,confirmed:true});
 assert.equal((await send(B,{action:'commit',operationId:locked.operationId,oldPhrase:phrase,confirmed:true,consent:'no'})).status,400);
 assert.equal((await other.discover()).phase,'locked');
 assert.equal((await other.cancel({operationId:locked.operationId,confirmed:true})).phase,'canceled');assert.equal(await other.discover(),null);assert.deepEqual(rows(B),[b.remote]);
 const third=await clientFor(C),opts={...options,client:third,repository:c.repository};
 await assert.rejects(prepareMigration1159({...opts,pending:{inspect:async()=>({phase:'editing'})}}));
 assert.equal(await third.discover(),null);assert.deepEqual(rows(C),[c.remote]);
 const pendingPlan=await prepareMigration1159(opts);let changed=false;
 const conflict=await prepareMigration1159({...opts,pending:{inspect:async()=>changed?{phase:'editing'}:null}});changed=true;
 await assert.rejects(conflict.apply({confirmed:true,consent}));assert.equal(await third.discover(),null);
 pendingPlan.cancel();
 // Known legacy installation: an empty cloud is not permission to issue a new key.
 for(const account of [D,E]){const response=await key(account);assert.equal(response.status,409);assert.equal((await response.json()).error,'MIGRACION_REQUERIDA');assert.equal(rows(account).length,0)}
 const last=await clientFor(D),dopts={...options,client:last,repository:d.repository};
 const encryptedSeed=await encrypt84(d.plain,phrase);
 // Authenticate F in a separate five-member fixture configuration. Its
 // empty new enrollment must reject legacy seeding, not merely fail auth.
 const alternateAllowlist={STAGING_ALLOWED_EMAILS:[A,B,C,D,F].map(a=>a.email).join(',')};
 const identityF=await send(F,discover,alternateAllowlist);
 assert.equal(identityF.status,200);assert.equal((await identityF.json()).accountId,F.id);
 assert.equal((await write(F,0,encryptedSeed,'legacy-seed-v1',alternateAllowlist)).status,409);
 assert.equal(rows(F).length,0);
 assert.equal(db.prepare('SELECT envelope FROM managed_account_keys_v1152 WHERE account_id=?').get(F.id).envelope,null);
 assert.equal((await write(D,0,encryptedSeed,'legacy-seed-v1',{STAGING_ALLOW_REMOTE_REKEY_1159:'false'})).status,409);
 assert.equal((await write(D,1,encryptedSeed,'legacy-seed-v1')).status,409);
 await assert.rejects(prepareMigration1159({...dopts,oldPhrase:'frase anterior incorrecta'}));
 const seedPlan=await prepareMigration1159(dopts);assert.equal(seedPlan.phase,'seed');
 await assert.rejects(seedPlan.apply({confirmed:true}));assert.equal(rows(D).length,0);
 const readyD=await prepareMigration1159(dopts);assert.equal((await readyD.apply({confirmed:true,consent})).kind,'applied');
 assert.equal(rows(D).length,2);assert.deepEqual((await d.repository.readRekey(D.id)).source,d.source);
 const originalD=rows(D)[0],originalBytes=Buffer.from(objects.get(originalD.object_key));
 assert.deepEqual(await decrypt84(JSON.parse(originalBytes.toString()),phrase),d.plain);
 assert.equal(await checksum84(await decrypt84((await d.repository.readSync(D.id)).local.envelope,await last.managedKey())),await checksum84({...d.local,revision:2}));
 const fifth=await clientFor(E),eopts={...options,client:fifth,repository:e.repository};
 const uncertain={...fifth,async seed(envelope){await fifth.seed(envelope);throw Error('simulated response loss after publication')}};
 const lost=await prepareMigration1159({...eopts,client:uncertain});assert.equal(lost.phase,'seed');
 await assert.rejects(lost.apply({confirmed:true,consent}));assert.equal(rows(E).length,1);
 const retained=rows(E)[0],retainedBytes=Buffer.from(objects.get(retained.object_key));
 await assert.rejects(fifth.seed(await encrypt84(e.plain,phrase)));assert.deepEqual(rows(E),[retained]);
 const resumedE=await prepareMigration1159(eopts);assert.equal(resumedE.phase,'new');
 assert.equal((await resumedE.apply({confirmed:true,consent})).kind,'applied');assert.equal(rows(E).length,2);
 assert.deepEqual(rows(E)[0],retained);assert.deepEqual(Buffer.from(objects.get(retained.object_key)),retainedBytes);
 assert.deepEqual((await e.repository.readRekey(E.id)).source,e.source);
 console.log('Authenticated rekey transport: flags, origin/CSRF, bounds, consent, full remote/local migration, receipt retry, isolation, cancel and pending blockers PASS.');
}finally{db.close()}
