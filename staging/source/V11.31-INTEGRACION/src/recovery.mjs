// Explicit, encrypted recovery snapshot of an unconfirmed local session. No automatic import.
import {openDeviceSession,devicePolicy} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {encrypt84,decrypt84} from '../../../../model84.mjs';
const format='asia-v1131-pending-recovery-v1',check=(ok,msg)=>{if(!ok)throw Error(msg)};
const valid=s=>typeof s?.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>0;
const same=(a,b)=>valid(a)&&valid(b)&&a.accountId===b.accountId&&a.csrf===b.csrf;
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
function validateEntries(entries,policy){
 const allowed=new Set(devicePolicy(policy).portable),seen=new Set();
 check(Array.isArray(entries)&&entries.length<=allowed.size,'Entradas inválidas');
 for(const e of entries){
  check(Array.isArray(e)&&e.length===2&&allowed.has(e[0])&&!seen.has(e[0])&&typeof e[1]==='string','Clave de recuperación inválida');
  seen.add(e[0]);
 }
 return entries.map(([k,v])=>[k,v]);
}
export async function openRecoverableDeviceSession(options){
 const {readSession,policy}=options;
 const identity=await readSession();check(valid(identity),'Sesión inválida');
 async function verify(){
  const s=await readSession();
  if(!same(s,identity)){const e=Error('La sesión cambió');e.revoked=true;throw e}
  return s;
 }
 const session=await openDeviceSession({...options,readSession:verify});
 async function exportPending(recoveryPhrase){
  check(session.status.phase==='error','Solo se recuperan cambios de un guardado no confirmado');
  check(typeof recoveryPhrase==='string'&&recoveryPhrase.length>=12,'Frase de recuperación inválida');
  await verify();
  check(session.status.phase==='error','Estado de guardado cambió');
  const entries=validateEntries(devicePolicy(policy).portable.flatMap(k=>{
   const v=session.storage.getItem(k);return v===null?[]:[[k,v]];
  }),policy);
  const capturedAt=new Date().toISOString();
  const envelope=await encrypt84({format,accountId:identity.accountId,capturedAt,entries},recoveryPhrase);
  await verify();
  check(session.status.phase==='error','Estado de guardado cambió');
  // A save or new mutation while encrypting must not be presented as a current snapshot.
  const current=validateEntries(devicePolicy(policy).portable.flatMap(k=>{
   const v=session.storage.getItem(k);return v===null?[]:[[k,v]];
  }),policy);
  check(JSON.stringify(current)===JSON.stringify(entries),'Cambios posteriores: repetí la recuperación');
  return envelope;
 }
 return Object.freeze({storage:session.storage,flush:session.flush,close:session.close,attachLifecycle:session.attachLifecycle,
  get status(){return session.status},exportPending});
}
// Authenticated explicit inspection only; never applies a snapshot or modifies storage.
export async function inspectPendingRecovery({readSession,policy,envelope,recoveryPhrase}){
 const identity=await readSession();check(valid(identity),'Sesión inválida');
 const data=await decrypt84(envelope,recoveryPhrase);
 check(same(identity,await readSession()),'La sesión cambió');
 check(exact(data,['format','accountId','capturedAt','entries'])&&data.format===format&&data.accountId===identity.accountId,'Recuperación de otra cuenta o formato inválido');
 check(typeof data.capturedAt==='string'&&Number.isFinite(Date.parse(data.capturedAt)),'Fecha inválida');
 return Object.freeze({capturedAt:data.capturedAt,entries:Object.freeze(validateEntries(data.entries,policy).map(e=>Object.freeze(e)))});
}
