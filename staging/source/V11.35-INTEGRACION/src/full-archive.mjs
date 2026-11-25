// Synthetic, explicit, read-only capture of all known V10.6 stores. Never opens source storage itself.
import {make844,read844} from '../../../../backup844.mjs';
import {inspectLegacy88} from '../../../../migration88.mjs';
import {MODULES,clonePayload} from '../../../../store84.mjs';
import {checksum84,encrypt84,decrypt84} from '../../../../model84.mjs';
import {devicePolicy} from '../../V11.30-INTEGRACION/src/device-session.mjs';
const check=(ok,msg)=>{if(!ok)throw Error(msg)},eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const valid=s=>typeof s?.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>0;
const same=(a,b)=>valid(a)&&valid(b)&&a.accountId===b.accountId&&a.csrf===b.csrf;
const format='asia-v1135-complete-known-local-v1';
function modulesChecked(records){
 check(exact(records,MODULES),'Inventario modular incompleto');
 return Object.fromEntries(MODULES.map(name=>{
  const r=records[name];check(exact(r,['name','revision','payload'])&&r.name===name&&Number.isSafeInteger(r.revision)&&r.revision>=0,'Registro modular inválido');
  const payload=clonePayload(r.payload);check(r.revision!==0||Object.keys(payload).length===0,'Módulo ausente con contenido');return [name,{name,revision:r.revision,payload}];
 }));
}
async function readModules(store){return modulesChecked(Object.fromEntries(await Promise.all(MODULES.map(async name=>[name,await store.read(name)]))))}
function portableRaw(storage,policy){return Object.fromEntries(policy.portable.map(k=>[k,storage.getItem(k)]))}
function idle(storage){const g=JSON.parse(storage.getItem('asia-gym-active53')||'null'),t=JSON.parse(storage.getItem('asia-timers-v4')||'null');check(g===null&&(!t||(!t.start&&!t.elapsed&&!t.rest)),'Finalizá los entrenamientos y relojes antes de exportar')}
export async function captureFullArchive({storage,store,policy,passphrase,sourceContextConfirmed}){
 check(sourceContextConfirmed===true,'Confirmá el contexto original de almacenamiento');
 check(typeof passphrase==='string'&&passphrase.length>=12,'Frase inválida');
 idle(storage);const raw=portableRaw(storage,policy),modules=await readModules(store);
 // Real original backup captures journal, appearance, Coach and validates the original pair.
 const original=await make844(storage,store,passphrase,()=>{try{idle(storage);return false}catch{return true}});
 const payload=await read844(original,passphrase);
 for(const k of ['preferences','gym'])if(modules[k].revision)check(eq(modules[k].payload,payload[k]),'El par original cambió');
 const body={format,original,modules},sha256=await checksum84(body),envelope=await encrypt84({body,sha256},passphrase);
 idle(storage);check(eq(raw,portableRaw(storage,policy))&&eq(modules,await readModules(store)),'Los registros cambiaron durante la captura');
 idle(storage);check(eq(raw,portableRaw(storage,policy)),'El diario cambió durante la captura');
 return Object.freeze({envelope,inventory:Object.freeze(MODULES.map(name=>Object.freeze({name,present:modules[name].revision>0,sourceRevision:modules[name].revision})))});
}
export async function prepareFullImport({readSession,repository,policy,envelope,sourcePhrase,accountPhrase}){
 const identity=await readSession();check(valid(identity),'Sesión inválida');const verify=async()=>check(same(identity,await readSession()),'La sesión cambió');
 check(typeof accountPhrase==='string'&&accountPhrase.length>=12,'Frase de cuenta inválida');check(await repository.empty(identity.accountId),'La cuenta ya contiene datos');
 const x=await decrypt84(envelope,sourcePhrase);check(exact(x,['body','sha256'])&&exact(x.body,['format','original','modules'])&&x.body.format===format&&x.sha256===await checksum84(x.body),'Integridad inválida');
 const source=await read844(x.body.original,sourcePhrase),modules=modulesChecked(x.body.modules);
 check(exact(source,['format','created','legacy','preferences','gym','presentation844','coach844']),'Respaldo original no reconocido');
 for(const k of ['preferences','gym'])if(modules[k].revision)check(eq(modules[k].payload,source[k]),'Módulos inconsistentes con respaldo original');
 const entries=[['asia2027-v1',JSON.stringify(source.legacy)],...Object.entries(source.presentation844),...Object.entries(source.coach844)].filter(([,v])=>v!==null);
 const allowed=new Set(devicePolicy(policy).portable);check(entries.every(([k,v])=>allowed.has(k)&&typeof v==='string')&&new Set(entries.map(([k])=>k)).size===entries.length,'Claves inválidas');
 // Preserve presence/absence and exact payloads. Destination revisions begin at 1; source revisions in inventory.
 const records=Object.fromEntries(MODULES.filter(k=>modules[k].revision>0).map(k=>[k,{name:k,revision:1,payload:modules[k].payload}]));
 const inventory=Object.freeze({diary:Object.freeze(inspectLegacy88(source.legacy)),modules:Object.freeze(MODULES.map(k=>Object.freeze({name:k,present:modules[k].revision>0,sourceRevision:modules[k].revision})))});
 const local=await encrypt84({format:'asia-v1126-local-vault-v1',accountId:identity.accountId,revision:1,entries},accountPhrase);
 const modular=await encrypt84({format:'asia-v1128-modules-v1',accountId:identity.accountId,revision:1,modules:records},accountPhrase);
 await verify();check(await repository.empty(identity.accountId),'La cuenta ya contiene datos');
 let active=true;
 return Object.freeze({inventory,sourceHash:x.sha256,cancel(){active=false},async commit({confirmed,sourceRetained,inventoryReviewed}={}){
  check(active,'Plan cerrado');check(confirmed===true&&sourceRetained===true&&inventoryReviewed===true,'Confirmá inventario y respaldo');active=false;await verify();
  await repository.initialize(identity.accountId,{revision:1,envelope:local},{revision:1,envelope:modular});return {revision:1,inventory,sourceHash:x.sha256};
 }});
}
