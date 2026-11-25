// Synthetic maintenance mode only. No mounted UI, no automatic import, no native storage.
import {openSessionVault} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
import {devicePolicy} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {inspectPendingRecovery} from '../../V11.31-INTEGRACION/src/recovery.mjs';
import {encrypt84} from '../../../../model84.mjs';
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const valid=s=>typeof s?.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>0;
const same=(a,b)=>valid(a)&&valid(b)&&a.accountId===b.accountId&&a.csrf===b.csrf;
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const layouts=Object.freeze({
 'asia-layout-v51':'day dailyCoach reminders workout recovery weight energy advice vacation badges coach backup calendar96 profile100 goals101',
 'asia-layout-v541-diet':'overview daily adaptive strategy103 foods nutrition water measure charts history compare calendar photos weekly',
 'asia-layout-v541-training':'work strength sessions calendar performance muscle',
 'asia-layout-v541-health':'health history coach daily watch transfer sources',
 'asia-layout-v541-progress54':'overview stats photos report simulator'
});
function list(a,allowed){return Array.isArray(a)&&a.length<=allowed.length&&new Set(a).size===a.length&&a.every(x=>allowed.includes(x))}
function group(x,allowed){return exact(x,['order','hidden'])&&list(x.order,allowed)&&list(x.hidden,allowed)}
export function validPresentation(key,value){
 if(typeof value!=='string'||value.length>16000)return false;
 if(key==='asia-theme-v4')return /^(dark|light)(:(original|ocean|forest|graphite))?$/.test(value);
 try{
  const x=JSON.parse(value);
  if(key==='asia-layout-v822')return exact(x,['metrics','shortcuts','compact'])&&typeof x.compact==='boolean'&&group(x.metrics,['weight','steps','kcal','protein','water'])&&group(x.shortcuts,['gym','diet','xiaomi','planner','reminders','progress','coach']);
  if(!Object.hasOwn(layouts,key))return false;
  const keys=layouts[key].split(' ');
  return exact(x,['order','hidden','singleOpen','folded'])&&typeof x.singleOpen==='boolean'&&list(x.order,keys)&&list(x.hidden,keys)&&list(x.folded,keys);
 }catch{return false}
}
// Returns metadata only, not the live diary or decrypted snapshot. Absent keys never delete.
export async function prepareSelectiveRestore({readSession,repository,passphrase,policy,envelope,recoveryPhrase,backupPhrase}){
 check(typeof backupPhrase==='string'&&backupPhrase.length>=12,'Frase de respaldo inválida');
 const identity=await readSession();check(valid(identity),'Sesión inválida');
 async function verify(){const s=await readSession();if(!same(s,identity)){const e=Error('La sesión cambió');e.revoked=true;throw e}return s}
 const recovered=await inspectPendingRecovery({readSession:verify,policy,envelope,recoveryPhrase});
 const effective=devicePolicy(policy), incoming=new Map(recovered.entries);
 const vault=await openSessionVault({readSession:verify,repository,passphrase,policy:effective});
 let active=true,busy=false;
 const discard=()=>{active=false;vault.invalidate();incoming.clear()};
 try{
  const revision=vault.revision;
  const current=new Map(effective.portable.flatMap(k=>{const v=vault.storage.getItem(k);return v===null?[]:[[k,v]]}));
  const rows=Object.freeze(effective.portable.map(key=>{
   const state=!incoming.has(key)?'absent':!current.has(key)?'new':incoming.get(key)===current.get(key)?'same':'changed';
   const eligible=(state==='new'||state==='changed')&&policy.groups.presentation.includes(key)&&validPresentation(key,incoming.get(key));
   return Object.freeze({key,state,eligible});
  }));
  const eligible=new Set(rows.filter(r=>r.eligible).map(r=>r.key));
  // Same V11.31 format so the backup can be inspected after a new login. No restore of absent keys.
  const backup=Object.freeze(await encrypt84({format:'asia-v1131-pending-recovery-v1',accountId:identity.accountId,capturedAt:new Date().toISOString(),entries:[...current]},backupPhrase));
  await verify();
  // Ensure plan still corresponds to persisted revision, including empty vault.
  check(((await repository.read(identity.accountId))?.revision??0)===revision,'Conflicto: la copia vigente cambió');
  await verify();
  return Object.freeze({rows,revision,backup,
   cancel(){check(!busy,'Restauración en curso');discard()},
   async apply({selectedKeys,backupSaved,confirmed}={}){
    check(active&&!busy,'Plan cerrado o en curso');
    check(backupSaved===true&&confirmed===true,'Confirmá el respaldo y la selección');
    check(Array.isArray(selectedKeys)&&selectedKeys.length>0&&new Set(selectedKeys).size===selectedKeys.length&&selectedKeys.every(k=>eligible.has(k)),'Selección no habilitada');
    const keys=[...selectedKeys];busy=true;
    try{
     await verify();
     check(((await repository.read(identity.accountId))?.revision??0)===revision,'Conflicto: la copia vigente cambió');
     await verify();
     for(const k of keys)vault.storage.setItem(k,incoming.get(k));
     const committed=await vault.flush();check(committed===revision+1,'Guardado no confirmado');
     return Object.freeze({revision:committed,restored:Object.freeze(keys)});
    }finally{discard();busy=false}
   }
  });
 }catch(e){discard();throw e}
}
