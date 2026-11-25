import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createWorker1111} from '../src/worker1117.mjs';
import * as assets from '../src/assets1117.mjs';
import {digest,accountId} from '../src/security1111.mjs';
import {newRecoveryCode,keyFromRecoveryCode,encryptDemo,blankPayload,nextSyntheticEntry} from '../../V11.13-STAGING/web1113/crypto.js';
import {encryptJournal} from '../web115/crypto115.js';
import {blankJournal,addEntry} from '../web115/journal115.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const file=p=>new URL(p,import.meta.url).href;
const archiveSource=read('../web116/archive116.js').replace("'/v11.15/crypto115.js'",JSON.stringify(file('../web115/crypto115.js'))).replace("'/v11.15/journal115.js'",JSON.stringify(file('../web115/journal115.js')));
const archiveURL='data:text/javascript;charset=utf-8,'+encodeURIComponent(archiveSource);
const bundleSource=read('../web117/bundle117.js').replace("'/v11.13/crypto.js'",JSON.stringify(file('../../V11.13-STAGING/web1113/crypto.js'))).replace("'/v11.16/archive116.js'",JSON.stringify(archiveURL));
const {verifyBundle,exportBundle,restoreBundle,MAX_BUNDLE_BYTES,BUNDLE_FORMAT}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(bundleSource));
let count=0;const eq=(a,b,m='')=>{assert.deepEqual(a,b,m);count++},ok=(v,m='')=>{assert.ok(v,m);count++},rejected=async(fn,pat)=>{await assert.rejects(fn,pat);count++};
for(const [name,path] of Object.entries({html117:'index.html',app117:'app.js',original117Style:'asia106-original.css',style115_117:'stage115.css',style116_117:'stage116.css',style117:'stage117.css',archive116_117:'archive116.js',bundle117:'bundle117.js'}))eq(assets[name],read('../web117/'+path),'Bundled assets byte exact');
const html=read('../web117/index.html'),app=read('../web117/app.js');
ok(html.includes('V11.17 · STAGING'),'Visible version');ok(html.includes('SOLO DATOS FICTICIOS'),'Safety warning');ok(html.includes('/v11.17/app.js'),'Assets correct');
for(const s of [app,read('../web117/bundle117.js'),html]){ok(!s.includes('innerHTML'),'No HTML injection');ok(!s.includes('localStorage'),'No localStorage');ok(!s.includes('asia-2027-ai.workers.dev'),'No production secrets');}
ok(app.includes('importFullBundle')&&app.includes('restoreFullBundle')&&app.includes('downloadFullBundle'),'Bundle UX wired');
eq(assets.original117Style,read('../web116/asia106-original.css'),'Original CSS untouched');
const origin='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(read('../../V11.9-LAB/migrations/0001_staging.sql'));db.exec(read('../migrations/0006_identity_oidc.sql'));db.exec(read('../migrations/0007_synthetic_journal_v115.sql'));
const D1={prepare(sql){return {bind(...params){return {first:async()=>db.prepare(sql).get(...params)??null,all:async()=>({results:db.prepare(sql).all(...params)}),run:async()=>db.prepare(sql).run(...params)};}}}};
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_DB:D1,STAGING_GOOGLE_CLIENT_ID:'fake.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-secret-not-real',STAGING_ALLOWED_EMAILS:'first@example.test,second@example.test',STAGING_ALLOW_SYNTHETIC_SNAPSHOTS:'true'};
const worker=createWorker1111({fetchImpl:async()=>{throw Error('EXTERNAL_NETWORK_DISABLED')}});
const get=(path,opts={},e=env)=>worker.fetch(new Request(origin+path,opts),e);
const users=[];
for(const [sub,email] of [['v117-first','first@example.test'],['v117-second','second@example.test']]){
 const id=await accountId('https://accounts.google.com',sub),token=newRecoveryCode(),csrf=newRecoveryCode(),now=Date.now();
 db.prepare('INSERT INTO accounts_v11(account_id,issuer,subject,created_at) VALUES(?,?,?,?)').run(id,'https://accounts.google.com',sub,new Date(now).toISOString());
 db.prepare('INSERT INTO auth_oidc_sessions_v1111(token_digest,account_id,csrf,email_digest,created_at,expires_at) VALUES(?,?,?,?,?,?)').run(await digest(token),id,csrf,await digest(email),now,now+3600000);
 users.push({id,csrf,cookie:'__Host-asia1111_session='+token});
}
const [A,B]=users;
const auth=(user,path,opts={})=>get(path,{...opts,headers:{Cookie:user.cookie,...opts.headers}});
const body=async r=>({...await r.json(),status:r.status});
const domain=(user,type)=>{const base=type==='snapshots'?'/v11.11/data/snapshots':'/v11.15/data/journal';return {
 index:()=>auth(user,base).then(body),read:rev=>auth(user,base+'/'+rev).then(body),
 post:(expectedRevision,envelope)=>auth(user,base,{method:'POST',headers:{Origin:origin,'X-Asia-CSRF':user.csrf,'Content-Type':'application/json'},body:JSON.stringify({expectedRevision,envelope})}).then(body)
};};
const collections=user=>({snapshots:domain(user,'snapshots'),journal:domain(user,'journal')});
for(const [path,type] of [['/v11.17/','text/html'],['/v11.17/app.js','text/javascript'],['/v11.17/bundle117.js','text/javascript'],['/v11.17/archive116.js','text/javascript'],['/v11.17/stage117.css','text/css'],['/v11.17/asia106-original.css','text/css']]){
 const r=await get(path);eq(r.status,200,'Version route '+path);ok(r.headers.get('Content-Type').startsWith(type),'Type');eq(r.headers.get('X-Asia-Staging'),'synthetic-only');ok(r.headers.get('Content-Security-Policy').includes("script-src 'self'"),'CSP');ok((await r.text()).length>30,'Content');
}
for(const path of ['/v11.16/','/v11.15/','/v11.14/','/v11.13/','/v11.12/','/v11.11/'])eq((await get(path)).status,200,'Preserved route '+path);
for(const path of ['/v11.17/?q=1','/v11.17/nope','/v11.17/bundle117.js?q=1','/v11.17/data/snapshots'])ok((await get(path)).status!==200,'Invalid path refused');
eq((await get('/v11.17/auth/start')).status,303,'OIDC return marker');ok((await get('/v11.17/auth/start')).headers.get('Set-Cookie').includes('__Host-asia1117_return=1'));
const status=await(await get('/v11.11/status')).json();eq(status.version,'11.17');eq(status.production,false);eq(status.publicRegistration,false);eq(status.health,false);eq(status.configured,true);
eq((await get('/v11.11/data/snapshots')).status,401,'No access to snapshots without login');eq((await get('/v11.15/data/journal')).status,401,'No access to journal without login');
eq((await get('/v11.17/',{}, {...env,DB:{}})).status,503,'Fail closed with production D1');eq((await get('/v11.17/',{}, {...env,STAGING_MODE:'bad'})).status,503,'Fail closed in production mode');
const key=await keyFromRecoveryCode(newRecoveryCode()),wrongKey=await keyFromRecoveryCode(newRecoveryCode());
const old1=nextSyntheticEntry(blankPayload(A.id),'meal'),old2=nextSyntheticEntry(old1,'walk');
const snapshots=[{revision:1,envelope:await encryptDemo(old1,key,A.id)},{revision:2,envelope:await encryptDemo(old2,key,A.id)},{revision:3,envelope:await encryptDemo(old1,key,A.id)}]; // legal rollback as a new legacy revision
let plain=blankJournal(A.id),journal=[];
for(const fields of [{kind:'diet',date:'2026-01-03',ad:'yes',steps:4500,energy:4},{kind:'workout',date:'2026-01-04',routine:'A',cardioMin:20,cardioSpeed:6,cardioIncline:1,cardioRPE:5}]){plain=addEntry(plain,fields);journal.push({revision:journal.length+1,envelope:await encryptJournal(plain,key,A.id)});}
const make=(s=snapshots,j=journal,owner=A.id)=>JSON.stringify({format:BUNDLE_FORMAT,accountId:owner,collections:{snapshots:{head:s.length,history:s},journal:{head:j.length,history:j}}});
const good=make(),verified=await verifyBundle(good,key,A.id);
eq(verified.collections.snapshots.head,3,'Legacy snapshot history validated');eq(verified.collections.journal.head,2,'Diary history validated');eq(verified.snapshotEntries,1,'Legal legacy restore validated');eq(verified.overview.dietDays,1);eq(verified.overview.trainingDays,1);
ok(!JSON.stringify(verified).includes('"entries"'),'No decrypted events in import candidate');
for(const [s,pat] of [
 ['{bad',/JSON_INVALIDO/],
 [JSON.stringify({}),/FORMATO_INCOMPATIBLE/],
 [make(snapshots,journal,B.id),/CUENTA_DISTINTA/],
 [make([],[]),/HISTORIAL_INCOMPLETO/],
 [JSON.stringify({...JSON.parse(good),extra:1}),/FORMATO_INCOMPATIBLE/],
 [JSON.stringify({...JSON.parse(good),collections:{snapshots:{head:3,history:snapshots.slice(1)},journal:{head:2,history:journal}}}),/HISTORIAL_INCOMPLETO/],
 [make([{...snapshots[0],revision:2},...snapshots.slice(1)],journal),/HISTORIAL_INCOMPLETO/],
 [make([{revision:1,envelope:{...snapshots[0].envelope,iv:'!'}},...snapshots.slice(1)],journal),/CLAVE_O_COPIA_INVALIDA/],
 [make(snapshots,[{revision:1,envelope:{...journal[0].envelope,cipher:'!'}},journal[1]]),/CLAVE_O_DIARIO_INVALIDO/],
 ])await rejected(()=>verifyBundle(s,key,A.id),pat);
await rejected(()=>verifyBundle(good,wrongKey,A.id),/CLAVE_O_COPIA_INVALIDA/);
await rejected(()=>verifyBundle(good,key,B.id),/CUENTA_DISTINTA/);
await rejected(()=>verifyBundle('X'.repeat(MAX_BUNDLE_BYTES+1),key,A.id),/ARCHIVO_GRANDE/);
await rejected(()=>verifyBundle(good,null,A.id),/CLAVE_AUSENTE/);
const c=collections(A);
// Both collections restored into empty local mock D1 staging with CAS and Google session.
const first=await restoreBundle(verified,c);eq(first.written,5);eq((await c.snapshots.index()).head,3);eq((await c.journal.index()).head,2);eq((await collections(B).snapshots.index()).head,0,'Account B vault isolated');eq((await collections(B).journal.index()).head,0,'Account B diary isolated');
const again=await restoreBundle(verified,c);eq(again.written,0,'Idempotent replay');
const out=await exportBundle(key,A.id,c),reverified=await verifyBundle(out,key,A.id);
eq(reverified.collections.snapshots.head,3,'Export contains old vault');eq(reverified.collections.journal.head,2,'Export contains diary');
// A tampered archive rejected even though the file claims the same owner.
await rejected(()=>restoreBundle({...verified,accountId:'bad'},c),/COPIA_NO_VERIFICADA/);
// Strict preflight across BOTH domains: divergent diary blocks any upload to old snapshot collection.
db.prepare('DELETE FROM encrypted_snapshots_v11 WHERE account_id=?').run(A.id);db.prepare('DELETE FROM synthetic_journal_v115 WHERE account_id=?').run(A.id);
const branched=addEntry(blankJournal(A.id),{kind:'diet',date:'2026-01-01',ad:'no',steps:0,energy:1});
eq((await c.journal.post(0,await encryptJournal(branched,key,A.id))).status,201);
await rejected(()=>restoreBundle(verified,c),/NUBE_DIVERGENTE/);
eq((await c.snapshots.index()).head,0,'Cross-domain preflight blocks partial writes');
// Divergent snapshot blocks diary writes.
db.prepare('DELETE FROM synthetic_journal_v115 WHERE account_id=?').run(A.id);db.prepare('DELETE FROM encrypted_snapshots_v11 WHERE account_id=?').run(A.id);
eq((await c.snapshots.post(0,await encryptDemo(old2,key,A.id))).status,201);
await rejected(()=>restoreBundle(verified,c),/NUBE_DIVERGENTE/);
eq((await c.journal.index()).head,0,'Diary remains untouched');
// Interrupted restore is safely resumed without a destructive rebase.
db.prepare('DELETE FROM encrypted_snapshots_v11 WHERE account_id=?').run(A.id);
let writes=0;
await rejected(()=>restoreBundle(verified,{snapshots:{...c.snapshots,post:(base,envelope)=>{if(writes++===1)throw Error('SIMULATED_NETWORK_CUT');return c.snapshots.post(base,envelope);}},journal:c.journal}),/SIMULATED_NETWORK_CUT/);
eq((await c.snapshots.index()).head,1,'First ciphertext durable');
const resume=await restoreBundle(verified,c);eq(resume.written,4,'Resumes old vault and diary');
const headOld=await c.snapshots.index();eq(headOld.head,3);
// Hard fail closed: a history from another account will not be restored by client A.
await rejected(()=>verifyBundle(make(snapshots,journal,B.id),key,A.id),/CUENTA_DISTINTA/);
const badCSRF=await auth(A,'/v11.11/data/snapshots',{method:'POST',headers:{Origin:'https://evil.invalid','Content-Type':'application/json','X-Asia-CSRF':A.csrf},body:JSON.stringify({expectedRevision:3,envelope:snapshots[2].envelope})});eq(badCSRF.status,403,'Origin rejected for old vault');
// Empty one collection is fine; replay never deletes a newer cloud branch.
const oldOnly=await verifyBundle(make(snapshots,[]),key,A.id);eq(oldOnly.collections.journal.head,0);
const newer=await restoreBundle(oldOnly,c);eq(newer.written,0,'Empty bundle domain does not erase newer diary');
const diaryOnly=await verifyBundle(make([],journal),key,A.id);eq(diaryOnly.collections.snapshots.head,0);
console.log(`V11.17: ${count} comprobaciones sobre copia integral cifrada, dos colecciones D1 locales, OAuth simulado, CAS, aislamiento, conflictos y reanudacion.`);
console.log('Todo offline; no se modifico Cloudflare ni produccion.');
