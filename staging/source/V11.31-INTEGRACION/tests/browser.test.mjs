import {openRecoverableDeviceSession,inspectPendingRecovery} from '../src/recovery.mjs';
import {openDeviceRepository,persistentDeviceKeys} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {encrypt84} from '../../../../model84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
async function rejects(fn,pattern){try{await fn()}catch(e){check(pattern.test(e.message),e.message);return}throw Error('Se esperaba rechazo')}
export async function run(){
 const policy=globalThis.asiaAccounts106,A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32);
 let accountId=A,csrf='a1',offline=false;
 const readSession=async()=>{if(offline)throw Error('offline');return {accountId,csrf}};
 const repository=await openDeviceRepository(),passphrase='frase sintética bóveda CI',recoveryPhrase='frase distinta de recuperación CI';
 const open=()=>openRecoverableDeviceSession({readSession,repository,passphrase,policy});
 const inspect=(envelope,extra={})=>inspectPendingRecovery({readSession,policy,envelope,recoveryPhrase,...extra});
 const [gym,timer]=persistentDeviceKeys,diary='asia2027-v1';
 try{
  const winner=await open(),loser=await open();
  await rejects(()=>winner.exportPending(recoveryPhrase),/no confirmado/);
  winner.storage.setItem(diary,'{"marker":"ganador"}');await winner.flush();
  loser.storage.setItem(diary,'{"marker":"pendiente"}');
  loser.storage.setItem(gym,'{"key":"synthetic-session","start":123,"paused":45}');
  loser.storage.setItem(timer,'{"start":0,"elapsed":20,"rest":0}');
  loser.storage.setItem('asia-rest533-enabled','1');
  await rejects(()=>loser.flush(),/Conflicto/);
  const before=await repository.read(A);
  const envelope=await loser.exportPending(recoveryPhrase);
  check(envelope.format==='asia84-encrypted-v1','Sobre incorrecto');
  check(!JSON.stringify(envelope).includes('synthetic-session'),'Texto claro');
  const recovered=await inspect(envelope),map=new Map(recovered.entries);
  check(map.get(diary)==='{"marker":"pendiente"}'&&JSON.parse(map.get(gym)).paused===45&&JSON.parse(map.get(timer)).elapsed===20,'Snapshot incompleto');
  check(!map.has('asia-rest533-enabled')&&!map.has('asia-rest533-token'),'Clave no autorizada');
  check(JSON.stringify(before)===JSON.stringify(await repository.read(A)),'Exportación modificó ganador');
  await rejects(()=>inspect(envelope,{recoveryPhrase:'frase incorrecta de prueba'}),/[\s\S]*/);
  accountId=B;csrf='b';await rejects(()=>inspect(envelope),/otra cuenta/);
  await rejects(()=>loser.exportPending(recoveryPhrase),/cambió/);
  accountId=A;csrf='a2';await rejects(()=>loser.exportPending(recoveryPhrase),/cambió/);
  // New login of same account may inspect the explicit encrypted copy.
  check(new Map((await inspect(envelope)).entries).get(diary)===map.get(diary),'No se recuperó tras nuevo login');
  const forged=await encrypt84({format:'asia-v1131-pending-recovery-v1',accountId:A,capturedAt:new Date().toISOString(),entries:[['asia-rest533-token','synthetic']]},recoveryPhrase);
  await rejects(()=>inspect(forged),/Clave/);
  const duplicate=await encrypt84({format:'asia-v1131-pending-recovery-v1',accountId:A,capturedAt:new Date().toISOString(),entries:[[gym,'a'],[gym,'b']]},recoveryPhrase);
  await rejects(()=>inspect(duplicate),/Clave/);
  let calls=0;await rejects(()=>inspect(envelope,{readSession:async()=>({accountId:++calls===1?A:B,csrf:'test'})}),/cambió/);
  const fresh=await open();check(fresh.storage.getItem(diary)==='{"marker":"ganador"}','Recuperación aplicó cambios automáticamente');await fresh.close();
  return {ok:true,checks:'Conflicto real IndexedDB, snapshot cifrado explícito de diario y relojes, ganador intacto, nuevo login de A, rechazo B/frase incorrecta/credenciales/duplicados/cambio de sesión'};
 }finally{repository.close()}
}
