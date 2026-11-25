// Explicit import into a NEW synthetic account. Reuse V10.6's real backup parser.
import {read844} from '../../../../backup844.mjs';
import {inspectLegacy88} from '../../../../migration88.mjs';
import {encrypt84,checksum84} from '../../../../model84.mjs';
import {MODULES,clonePayload} from '../../../../store84.mjs';
import {devicePolicy} from '../../V11.30-INTEGRACION/src/device-session.mjs';
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const valid=s=>s&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>0;
const same=(a,b)=>valid(a)&&valid(b)&&a.accountId===b.accountId&&a.csrf===b.csrf;
export async function prepareLegacyImport({readSession,repository,policy,envelope,sourcePhrase,accountPhrase}){
 const identity=await readSession();check(valid(identity),'Sesión inválida');
 async function verify(){check(same(identity,await readSession()),'La sesión cambió')}
 check(typeof accountPhrase==='string'&&accountPhrase.length>=12,'Frase de cuenta inválida');
 check(await repository.empty(identity.accountId),'La cuenta ya contiene datos');
 const source=await read844(envelope,sourcePhrase);await verify();
 // Reject extra fields instead of silently omitting extensions from unfamiliar backups.
 const expected=['format','created','legacy','preferences','gym','presentation844','coach844'];
 check(Object.keys(source).length===expected.length&&expected.every(k=>Object.hasOwn(source,k)),'Formato integral no reconocido');
 const allowed=new Set(devicePolicy(policy).portable), entries=[['asia2027-v1',JSON.stringify(source.legacy)],...Object.entries(source.presentation844),...Object.entries(source.coach844)].filter(([,v])=>v!==null);
 check(entries.every(([k,v])=>allowed.has(k)&&typeof v==='string')&&new Set(entries.map(([k])=>k)).size===entries.length,'Claves no permitidas');
 const inventory=Object.freeze({...inspectLegacy88(source.legacy),proSessions:source.gym.sessions.length,proFoods:source.preferences.foods.length,coachKeys:Object.values(source.coach844).filter(v=>v!==null).length,presentationKeys:Object.values(source.presentation844).filter(v=>v!==null).length});
 const modules=Object.fromEntries(['preferences','gym'].map(name=>[name,{name,revision:1,payload:clonePayload(source[name])}]));
 const hash=await checksum84(source);
 const local=await encrypt84({format:'asia-v1126-local-vault-v1',accountId:identity.accountId,revision:1,entries},accountPhrase);
 const modular=await encrypt84({format:'asia-v1128-modules-v1',accountId:identity.accountId,revision:1,modules},accountPhrase);
 await verify();check(await repository.empty(identity.accountId),'La cuenta ya contiene datos');
 let active=true;
 return Object.freeze({inventory,sourceHash:hash,coveredModules:Object.freeze(['preferences','gym']),uncoveredModules:Object.freeze(MODULES.filter(n=>!Object.hasOwn(modules,n))),
  cancel(){active=false},
  async commit({confirmed,sourceRetained,uncoveredChecked}={}){
   check(active,'Plan cerrado');
   check(confirmed===true&&sourceRetained===true&&uncoveredChecked===true,'Confirmá la copia original y el inventario no cubierto');
   active=false;await verify();
   // Atomic transaction checks absence again; either both encrypted records are written or neither.
   await repository.initialize(identity.accountId,{revision:1,envelope:local},{revision:1,envelope:modular});
   return Object.freeze({revision:1,inventory,sourceHash:hash});
  }
 });
}
