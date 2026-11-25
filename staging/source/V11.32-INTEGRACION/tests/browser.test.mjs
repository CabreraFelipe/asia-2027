import {prepareSelectiveRestore,validPresentation} from '../src/selective-restore.mjs';
import {downloadEncryptedCopy} from '../src/download.mjs';
import {openDeviceRepository,devicePolicy} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {openSessionVault} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
import {inspectPendingRecovery} from '../../V11.31-INTEGRACION/src/recovery.mjs';
import {encrypt84} from '../../../../model84.mjs';
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
async function rejects(fn,pattern){try{await fn()}catch(e){check(pattern.test(e.message),e.message);return}throw Error('Se esperaba rechazo')}
export async function run(){
 const policy=globalThis.asiaAccounts106,A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32);
 let accountId=A,csrf='a1';
 const readSession=async()=>({accountId,csrf}),repository=await openDeviceRepository();
 const passphrase='frase sintética bóveda V11.32',recoveryPhrase='frase sintética recuperación V11.32',backupPhrase='frase sintética respaldo V11.32';
 const diary='asia2027-v1',gym='asia-gym-active53',theme='asia-theme-v4',layout='asia-layout-v51',coach='asia-coach-v50';
 const open=()=>openSessionVault({readSession,repository,passphrase,policy:devicePolicy(policy)});
 const layoutValue=JSON.stringify({order:['day','coach'],hidden:['coach'],singleOpen:true,folded:[]});
 const envelope=await encrypt84({format:'asia-v1131-pending-recovery-v1',accountId:A,capturedAt:new Date().toISOString(),entries:[[theme,'light:ocean'],[layout,layoutValue],[diary,'{"marker":"pending"}'],[gym,'{"start":123}'],['asia-layout-v541-diet','{"order":["unknown"]}']]},recoveryPhrase);
 const prepare=()=>prepareSelectiveRestore({readSession,repository,passphrase,policy,envelope,recoveryPhrase,backupPhrase});
 try{
  let s=await open();s.storage.setItem(diary,'{"marker":"winner"}');s.storage.setItem(gym,'{"start":456}');s.storage.setItem(theme,'dark');s.storage.setItem(coach,'{"note":"keep"}');await s.flush();s.close();
  const before=await repository.read(A);
  let plan=await prepare();
  check(plan.rows.find(x=>x.key===theme).eligible&&plan.rows.find(x=>x.key===layout).eligible,'Preferencias no seleccionables');
  for(const k of [diary,gym,coach,'asia-layout-v541-diet'])check(!plan.rows.find(x=>x.key===k).eligible,'Selección insegura');
  check(plan.rows.find(x=>x.key===coach).state==='absent','Clave ausente no detectada');
  check(!JSON.stringify(plan.rows).includes('winner'),'Preview expone valores');
  check(JSON.stringify(before)===JSON.stringify(await repository.read(A)),'Preview escribió datos');
  const backup=await inspectPendingRecovery({readSession,policy,envelope:plan.backup,recoveryPhrase:backupPhrase});
  check(new Map(backup.entries).get(diary)==='{"marker":"winner"}','Respaldo del ganador incompleto');
  // Browser API contract: verify Blob is encrypted, filename and explicit download click without actual disk I/O.
  let blob,clicked=false,removed=false;
  downloadEncryptedCopy(plan.backup,{document:{body:{append(a){check(a.download==='asia-respaldo-previo.json','Nombre incorrecto')}},createElement(){return {click(){clicked=true},remove(){removed=true}}}},url:{createObjectURL(b){blob=b;return 'blob:fixture'},revokeObjectURL(){}},filename:'asia-respaldo-previo.json'});
  check(clicked&&removed&&JSON.parse(await blob.text()).cipher===plan.backup.cipher,'Descarga no cifrada');
  await rejects(()=>plan.apply({selectedKeys:[theme],confirmed:true}),/respaldo/);
  await rejects(()=>plan.apply({selectedKeys:[diary],backupSaved:true,confirmed:true}),/Selección/);
  const result=await plan.apply({selectedKeys:[theme,layout],backupSaved:true,confirmed:true});
  check(result.revision===before.revision+1,'No atómico');
  await rejects(()=>plan.apply({selectedKeys:[theme],backupSaved:true,confirmed:true}),/cerrado/);
  s=await open();check(s.storage.getItem(theme)==='light:ocean'&&s.storage.getItem(layout)===layoutValue,'Preferencias no restauradas');
  check(s.storage.getItem(diary)==='{"marker":"winner"}'&&s.storage.getItem(gym)==='{"start":456}'&&s.storage.getItem(coach)==='{"note":"keep"}','Se perdió historial');s.close();
  // Prepare against a different current theme then force a concurrent edit between preview and apply.
  s=await open();s.storage.setItem(theme,'dark:forest');await s.flush();s.close();
  plan=await prepare();s=await open();s.storage.setItem(coach,'{"note":"new"}');await s.flush();s.close();
  await rejects(()=>plan.apply({selectedKeys:[theme],backupSaved:true,confirmed:true}),/Conflicto/);
  s=await open();check(s.storage.getItem(theme)==='dark:forest'&&s.storage.getItem(coach)==='{"note":"new"}','Conflicto sobrescrito');s.close();
  plan=await prepare();accountId=B;csrf='b';await rejects(()=>plan.apply({selectedKeys:[theme],backupSaved:true,confirmed:true}),/cambió/);
  await rejects(()=>prepare(),/otra cuenta/);
  accountId=A;csrf='a2';plan=await prepare();plan.cancel();await rejects(()=>plan.apply({selectedKeys:[theme],backupSaved:true,confirmed:true}),/cerrado/);
  check(!validPresentation(theme,'dark:evil')&&!validPresentation(layout,JSON.stringify({order:['day','day'],hidden:[],folded:[],singleOpen:false})),'Validador demasiado permisivo');
  return {ok:true,checks:'Preview sin escrituras; respaldo cifrado del ganador; descarga explícita simulada; restauración selectiva de apariencia en un CAS; diario/relojes/Coach intactos; rechazo de conflicto, cuenta, claves, cancelación y doble aplicación'};
 }finally{repository.close()}
}
