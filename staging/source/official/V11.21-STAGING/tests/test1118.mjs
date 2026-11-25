import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createWorker1111} from '../src/worker1118.mjs';
import * as assets from '../src/assets1118.mjs';
import {digest,accountId} from '../src/security1111.mjs';
import {newRecoveryCode,keyFromRecoveryCode,encryptDemo,blankPayload,nextSyntheticEntry,decryptDemo} from '../../V11.13-STAGING/web1113/crypto.js';
import {encryptJournal,decryptJournal} from '../web115/crypto115.js';
import {blankJournal,addEntry} from '../web115/journal115.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const file=p=>new URL(p,import.meta.url).href;
const src=read('../web118/kit118.js').replace("'/v11.13/crypto.js'",JSON.stringify(file('../../V11.13-STAGING/web1113/crypto.js')));
const kit=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(src));
let count=0;
function eq(a,b,m=''){assert.deepEqual(a,b,m);count++;}
function ok(a,m=''){assert.ok(a,m);count++;}
async function rejected(fn,match){await assert.rejects(fn,match);count++;}
for(const [name,path] of Object.entries({html118:'index.html',app118:'app.js',original118Style:'asia106-original.css',style115_118:'stage115.css',style116_118:'stage116.css',style117_118:'stage117.css',style118:'stage118.css',archive116_118:'archive116.js',bundle117_118:'bundle117.js',kit118:'kit118.js'}))eq(assets[name],read('../web118/'+path),'Byte-exact asset '+name);
const html=read('../web118/index.html'),app=read('../web118/app.js');
ok(html.includes('V11.18 · STAGING'));ok(html.includes('SOLO DATOS FICTICIOS'));ok(html.includes('/v11.18/app.js'));ok(app.includes('createKitWithCode'));ok(app.includes('recoverKit'));ok(app.includes('verifyExistingKey'));ok(app.includes('kitRescueCode:null'));ok(app.includes("a.href='/v11.18/auth/start'"));
for(const v of [html,app,src,read('../web118/stage118.css')]){ok(!v.includes('innerHTML'));ok(!v.includes('localStorage'));ok(!v.includes('asia-2027-ai.workers.dev'));}
for(const f of ['asia106-original.css','stage115.css','stage116.css','stage117.css','archive116.js','bundle117.js'])eq(read('../web118/'+f),read('../web117/'+f),'Legacy unchanged');
const owner=await accountId('https://accounts.google.com','v118-alice'),other=await accountId('https://accounts.google.com','v118-bob');
const old=newRecoveryCode();eq(old.length,43);const originalKey=await keyFromRecoveryCode(old);
const created=await kit.createRecoveryKit(old,owner);ok(created.json.length>200);ok(created.json.length<=kit.MAX_KIT_BYTES);eq(created.rescueCode.length,43);ok(!created.json.includes(old),'Original secret never in unencrypted kit');ok(!created.json.includes(created.rescueCode),'Rescue code never exported');
const extracted=await kit.openRecoveryKit(created.json,created.rescueCode,owner);
const oldPayload=nextSyntheticEntry(blankPayload(owner),'meal');const envelope=await encryptDemo(oldPayload,originalKey,owner);
eq(await decryptDemo(envelope,extracted,owner),oldPayload,'Original code recovered from independently encrypted kit');
const diary=addEntry(blankJournal(owner),{kind:'diet',date:'2026-01-10',ad:'yes',steps:3000,energy:3});
eq(await decryptJournal(await encryptJournal(diary,originalKey,owner),extracted,owner),diary,'Diary compatible unchanged');
await rejected(()=>kit.openRecoveryKit(created.json,newRecoveryCode(),owner),/KIT_O_CODIGO/);
await rejected(()=>kit.openRecoveryKit(created.json,created.rescueCode,other),/CUENTA_DISTINTA/);
await rejected(()=>kit.openRecoveryKit(created.json,'x'.repeat(43),owner),/CODIGO_RESCATE_INVALIDO/);
await rejected(()=>kit.openRecoveryKit(created.json,'@',owner),/CODIGO_RESCATE_INVALIDO/);
await rejected(()=>kit.openRecoveryKit('{broken',created.rescueCode,owner),/KIT_INVALIDO/);
await rejected(()=>kit.openRecoveryKit('x'.repeat(kit.MAX_KIT_BYTES+1),created.rescueCode,owner),/KIT_INVALIDO/);
await rejected(()=>kit.openRecoveryKit(JSON.stringify({}),created.rescueCode,owner),/KIT_INVALIDO/);
await rejected(()=>kit.createRecoveryKit('',owner),/CUENTA_O_CODIGO_INVALIDO/);
await rejected(()=>kit.createRecoveryKit('A'.repeat(43),other+'x'),/CUENTA_O_CODIGO_INVALIDO/);
await rejected(()=>kit.createRecoveryKit(old+'=',owner),/CUENTA_O_CODIGO_INVALIDO/);
await rejected(()=>kit.openRecoveryKit(created.json,created.rescueCode,owner.toUpperCase()),/KIT_INVALIDO/);
const obj=JSON.parse(created.json);
for(const change of [
 {...obj,format:'alien'}, {...obj,kdf:'PBKDF2-SHA1'}, {...obj,unused:42},
 {...obj,iv:'ABCD'}, {...obj,salt:'A'.repeat(24)}, {...obj,cipher:obj.cipher.slice(0,-6)+'AAAAAA'},
 {...obj,accountId:other},
])await rejected(()=>kit.openRecoveryKit(JSON.stringify(change),created.rescueCode,owner),/KIT_INVALIDO|KIT_O_CODIGO_RESCATE_INVALIDO|CUENTA_DISTINTA/);
const sameOwnerOtherKit=await kit.createRecoveryKit(newRecoveryCode(),owner);
await rejected(async()=>decryptDemo(envelope,await kit.openRecoveryKit(sameOwnerOtherKit.json,sameOwnerOtherKit.rescueCode,owner),owner),/CLAVE_O_COPIA_INVALIDA/);
// Exercise actual staging Worker in isolated SQLite D1 with no external network.
const base='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
db.exec(read('../../V11.9-LAB/migrations/0001_staging.sql'));db.exec(read('../migrations/0006_identity_oidc.sql'));db.exec(read('../migrations/0007_synthetic_journal_v115.sql'));
const D1={prepare(sql){return {bind(...params){return {first:async()=>db.prepare(sql).get(...params)??null,all:async()=>({results:db.prepare(sql).all(...params)}),run:async()=>db.prepare(sql).run(...params)};}}}};
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:base,STAGING_DB:D1,STAGING_GOOGLE_CLIENT_ID:'testing.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'offline-not-real',STAGING_ALLOWED_EMAILS:'alpha@example.test,beta@example.test',STAGING_ALLOW_SYNTHETIC_SNAPSHOTS:'true'};
const worker=createWorker1111({fetchImpl:async()=>{throw Error('NETWORK_BLOCKED')}});
const get=(path,opts={},e=env)=>worker.fetch(new Request(base+path,opts),e);
const paths=['/v11.18/','/v11.18/app.js','/v11.18/kit118.js','/v11.18/bundle117.js','/v11.18/archive116.js','/v11.18/stage118.css','/v11.18/asia106-original.css','/v11.18/stage115.css','/v11.18/stage116.css','/v11.18/stage117.css'];
for(const path of paths){const r=await get(path);eq(r.status,200,'New route '+path);eq(r.headers.get('X-Asia-Staging'),'synthetic-only');ok(r.headers.get('Content-Security-Policy').includes("script-src 'self'"));ok((await r.text()).length>25);}
for(const path of ['/v11.17/','/v11.16/','/v11.15/','/v11.14/','/v11.13/','/v11.12/','/v11.11/'])eq((await get(path)).status,200,'Older route preserved');
for(const path of ['/v11.18/kit118.js?wrong=1','/v11.18/fake','/v11.18/extra/','/v11.18/data/private'])ok((await get(path)).status!==200,'Unexpected route denied');
const r=await get('/v11.18/auth/start');eq(r.status,303);eq(r.headers.get('Location'),'/v11.11/auth/start');ok(r.headers.get('Set-Cookie').includes('__Host-asia1118_return=1'));
const status=await(await get('/v11.11/status')).json();eq(status.version,'11.18');eq(status.configured,true);eq(status.production,false);eq(status.health,false);eq(status.publicRegistration,false);
eq((await get('/v11.18/',{}, {...env,DB:{}})).status,503,'Production binding blocked');
eq((await get('/v11.18/',{}, {...env,STAGING_MODE:'unsafe'})).status,503,'Wrong stage marker blocked');
eq((await get('/v11.18/',{method:'POST'})).status,404,'No browser endpoint write');
eq((await get('/v11.15/data/journal')).status,401,'No diary unauthenticated');
eq((await get('/v11.11/data/snapshots')).status,401,'No snapshots unauthenticated');
// Session and ciphertext remain untouched after kit creation/recovery: no server route exists for a kit.
const token=newRecoveryCode(),csrf=newRecoveryCode(),now=Date.now();
db.prepare('INSERT INTO accounts_v11(account_id,issuer,subject,created_at) VALUES(?,?,?,?)').run(owner,'https://accounts.google.com','v118-alice',new Date(now).toISOString());
db.prepare('INSERT INTO auth_oidc_sessions_v1111(token_digest,account_id,csrf,email_digest,created_at,expires_at) VALUES(?,?,?,?,?,?)').run(await digest(token),owner,csrf,await digest('alpha@example.test'),now,now+3600000);
const who=await(await get('/v11.11/auth/me',{headers:{Cookie:'__Host-asia1111_session='+token}})).json();eq(who.accountId,owner);eq(who.csrf,csrf);
const rowsBefore=db.prepare('SELECT COUNT(*) AS n FROM synthetic_journal_v115').get().n;
const opened=await kit.openRecoveryKit(created.json,created.rescueCode,who.accountId);ok(opened.type==='secret');
eq(db.prepare('SELECT COUNT(*) AS n FROM synthetic_journal_v115').get().n,rowsBefore,'Kit never writes D1');
console.log('V11.18: '+count+' comprobaciones. Kit offline, integridad, propietario, compatibilidad V11.17, staging D1 local, autenticación y CSP.');
