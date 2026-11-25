// Asia Platform V11.8 — only synthetic data. No network or personal credentials.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Platform117,MemoryStore117,initial117,validState117,validEnvelope117,validArchive118,VERSION118,DB_NAME117} from '../v118/vault117.mjs';
import {Platform117 as PreviousPlatform117,MemoryStore117 as PreviousMemory117} from '../web/vault117.mjs';
let u=0,e=0;
const unit=(a,b)=>{assert.ok(a,b);u++;};
const equal=(a,b,msg)=>{assert.deepEqual(a,b,msg);u++;};
const fails=async(fn,code)=>{await assert.rejects(async()=>fn(),new RegExp(code));u++;};
const pass=(a,msg)=>{assert.ok(a,msg);e++;};
const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);e++;};
const no=async(fn,code)=>{await assert.rejects(async()=>fn(),new RegExp(code));e++;};
const phrase='ONLY SYNTHETIC V11.8 PHRASE FOR TESTING NEVER REAL';
const wrong='ONLY SYNTHETIC V11.8 INCORRECT PHRASE FOR TESTING';
const day='2026-11-23';
unit(VERSION118==='11.8','Runtime version');
unit(DB_NAME117==='asia-v117-demo-only','Existing IndexedDB namespace deliberately retained');
unit(validState117(initial117()),'State contract retained');
unit(!validArchive118(null),'Null archive rejected');
for(const archive of [{},[],false,42,{format:'asia117-demo-export-v1'}, {format:'asia117-demo-export-v1',accountId:'broken',revision:1,salt:'x',envelope:{}}, {format:'asia117-demo-export-v1',accountId:'demo_'+'a'.repeat(32),revision:0,salt:'x',envelope:{}}])unit(!validArchive118(archive),'Malformed archive rejected');
const originalStore=new MemoryStore117(),original=new Platform117(originalStore);
const user=await original.createAccount('Ficticia exportadora',phrase);await original.unlock(user.id,phrase);
await fails(()=>original.importEncrypted(null,'Falso',phrase),'LOCK_BEFORE_IMPORT');
const save=await original.addEntry({day,kind:'training',text:'Entrenamiento completamente ficticio'});
equal(save.status,'SAVED','Source initial save');
await original.addSyntheticHealth(day);await original.setCoachGrant('health',true);await original.addApprovedMemory('Nota sintética para prueba de portabilidad',day);await original.setCoachGrant('memory',true);
const expected=original.state;const revision=original.session.revision;
const archive=await original.exportEncrypted();
unit(validArchive118(archive),'V11.8 export compatible with V11.7 wire format');
unit(validEnvelope117(archive.envelope),'AES GCM envelope verified syntactically');
equal(archive.revision,revision,'Revision exported');
equal(archive.accountId,user.id,'Owner bound to archive');
unit(!JSON.stringify(archive).includes('Entrenamiento completamente ficticio'),'No plaintext entry in export');
unit(!JSON.stringify(archive).includes('Nota sintética'),'No plaintext Coach memory in export');
unit(!JSON.stringify(archive).includes('8123'),'No synthetic steps in export');
const independentStore=new MemoryStore117(),importer=new Platform117(independentStore);
for(const badLabel of ['',{},'<b>', 'a'.repeat(33),'a\n'])await fails(()=>importer.importEncrypted(archive,badLabel,phrase),'INVALID_DEMO_LABEL');
await fails(()=>importer.importEncrypted(archive,'Ficticia importada',wrong),'DEMO_INTEGRITY_FAILED');
equal((await importer.listAccounts()).length,0,'Wrong phrase never persists account');
const modifiers=[
 null,{},false,[],{...archive,format:'unknown'},{...archive,unused:'intruder'},
 {...archive,revision:0},{...archive,revision:101},{...archive,revision:-1},{...archive,revision:1.2},
 {...archive,accountId:'demo_'+'a'.repeat(32)},
 {...archive,salt:'AAAA'},
 {...archive,envelope:{...archive.envelope,cipher:'AAAAAAAAAAAAAAAAAAAAAAAAAAAA'}},
 {...archive,envelope:{...archive.envelope,iv:'AAAAAAAAAAAAAAAA'}}
];
for(const x of modifiers){
 await fails(()=>importer.importEncrypted(x,'Ficticia importada',phrase),validArchive118(x)?'DEMO_INTEGRITY_FAILED':'INVALID_DEMO_ARCHIVE');
 equal((await importer.listAccounts()).length,0,'Malformed/tampered import leaves store untouched');
}
const recovered=await importer.importEncrypted(archive,'Ficticia importada',phrase);
same(recovered,{id:user.id,label:'Ficticia importada',revision},'Imported identity and revision preserved');
unit(!importer.session,'Import never auto-opens account');
equal((await importer.listAccounts()).length,1,'Exactly one account persisted');
unit(independentStore.versions.has(`${user.id}:${revision}`),'Version history has imported snapshot');
unit(independentStore.heads.get(user.id).revision===revision,'Head revision saved');
await importer.unlock(recovered.id,phrase);
same(importer.state,expected,'Decrypted snapshot exactly matches source');
same(importer.session.revision,revision,'Imported account resumes revision');
await importer.setCoachGrant('health',false);const newRev=importer.session.revision;
unit(newRev===revision+1,'Imported snapshot continues in a new revision');
unit(original.state.grants.health===true,'Original account is not modified after transfer');
await importer.restore(revision,{confirmed:true});
unit(importer.state.grants.health===true,'Prior imported revision can be restored without destroying current head');
unit((await importer.versions()).length===3,'Import + mutation + restore all preserved');
importer.lock();await fails(()=>importer.importEncrypted(archive,'Duplicado',phrase),'DEMO_ACCOUNT_EXISTS');
equal((await importer.listAccounts()).length,1,'Duplicate import cannot overwrite anything');
const second=await importer.createAccount('Otra ficticia',wrong);
await no(()=>importer.importEncrypted(archive,'Otra ficticia',phrase),'DEMO_ACCOUNT_EXISTS');
pass(second.id!==user.id,'Independent account identity unaffected by failed import');
await no(()=>new Platform117(independentStore).unlock(second.id,phrase),'DEMO_INTEGRITY_FAILED');
await importer.unlock(second.id,wrong);pass(importer.state.entries.length===0,'Independent second account cannot view imported entries');
// V11.7 exports are compatible, not merely archives newly produced by V11.8.
const prevStore=new PreviousMemory117(),prev=new PreviousPlatform117(prevStore);
const legacy=await prev.createAccount('Cuenta vieja de laboratorio',phrase);await prev.unlock(legacy.id,phrase);
await prev.addEntry({day,kind:'note',text:'Nota ficticia de V11.7'});
const oldArchive=await prev.exportEncrypted();
pass(validArchive118(oldArchive),'Existing V11.7 archive recognized by V11.8');
const transfer=new Platform117(new MemoryStore117());await transfer.importEncrypted(oldArchive,'Migrada 11.7',phrase);await transfer.unlock(legacy.id,phrase);
pass(transfer.state.entries[0].text==='Nota ficticia de V11.7','V11.7 archive successfully restored by new engine');
pass(transfer.session.revision===1,'Original V11.7 revision retained');
await no(()=>transfer.unlock(legacy.id,wrong),'DEMO_INTEGRITY_FAILED');
// Fail-closed export: stale head, dirty conflict, ciphertext tamper, invalid state.
const race=new MemoryStore117(),a=new Platform117(race),b=new Platform117(race);
const account=await a.createAccount('Race lab',phrase);await a.unlock(account.id,phrase);await a.addEntry({day,kind:'note',text:'Inicial'});await b.unlock(account.id,phrase);
await a.addEntry({day,kind:'note',text:'Cambio externo'});
await no(()=>b.exportEncrypted(),'STALE_EXPORT_RELOAD_REQUIRED');
const conflict=await b.addEntry({day,kind:'note',text:'Conflicto sintético'});
pass(conflict.status==='CONFLICT','Concurrent tab detects conflict');
await no(()=>b.exportEncrypted(),'DRAFT_PRESERVED_REQUIRES_RELOCK');
const originalHead=structuredClone(race.heads.get(account.id));
race.heads.get(account.id).envelope.cipher='AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
await no(()=>a.exportEncrypted(),'DEMO_INTEGRITY_FAILED');
race.heads.set(account.id,originalHead);
pass(validArchive118(await a.exportEncrypted()),'Original vault export restored after rejecting corrupted head');
// Account quota and duplicate labels for imported backups must be guarded at write time.
const quotaStore=new MemoryStore117(),quotaP=new Platform117(quotaStore);
for(let i=0;i<8;i++)await quotaP.createAccount(`Demo ${i}`,`Long invented test passphrase #${i} at least 16`);
await no(()=>quotaP.importEncrypted(oldArchive,'Ninth account',phrase),'DEMO_ACCOUNT_LIMIT');
pass((await quotaP.listAccounts()).length===8,'Quota reached without accidental data writes');
const labelsStore=new MemoryStore117(),labelsP=new Platform117(labelsStore);
await labelsP.createAccount('Repetida',wrong);
await no(()=>labelsP.importEncrypted(oldArchive,'repetida',phrase),'LABEL_EXISTS');
pass((await labelsP.listAccounts()).length===1,'Duplicate case-insensitive label does not mutate state');
// Failure injection for atomic commit: never acknowledge an uncommitted import.
class BrokenStore extends MemoryStore117 { async importAccountSnapshot(){throw Error('SIMULATED_STORAGE_FAILURE');} }
const broken=new Platform117(new BrokenStore());
await no(()=>broken.importEncrypted(oldArchive,'Simulada',phrase),'SIMULATED_STORAGE_FAILURE');
pass((await broken.listAccounts()).length===0,'Simulated write failure did not persist partial account');
// Browser and isolation contracts: new path outside previous SW scope, old UI stays unchanged.
const root=new URL('../',import.meta.url);
const content=p=>readFileSync(new URL(p,root));
const asText=p=>content(p).toString('utf8');
const css118=content('v118/styles.css'),css117=content('web/styles.css');
pass(createHash('sha256').update(css118).digest('hex')===createHash('sha256').update(css117).digest('hex'),'Visual CSS is exactly byte-for-byte unchanged');
const html=asText('v118/index.html'),oldHtml=asText('web/index.html');
pass(html.includes('v11.8')&&html.includes('Asia Platform · V11.8 LAB'),'New visible lab version');
pass(oldHtml.includes('v11.7'),'Historical lab remains available unchanged');
pass(html.includes('styles.css')&&html.includes('app.mjs'),'Existing layout and component entrypoints kept');
pass(asText('v118/app.mjs').includes('importEncrypted'),'UI actually invokes verified import');
pass(asText('v118/app.mjs').includes('type="file"'),'UI has local file selection');
pass(asText('v118/app.mjs').includes('size>180000'),'File size limit before JSON parse');
const sw118=asText('v118/sw118.js');
pass(sw118.includes('asia-v118-lab-static-1'),'New SW has separate versioned cache');
pass(sw118.includes('self.registration.scope'),'SW only intercepts scoped local resources');
pass(!sw118.includes('https://api.'),'SW makes no remote API calls');
const server=asText('scripts/serve118.mjs');
pass(server.includes("'/v118/'")&&server.includes("'/web/'"),'New server serves distinct versioned scopes');
pass(server.includes("server.listen(port,'127.0.0.1'"),'Local-only HTTP server');
pass(server.includes("'Content-Security-Policy'"),'Server has CSP');
pass(!server.includes('0.0.0.0'),'Server not exposed on LAN');
pass(!server.includes('asia-2027-ai')&&!server.includes('asia2027db'),'Server does not contain production connectivity');
console.log(`V11.8: ${u} comprobaciones de contratos + ${e} pruebas de integración y seguridad offline.`);
