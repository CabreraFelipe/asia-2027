import {openUnifiedRepository} from '../src/unified-repository.mjs';
import {prepareLegacyImport} from '../src/legacy-import.mjs';
import {make844,read844} from '../../../../backup844.mjs';
import {empty84} from '../../../../model84.mjs';
import {seedGym} from '../../../../gym84.mjs';
import {openDeviceSession} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {openEncryptedModuleStore} from '../../V11.28-INTEGRACION/src/encrypted-module-store.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
async function rejects(fn,pattern){try{await fn()}catch(e){check(pattern.test(e.message),e.message);return}throw Error('Se esperaba rechazo')}
export async function run(){
 const policy=globalThis.asiaAccounts106,A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),C='acct_'+'c'.repeat(32);
 let accountId=A,csrf='a1';const readSession=async()=>({accountId,csrf});
 const repository=await openUnifiedRepository(),sourcePhrase='frase sintética original V10.6',accountPhrase='frase sintética destino V11.34';
 const raw={body:{'2026-11-22':{weight:78.2}},diet:{'2026-11-22':{steps:7812,notes:'prueba ñ'}},work:{},photos:{},settings:{}};
 const map=new Map([['asia2027-v1',JSON.stringify(raw)],['asia-theme-v4','dark:forest'],['asia-coach-v50',JSON.stringify({messages:[{role:'user',content:'prueba'}]})]]);
 const pair={preferences:{revision:1,payload:empty84()},gym:{revision:1,payload:seedGym()}};
 const envelope=await make844({getItem:k=>map.get(k)??null},{readPair:async()=>structuredClone(pair)},sourcePhrase);
 const original=JSON.stringify(envelope);
 const prepare=(extra={})=>prepareLegacyImport({readSession,repository,policy,envelope,sourcePhrase,accountPhrase,...extra});
 const local=()=>openDeviceSession({readSession,repository:repository.local,passphrase:accountPhrase,policy});
 const modules=()=>openEncryptedModuleStore({readSession,repository:repository.modules,passphrase:accountPhrase});
 const confirm={confirmed:true,sourceRetained:true,uncoveredChecked:true};
 try{
  let plan=await prepare();check(plan.inventory.measurements===1&&plan.inventory.dietDays===1&&plan.inventory.coachKeys===1,'Inventario incorrecto');
  check(plan.uncoveredModules.length===10&&await repository.empty(A),'Cobertura o preview inválidos');
  await rejects(()=>plan.commit({confirmed:true}),/Confirmá/);
  let second=await prepare();await plan.commit(confirm);
  await rejects(()=>second.commit(confirm),/ya contiene/);await rejects(()=>prepare(),/ya contiene/);
  let s=await local(),m=await modules();
  check(JSON.stringify(JSON.parse(s.storage.getItem('asia2027-v1')))===JSON.stringify(raw),'Diario no preservado');
  check(s.storage.getItem('asia-theme-v4')==='dark:forest'&&s.storage.getItem('asia-coach-v50')===map.get('asia-coach-v50'),'Auxiliares no preservados');
  const restored=await m.readPair();check(JSON.stringify(restored.preferences.payload)===JSON.stringify(pair.preferences.payload)&&JSON.stringify(restored.gym.payload)===JSON.stringify(pair.gym.payload),'Módulos no preservados');
  s.storage.setItem('asia-theme-v4','light');await Promise.all([s.flush(),m.write('gym',1,pair.gym.payload)]);
  check((await repository.local.read(A)).revision===2&&(await repository.modules.read(A)).revision===2,'CAS de ramas perdió escrituras');
  check(!JSON.stringify(await repository.local.read(A)).includes('asia2027-v1'),'Datos en claro');
  await s.close();m.close();
  accountId=B;csrf='b';s=await local();m=await modules();check(s.storage.length===0&&(await m.read('gym')).revision===0,'Mezcla de cuentas');await s.close();m.close();
  plan=await prepare();accountId=C;csrf='c';await rejects(()=>plan.commit(confirm),/cambió/);check(await repository.empty(B)&&await repository.empty(C),'Importación cruzada');
  plan=await prepare();plan.cancel();await rejects(()=>plan.commit(confirm),/cerrado/);
  check(await repository.empty(C),'Cancelación escribió datos');
  await rejects(()=>prepare({sourcePhrase:'frase incorrecta de prueba'}),/[\s\S]*/);
  check(await repository.empty(C)&&JSON.stringify(envelope)===original&&JSON.stringify((await read844(envelope,sourcePhrase)).legacy)===JSON.stringify(raw),'Fuente alterada');
  return {ok:true,checks:'Respaldo V10.6 original, inventario sin escritura, importación atómica diario/Coach/preferencias y módulos PRO, adaptadores reales, CAS concurrente, aislamiento, cuenta no vacía, cancelación, fuente intacta'};
 }finally{repository.close()}
}
