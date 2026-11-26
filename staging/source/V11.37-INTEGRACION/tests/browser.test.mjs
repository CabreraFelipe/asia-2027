import {openOfflineRepository} from '../src/offline-repository.mjs';
import {openOfflineEditing,reconcileOffline,exportOfflineConflict} from '../src/offline-session.mjs';
import {openUnifiedRepository} from '../../V11.34-INTEGRACION/src/unified-repository.mjs';
import {openDeviceSession} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {openEncryptedModuleStore} from '../../V11.28-INTEGRACION/src/encrypted-module-store.mjs';
import {seedGym} from '../../../../gym84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
async function rejects(fn,pattern){try{await fn()}catch(e){check(pattern.test(e.message),e.message);return}throw Error('Se esperaba rechazo')}
export async function run(){
 const A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),policy=globalThis.asiaAccounts106,passphrase='frase sintética trabajo offline';
 let accountId=A,csrf='a',offline=false,clock=1000;
 const readSession=async()=>{if(offline)throw Error('sin red');return {accountId,csrf}};
 const repository=await openUnifiedRepository(),pending=await openOfflineRepository();
 const options={readSession,repository,pending,policy,passphrase,now:()=>clock};
 const open=()=>openOfflineEditing(options),reconcile=()=>reconcileOffline({...options,maintenanceConfirmed:true,confirmed:true});
 const local=()=>openDeviceSession({readSession,repository:repository.local,passphrase,policy});
 const theme='asia-theme-v4',diary='asia2027-v1',timer='asia-timers-v4';
 try{
  let main=await local();main.storage.setItem(theme,'dark');await main.close();
  let s=await open();offline=true;s.storage.setItem(theme,'light:ocean');s.storage.setItem(diary,JSON.stringify({body:{},diet:{},work:{},settings:{height:1.82}}));
  s.storage.setItem(timer,'{"start":123,"elapsed":0,"rest":0}');
  await s.moduleStore.write('gym',0,seedGym());await s.flush();await s.close();
  check((await pending.inspect(A)).working.local.revision>1,'Rama no persistida');
  check(!JSON.stringify(await pending.inspect(A)).includes('light:ocean'),'Dato en claro');
  await rejects(open,/red/);await rejects(reconcile,/red/);
  offline=false;main=await local();check(main.storage.getItem(theme)==='dark','Escritura llegó a confirmado sin red');await main.close();
  s=await open();check(s.storage.getItem(theme)==='light:ocean'&&(await s.moduleStore.read('gym')).revision===1,'Rama no sobrevivió a reapertura');await s.close();
  // Exercise real encryption, pair-CAS and ordinary cached edits after Coach commit.
  s=await open();const snapshot=await s.coachSnapshot(),prior=JSON.parse(snapshot.diary),newDiary=JSON.stringify({...prior,settings:{...prior.settings,coachTest:true}});
  const activeKey='asia-gym-active53',activeValue=JSON.stringify({key:'2026-11-26_0',start:1000,index:0,end:0,paused:null,baseline:null});
  s.storage.setItem(activeKey,activeValue);await s.flush();await rejects(()=>s.coachSnapshot(),/Sesión Gym clásica/);await rejects(()=>s.commitCoachDiary(snapshot,newDiary),/Sesión Gym clásica/);check(s.storage.getItem(activeKey)===activeValue&&s.storage.getItem(diary)===snapshot.diary,'Coach modificó sesión activa');
  s.storage.setItem(activeKey,'null');await s.flush();const conflict=await s.coachSnapshot();await s.moduleStore.write('gym',1,seedGym());await rejects(()=>s.commitCoachDiary(conflict,newDiary),/modular/);
  check(s.storage.getItem(diary)===snapshot.diary,'Conflicto modificó la caché');
  const review=await s.coachSnapshot();const ack=await s.commitCoachDiary(review,newDiary);check(ack.revision===review.revision+1&&ack.proRevision===review.proRevision&&s.storage.getItem(diary)===newDiary,'Recibo o caché incorrectos');
  s.storage.setItem(theme,'light:ocean');s.storage.setItem(timer,'{"start":123,"elapsed":0,"rest":0,"coachTest":true}');await s.flush();await s.close();
  s=await open();check(s.storage.getItem(diary)===newDiary&&s.storage.getItem(timer).includes('coachTest')&&(await s.moduleStore.read('gym')).revision===2,'Guardado ordinario pisó cambio Coach');await s.close();
  // Fault injection AFTER a real IndexedDB commit: no false acknowledgement, no ordinary overwrite.
  const lostPending={...pending,async begin(...args){const a=await pending.begin(...args);return {...a,async commitCoachLocal(...params){await a.commitCoachLocal(...params);throw Error('Recibo perdido simulado')}}}};
  s=await openOfflineEditing({...options,pending:lostPending});const beforeLoss=await s.coachSnapshot(),lossDiary=JSON.stringify({...JSON.parse(beforeLoss.diary),settings:{...JSON.parse(beforeLoss.diary).settings,recoveryTest:true}});
  await rejects(()=>s.commitCoachDiary(beforeLoss,lossDiary),/Recibo perdido/);
  check(s.status.phase==='locked','Guardado incierto no bloqueó sesión');
  await rejects(()=>Promise.resolve(s.storage.getItem(diary)),/pendiente/);
  await rejects(()=>Promise.resolve(s.storage.setItem(theme,'dark')),/pendiente/);
  await rejects(()=>s.moduleStore.write('gym',2,seedGym()),/pendiente/);
  await rejects(()=>s.flush(),/pendiente/);
  await rejects(()=>s.close(),/pendiente/);
  await rejects(()=>Promise.resolve(s.closeForCoachRecovery(false)),/recuperable/);
  s.closeForCoachRecovery(true);
  s=await open();const recovered=await s.coachSnapshot();check(recovered.diary===lossDiary&&recovered.revision===beforeLoss.revision+1&&recovered.proRevision===beforeLoss.proRevision,'Recuperación no identificó commit real');
  await rejects(()=>s.commitCoachDiary(beforeLoss,lossDiary),/vigente/);
  await s.close();
  check((await reconcile()).result==='applied'&&await pending.inspect(A)===null,'No concilió');
  main=await local();check(main.storage.getItem(theme)==='light:ocean'&&main.storage.getItem(timer).includes('123')&&JSON.parse(main.storage.getItem(diary)).settings.recoveryTest===true,'Cambios locales perdidos');await main.close();
  const m=await openEncryptedModuleStore({readSession,repository:repository.modules,passphrase});check((await m.read('gym')).revision===2,'Gym no aplicado');m.close();
  s=await open();s.storage.setItem(theme,'dark:forest');await s.close();
  main=await local();main.storage.setItem(theme,'light:graphite');await main.close();
  await rejects(reconcile,/Conflicto/);check((await pending.inspect(A)).phase==='frozen','Conflicto perdido');
  const e=await exportOfflineConflict({...options,backupPhrase:'frase de recuperación sintética'});check(e.format==='asia84-encrypted-v1'&&!JSON.stringify(e).includes('dark:forest'),'Exportación inválida');
  accountId=B;csrf='b';check(await pending.inspect(B)===null,'Rama cruzada');await rejects(reconcile,/No hay rama/);
  s=await open();clock+=15*60*1000;await rejects(()=>Promise.resolve(s.storage.getItem(theme)),/vencido/);
  return {ok:true,checks:'Ediciones diario, relojes y módulos sin red en rama cifrada persistente; reapertura autenticada, conciliación CAS, conflicto congelado, exportación, aislamiento y caducidad local'};
 }finally{repository.close();pending.close()}
}
