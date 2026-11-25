// V11.9 deterministic offline security and recovery tests — no browsers, secrets or network.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MemoryStore117,Platform117,validateArchive119,validArchive118,DB_NAME117} from '../v119/vault117.mjs';
import {encryptForD1Lab119,decryptFromD1Lab119,validateBridgePayload119} from '../cloud-bridge119.mjs';
import {validateEnvelope114} from '../sync114.mjs';
import {decrypt84} from '../legacy_v106/model84.mjs';
let unit=0,e2e=0;
const u=(x,m)=>{assert.ok(x,m);unit++;};
const x=(actual,expected,m)=>{assert.deepEqual(actual,expected,m);e2e++;};
const no=async(f,msg)=>{await assert.rejects(f,e=>e?.message===msg,`Should fail ${msg}`);e2e++;};
const phrase='An entirely imaginary account phrase for version 119!';
const other='Second completely imaginary pass phrase for testing 119!';
const day='2026-11-23';
const clone=structuredClone;
const setup=async()=>{const store=new MemoryStore117(),p=new Platform117(store);const a=await p.createAccount('Ficticia A',phrase);await p.unlock(a.id,phrase);return {store,p,a};};
const {store,p,a}=await setup();
u(DB_NAME117==='asia-v117-demo-only','Retain same demo IndexedDB namespace');
u(!validateArchive119(null),'Reject null');
for(const invalid of [{},[],5,{format:'asia119-demo-history-v1'}, {format:'asia119-demo-history-v1',accountId:'bad'}])u(!validateArchive119(invalid),'Reject malformed structure');
await no(()=>p.exportHistory119().then(v=>{if(v===null)throw Error('EMPTY_ARCHIVE');}),'EMPTY_ARCHIVE');
await p.addEntry({day,kind:'note',text:'Versión uno para exportar'});
await p.addEntry({day,kind:'training',text:'Versión dos para exportar'});
await p.setCoachGrant('health',true);
const conflictDevice=new Platform117(store);await conflictDevice.unlock(a.id,phrase);
await p.addEntry({day,kind:'note',text:'Cambio que genera borrador'});
const stale=await conflictDevice.addEntry({day,kind:'note',text:'Borrador preservado en conflicto'});
x(stale.status,'CONFLICT','Simulated concurrent write conflict');
u(stale.draftPreserved,'Conflict cannot silently overwrite head');
x((await p.drafts()).length,1,'A draft exists');
const archive=await p.exportHistory119();
u(validateArchive119(archive),'Valid full history archive');
x(archive.versions.length,4,'All revisions exported');
x(archive.drafts.length,1,'Conflict draft exported');
x(archive.headRevision,4,'Current head revision exported');
u(archive.historyComplete,'Complete revision sequence indicated');
u(!JSON.stringify(archive).includes('Versión uno'),'Historical state not stored in plaintext');
u(!JSON.stringify(archive).includes('Borrador preservado'),'Draft content not stored in plaintext');
u(!JSON.stringify(archive).includes('health:true'),'Permissions not in plaintext');
u(archive.index.format==='asia117-browser-vault-v1','Manifest is an AES-GCM envelope');
u(!validArchive118(archive),'Full history format distinct from legacy snapshot');
const fresh=new Platform117(new MemoryStore117());
await no(()=>fresh.importHistory119(archive,'Reimportada',other),'DEMO_INTEGRITY_FAILED');
x((await fresh.listAccounts()).length,0,'Wrong password leaves database empty');
for(const tamper of [
 a=>{a.format='unknown';},
 a=>{a.accountId='demo_'+'1'.repeat(32);},
 a=>{a.headRevision=3;},
 a=>{a.historyComplete=false;},
 a=>{a.versions.pop();},
 a=>{a.versions[0].revision=2;},
 a=>{a.versions[0].id='demo_'+'2'.repeat(32);},
 a=>{a.versions[0].envelope.cipher='AAAAAAAAAAAAAAAAAAAAAAAAAAAA';},
 a=>{a.versions[0].createdAt=new Date().toISOString();},
 a=>{a.drafts[0].expectedRevision=0;},
 a=>{a.drafts[0].id='draft_'+'1'.repeat(32);},
 a=>{a.drafts[0].envelope.iv='AAAAAAAAAAAAAAAA';},
 a=>{a.index.cipher='AAAAAAAAAAAAAAAAAAAAAAAAAAAA';},
 a=>{a.drafts.push(clone(a.drafts[0]));},
 a=>{a.extra='injected';},
 ]){
  const altered=clone(archive);tamper(altered);
  await assert.rejects(()=>fresh.importHistory119(altered,'Reimportada',phrase),/INVALID_HISTORY_ARCHIVE|DEMO_INTEGRITY_FAILED|HISTORY_MANIFEST_MISMATCH/);
  e2e++;
  x((await fresh.listAccounts()).length,0,'Tampered import leaves no partial account');
}
const result=await fresh.importHistory119(archive,'Reimportada',phrase);
x(result.versions,4,'All versions imported');x(result.drafts,1,'All drafts imported');
u(result.historyComplete,'Integrity catalog reports complete history');
await fresh.unlock(a.id,phrase);x(fresh.session.revision,4,'Head revision restored');x((await fresh.versions()).map(v=>v.revision),[4,3,2,1],'All original revisions are available');
x((await fresh.drafts()).length,1,'Conflict draft survived transfer');
u((await fresh.viewDraft(archive.drafts[0].id)).entries.some(v=>v.text==='Borrador preservado en conflicto'),'Draft decrypts from imported history');
const prior=await fresh.restore(1,{confirmed:true});x(prior.status,'SAVED','Old version is recoverable');x(fresh.session.revision,5,'Restore appends new revision');x((await fresh.versions()).length,5,'Restore does not delete original history');
await no(()=>fresh.importHistory119(archive,'Reimportada de nuevo',phrase),'LOCK_BEFORE_IMPORT');
fresh.lock();await no(()=>fresh.importHistory119(archive,'Reimportada de nuevo',phrase),'DEMO_ACCOUNT_EXISTS');
x((await fresh.listAccounts()).length,1,'Duplicate import creates no new accounts');
// Compatibility with a V11.8 snapshot-only import: sparse history is preserved honestly.
const snapshot=await p.exportEncrypted();u(validArchive118(snapshot),'V11.8 export remains valid');
const partial=new Platform117(new MemoryStore117());await partial.importEncrypted(snapshot,'Solo HEAD',phrase);await partial.unlock(a.id,phrase);
const sparse=await partial.exportHistory119();
u(validateArchive119(sparse),'Sparse existing history exports with explicit flag');
u(sparse.historyComplete===false,'Missing revisions are never falsely claimed');
x(sparse.versions.length,1,'Only available snapshot is exported');
const sparseImport=new Platform117(new MemoryStore117());await sparseImport.importHistory119(sparse,'Solo HEAD recuperada',phrase);await sparseImport.unlock(a.id,phrase);
x((await sparseImport.versions()).map(v=>v.revision),[4],'Sparse history remains sparse after import');
// Detect source changes from another tab and never export a mislabeled head.
const b=new Platform117(store);await b.unlock(a.id,phrase);await p.addEntry({day,kind:'note',text:'Otra escritura sobre la cuenta'});
await no(()=>b.exportHistory119(),'STALE_EXPORT_RELOAD_REQUIRED');
const copyStore=new MemoryStore117(),newP=new Platform117(copyStore);
const bAccount=await newP.createAccount('Otra cuenta distinta',other);await newP.unlock(bAccount.id,other);
x(newP.state.entries.length,0,'Account B cannot read account A');
await no(()=>newP.importHistory119(archive,'Intento de cruce',phrase),'LOCK_BEFORE_IMPORT');
newP.lock();await no(()=>newP.importHistory119(archive,'Otra cuenta distinta',phrase),'LABEL_EXISTS');
x((await newP.listAccounts()).length,1,'Cross account label conflict leaves existing account intact');
// Atomic storage failure injection: no partial account is ever considered saved.
class InterruptedStore extends MemoryStore117{async importAccountHistory119(){throw Error('SIMULATED_DISK_WRITE_FAILED');}}
const interrupted=new Platform117(new InterruptedStore());await no(()=>interrupted.importHistory119(archive,'Cortada',phrase),'SIMULATED_DISK_WRITE_FAILED');
x((await interrupted.listAccounts()).length,0,'Interrupted import never acknowledges an account');
// File size ceiling; no silent omission of revisions or drafts.
const oversized=clone(archive);oversized.index.cipher='A'.repeat(20_000_001);
u(!validateArchive119(oversized),'Archive larger than 20MB rejected');
// D1 wire crypto bridge: four exact fields and browser decrypted data retained.
const wire=await encryptForD1Lab119(p.state,phrase,{accountId:a.id,localRevision:p.session.revision});
u(validateEnvelope114(wire),'Existing V11.2 D1 envelope wire format accepted');
x(Object.keys(wire).sort(),['cipher','format','iv','salt'],'Exactly four D1 fields');
x(wire.format,'asia84-encrypted-v1','Existing Cloudflare D1 wire format');
u(!JSON.stringify(wire).includes('Otra escritura'),'No plaintext in D1-compatible envelope');
const decoded=await decryptFromD1Lab119(wire,phrase,{accountId:a.id});x(decoded.state,p.state,'State survives full AES-GCM bridge roundtrip');x(decoded.revision,p.session.revision,'Revision survives D1 bridge');
const decrypted=await decrypt84(wire,phrase);u(validateBridgePayload119(decrypted.payload),'Payload is typed, not mistaken for original V10.6');
await no(()=>decryptFromD1Lab119(wire,other,{accountId:a.id}),'LAB_BRIDGE_INTEGRITY_FAILED');
await no(()=>decryptFromD1Lab119(wire,phrase,{accountId:bAccount.id}),'LAB_BRIDGE_INTEGRITY_FAILED');
await no(()=>encryptForD1Lab119(p.state,phrase,{accountId:'FAKE',localRevision:3}),'INVALID_LAB_BRIDGE_PAYLOAD');
await no(()=>encryptForD1Lab119(p.state,phrase,{accountId:a.id,localRevision:101}),'INVALID_LAB_BRIDGE_PAYLOAD');
const broken=clone(wire);broken.cipher='AAAA';await no(()=>decryptFromD1Lab119(broken,phrase,{accountId:a.id}),'INVALID_D1_WIRE_ENVELOPE');
const modified=clone(wire);modified.cipher=modified.cipher.slice(0,-4)+'AAAA';await no(()=>decryptFromD1Lab119(modified,phrase,{accountId:a.id}),'LAB_BRIDGE_INTEGRITY_FAILED');
// Visual and source contracts, preserving previous versions unchanged.
const root=new URL('../',import.meta.url);const load=s=>readFileSync(new URL(s,root));
const hash=s=>createHash('sha256').update(s).digest('hex');
u(hash(load('v119/styles.css'))===hash(load('v118/styles.css')),'V11.8 and V11.9 CSS byte identical');
u(hash(load('v119/styles.css'))===hash(load('web/styles.css')),'V11.7 CSS byte identical');
u(load('v119/index.html').toString().includes('v11.9'),'Version visible in UI');
u(load('v118/index.html').toString().includes('v11.8'),'Old UI retained');
u(load('v119/app.mjs').toString().includes('exportHistory119'),'Full history export wired in UI');
u(load('v119/app.mjs').toString().includes('importHistory119'),'Full history import wired in UI');
u(load('v119/app.mjs').toString().includes('20000000'),'20MB file limit enforced before JSON parse');
u(load('v119/sw119.js').toString().includes('asia-v119-lab-static-1'),'SW cache namespace versioned');
u(!load('v119/app.mjs').toString().includes('fetch('),'UI has no remote transport');
u(load('scripts/serve119.mjs').toString().includes("server.listen(port,'127.0.0.1'"),'HTTP server limited to localhost');
console.log(`V11.9: ${unit} contratos unitarios + ${e2e} pruebas de seguridad e integración offline.`);
