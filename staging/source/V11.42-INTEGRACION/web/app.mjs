import './accounts106.js';
import {createController} from './staging/source/V11.40-INTEGRACION/src/controller.mjs';
import {acquireAccountWriter1171} from './staging/source/V11.40-INTEGRACION/src/account-writer1171.mjs';
import {mountShell} from './staging/source/V11.40-INTEGRACION/src/shell.mjs';
import {mountMaintenance} from './staging/source/V11.41-INTEGRACION/src/maintenance.mjs';
import {openUnifiedRepository} from './staging/source/V11.34-INTEGRACION/src/unified-repository.mjs';
import {openOfflineRepository} from './staging/source/V11.37-INTEGRACION/src/offline-repository.mjs';
import {sessionReader,openSessionVault} from './staging/source/V11.26-INTEGRACION/src/session-vault.mjs';
import {devicePolicy} from './staging/source/V11.30-INTEGRACION/src/device-session.mjs';
import {openEncryptedModuleStore} from './staging/source/V11.28-INTEGRACION/src/encrypted-module-store.mjs';
import {createLargeTransport} from './staging/source/V11.38-INTEGRACION/src/large-transport.mjs';
import {prepareLargeSync,validateLargeList} from './staging/source/V11.38-INTEGRACION/src/large-sync-client.mjs';
import {createRekeyClient1159} from './staging/source/V11.42-INTEGRACION/src/rekey-client1159.mjs';
import {prepareGranularReview1168,prepareRecoveryAction1169} from './staging/source/V11.42-INTEGRACION/src/recovery-apply1162.mjs';
export async function start(passphrase,{maintenanceOnly=false,expectedIdentity=null,managedRecovery=false}={}){
 const repository=await openUnifiedRepository(),pending=await openOfflineRepository();let shell,panel,writer;
 const mount=async fixture=>{
  if(globalThis.__asiaCandidateFixture)throw Error('Diario ya abierto');globalThis.__asiaCandidateFixture=fixture;
  const frame=document.createElement('iframe');frame.title='Diario original Asia V10.6';frame.src='/v11.42/diary/index.html';frame.inert=true;
  const remove=()=>{frame.remove();delete globalThis.__asiaCandidateFixture};document.getElementById('diary').append(frame);
  // The original diary may have nonessential resources still loading after its
  // essential modules are ready. The global load event is not a security gate.
  // Require the exact same-origin document, DOM readiness and verified Gym adapter.
  const deadline=Date.now()+60000;
  try{
   while(Date.now()<deadline){
    const win=frame.contentWindow,doc=frame.contentDocument;
    if(doc&&win.location.origin===location.origin&&win.location.pathname==='/v11.42/diary/index.html'){
     // V10.6 initializes asiaGym84Ready=false BEFORE the async bridge runs.
     // A false value alone means pending, not a terminal verification failure.
     const code=win.asiaPilotGymDiagnostic;
     if(win.asiaGym84Ready===false&&['READ','REVISION','INITIAL','SCHEMA','LEASE','SESSION','ADAPTER','OTHER'].includes(code))throw Error('Gym cifrado no verificado ('+code+').');
     if(doc.readyState!=='loading'&&win.asiaGym84Ready===true){frame.inert=false;return {remove,hide(){frame.inert=true;frame.hidden=true}}}
    }
    await new Promise(r=>setTimeout(r,100));
   }
   throw Error('El diario no verificó sus módulos esenciales en 60 segundos. Revisá la conexión.');
  }catch(e){remove();throw e}

 };
 try{
  const readSession=sessionReader({origin:location.origin}),identity=await readSession(),policy=globalThis.asiaAccounts106;
  if(expectedIdentity&&(identity.accountId!==expectedIdentity.accountId||identity.csrf!==expectedIdentity.csrf))throw Error('La sesión cambió');
  const verify=async()=>{const t=await readSession();if(t.accountId!==identity.accountId||t.csrf!==identity.csrf)throw Error('Sesión cambió');return t};
  writer=await acquireAccountWriter1171(identity.accountId);await verify();
  const snapshot=await repository.readSync(identity.accountId),branch=await pending.inspect(identity.accountId);
  let recoveryOnly=false;
  try{for(const row of [snapshot,...(branch?[branch.base,branch.working]:[])]){
   const local=await openSessionVault({readSession:verify,repository:{read:async()=>row.local},passphrase,policy:devicePolicy(policy)});local.close();
   const modules=await openEncryptedModuleStore({readSession:verify,repository:{read:async()=>row.modules,compareAndSwap(){throw Error('Solo lectura')}},passphrase});modules.close();
  }}catch(e){
   // A remotely verified managed account may have a legacy or inconsistent
   // local row. Never open it or allow ordinary writes with an unverified key.
   if(!managedRecovery||!(snapshot.local||snapshot.modules||branch))throw e;
   await verify();recoveryOnly=true;
  }
  await verify();
  // A fresh local installation is not proof of a new account. Read only the
  // authenticated remote index before initializing a local editing branch.
  // Existing local/pending records are never replaced by this check.
  const beforeOpen=async()=>{
   await verify();const row=await repository.readSync(identity.accountId),branch=await pending.inspect(identity.accountId);
   if(managedRecovery&&branch&&JSON.stringify(branch.base)!==JSON.stringify(row))throw Error('La rama pendiente y la copia confirmada difieren. Conservá ambas y revisá la conciliación.');
   if(row.local||row.modules||row.baseline||branch)return false;
   const request=createLargeTransport({origin:location.origin,readSession:verify});let list;
   try{list=validateLargeList(await request('GET'));await verify();}catch{throw Error('No se pudo verificar si hay registros en la nube. Reintentá antes de abrir el diario.');}
   if(list.head===0)return true;
   if(!managedRecovery)throw Error('Esta cuenta ya tiene una copia en la nube. Usá Comparar con nube y confirmá la recuperación antes de abrir el diario.');
   // A managed account can recover automatically ONLY into a confirmed empty
   // installation. No upload, overwrite of an existing row, or pending discard.
   // Keep the existing authenticated remote revision and local exact CAS.
   const assertFresh=async()=>{
    await verify();
    const current=await repository.readSync(identity.accountId);
    if(current.local||current.modules||current.baseline||await pending.inspect(identity.accountId))throw Error('La instalación cambió durante la recuperación. Conservá los registros y revisá mantenimiento.');
    return current;
   };
   const freshRepository={
    readSync:async id=>{if(id!==identity.accountId)throw Error('Cuenta cambió');return assertFresh()},
    commitSync:async(id,expected,next)=>{
     if(id!==identity.accountId||expected.local||expected.modules||expected.baseline||!next.local||!next.modules||next.baseline?.remote!==list.head)throw Error('Recuperación no válida');
     await assertFresh();await verify();
     return repository.commitSync(id,expected,next);
    }
   };
   let plan;
   try{
    plan=await prepareLargeSync({origin:location.origin,readSession:verify,repository:freshRepository,policy,passphrase,maintenanceConfirmed:true});
    if(plan.kind!=='pull'||plan.backup||plan.remoteRevision!==list.head)throw Error('La copia remota cambió o no admite recuperación automática');
    await assertFresh();
    const result=await plan.apply({confirmed:true});
    if(result.kind!=='pull'||result.remoteRevision!==list.head)throw Error('Recuperación no confirmada');
    await verify();
    if(await pending.inspect(identity.accountId))throw Error('Apareció una rama pendiente; conservá ambas copias y revisá mantenimiento.');
    // Return false: the recovered diary is NOT eligible for new-account setup.
    return false;
   }catch(e){throw Error('No se completó la recuperación automática. No se enviaron ni descartaron registros. '+e.message)}
   finally{plan?.cancel()}
  };
  const c=await createController({origin:location.origin,repository,pending,policy:globalThis.asiaAccounts106,passphrase,mount,beforeOpen,expectedIdentity:identity,managedWrite:managedRecovery,recoveryOnly,recoveryAction:async options=>{const client=await createRekeyClient1159(options);return prepareRecoveryAction1169({...options,client})},recoveryReview:async options=>{const client=await createRekeyClient1159(options);return prepareGranularReview1168({...options,client})},onState:s=>{shell?.render();panel?.render();if(s==='closed'){repository.close();pending.close();writer.release().finally(()=>location.replace('/v11.42/index.html'))}}});
  shell=mountShell({doc:document,anchor:document.getElementById('shell'),controller:c,onRender:()=>panel?.render()});
  panel=mountMaintenance({doc:document,anchor:document.getElementById('shell'),controller:c,onChange:()=>shell.render()});
  // Use the same guarded shell action as manual opening. Its error handling
  // keeps recovery controls available if a frozen branch or mount blocks entry.
  // Only the managed fresh-installation pull above is automatic. Never
  // reconcile, import, discard, or push automatically in this step.
  if(!maintenanceOnly&&!recoveryOnly)await document.getElementById('open1140').onclick();
  return c.state;
 }catch(e){try{panel?.remove();shell?.remove()}finally{repository.close();pending.close();await writer?.release()}throw e}
}
