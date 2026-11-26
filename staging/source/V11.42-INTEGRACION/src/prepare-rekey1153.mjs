// Read-only migration preparation. No remote writes, no repository mutation.
// Future commit must coordinate all devices, pending branches and remote head.
import {openSessionVault} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
import {openEncryptedModuleStore} from '../../V11.28-INTEGRACION/src/encrypted-module-store.mjs';
import {devicePolicy} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {MODULES} from '../../../../store84.mjs';
import {encrypt84,decrypt84,checksum84,validate84} from '../../../../model84.mjs';
import {inspectLegacy88} from '../../../../migration88.mjs';
import {validateGym} from '../../../../gym84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export async function prepareLocalRekey1153({readSession,repository,pending,policy,oldPhrase,newSecret,maintenanceConfirmed}){
 check(maintenanceConfirmed===true,'Cerrá el diario antes de preparar la migración');
 check(typeof oldPhrase==='string'&&oldPhrase.length>=12&&/^[A-Za-z0-9_-]{43}$/.test(newSecret)&&oldPhrase!==newSecret,'Claves inválidas');
 const identity=await readSession(),id=identity.accountId;
 const verify=async()=>{const s=await readSession();check(s.accountId===id&&s.csrf===identity.csrf,'La sesión cambió');return s};
 check(/^acct_[a-f0-9]{32}$/.test(id),'Cuenta inválida');
 const source=await repository.readSync(id);
 check(!await pending.inspect(id),'Hay cambios pendientes: concilialos sin descartarlos');
 check(source.local||source.modules,'No hay datos locales para migrar');
 const adapter=r=>({read:async()=>r,compareAndSwap(){throw Error('Solo lectura')}});
 const vault=await openSessionVault({readSession:verify,repository:adapter(source.local),passphrase:oldPhrase,policy:devicePolicy(policy)});
 let store;
 try{
  store=await openEncryptedModuleStore({readSession:verify,repository:adapter(source.modules),passphrase:oldPhrase});
  const g=JSON.parse(vault.storage.getItem('asia-gym-active53')||'null'),t=JSON.parse(vault.storage.getItem('asia-timers-v4')||'null');
  check(g===null&&(!t||(!t.start&&!t.elapsed&&!t.rest)),'Finalizá la sesión y los relojes');
  const diary=vault.storage.getItem('asia2027-v1'),inventory={diary:diary===null?null:inspectLegacy88(JSON.parse(diary)),entries:vault.storage.length,modules:[]};
  for(const name of MODULES){const r=await store.read(name);if(r.revision){if(name==='gym'){validateGym(r.payload);check(!r.payload.active,'Finalizá Gym PRO')}if(name==='preferences')validate84(r.payload)}inventory.modules.push({name,revision:r.revision})}
  const target={baseline:source.baseline,local:null,modules:null},hashes={};
  for(const k of ['local','modules'])if(source[k]){
   const plain=await decrypt84(source[k].envelope,oldPhrase);
   check(plain.accountId===id&&plain.revision===source[k].revision,'Registro incompatible');
   const hash=await checksum84(plain),envelope=await encrypt84(plain,newSecret);
   check(await checksum84(await decrypt84(envelope,newSecret))===hash,'Recifrado no verificable');
   target[k]={revision:source[k].revision,envelope};hashes[k]=hash;
  }
  await verify();check(!await pending.inspect(id)&&eq(await repository.readSync(id),source),'Los registros cambiaron; no se preparó la migración');
  return {accountId:id,source:structuredClone(source),target,hashes,inventory,remoteReviewRequired:true};
 }finally{store?.close();vault.close()}
}
