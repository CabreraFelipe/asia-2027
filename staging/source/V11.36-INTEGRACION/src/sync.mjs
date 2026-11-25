// Explicit maintenance sync, synthetic only. Never transfer device clocks or credentials.
import {openSessionVault} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
import {openEncryptedModuleStore} from '../../V11.28-INTEGRACION/src/encrypted-module-store.mjs';
import {devicePolicy,persistentDeviceKeys} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {createIntegralRequest} from '../../V11.25-INTEGRACION/src/client-integral.mjs';
import {validIntegralEnvelope} from '../../V11.25-INTEGRACION/src/integral-v106.mjs';
import {validateList844} from '../../../../backup844.mjs';
import {inspectLegacy88} from '../../../../migration88.mjs';
import {validPref830} from '../../../../prefs830.mjs';
import {MODULES,clonePayload} from '../../../../store84.mjs';
import {encrypt84,decrypt84,checksum84,validate84} from '../../../../model84.mjs';
import {validateGym} from '../../../../gym84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},rev=r=>r?.revision??0;
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const valid=s=>typeof s?.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>0;
const format='asia-v1136-sync-v1';
function validatePayload(payload,policy){
 check(exact(payload,['entries','modules'])&&Array.isArray(payload.entries)&&payload.modules&&typeof payload.modules==='object'&&!Array.isArray(payload.modules),'Contenido inválido');
 const seen=new Set(),entries=[];
 for(const e of payload.entries){
  check(Array.isArray(e)&&e.length===2&&policy.portable.includes(e[0])&&!seen.has(e[0])&&typeof e[1]==='string','Clave no portable');
  const [k,v]=e;seen.add(k);
  if(k==='asia2027-v1')inspectLegacy88(JSON.parse(v));
  else if(policy.groups.presentation.includes(k))validPref830(k,v);
  else {check(v.length<=400000,'Coach demasiado grande');clonePayload({value:JSON.parse(v)})}
  entries.push([k,v]);
 }
 const modules={};
 for(const [k,v] of Object.entries(payload.modules)){
  check(MODULES.includes(k),'Módulo desconocido');modules[k]=clonePayload(v);
  if(k==='gym'){validateGym(modules[k]);check(!modules[k].active,'Finalizá la sesión PRO')}
  if(k==='preferences')validate84(modules[k]);
 }
 return {entries:entries.sort((a,b)=>a[0].localeCompare(b[0])),modules:Object.fromEntries(MODULES.filter(k=>Object.hasOwn(modules,k)).map(k=>[k,modules[k]]))};
}
const readOnly=record=>({read:async()=>record,compareAndSwap(){throw Error('Solo lectura')}});
async function localPayload({row,readSession,passphrase,policy}){
 const vault=await openSessionVault({readSession,repository:readOnly(row.local),passphrase,policy:devicePolicy(policy)});
 let store;
 try{
  store=await openEncryptedModuleStore({readSession,repository:readOnly(row.modules),passphrase});
  const devices=persistentDeviceKeys.flatMap(k=>{const v=vault.storage.getItem(k);return v===null?[]:[[k,v]]});
  const d=new Map(devices),g=JSON.parse(d.get('asia-gym-active53')||'null'),t=JSON.parse(d.get('asia-timers-v4')||'null');
  check(g===null&&(!t||(!t.start&&!t.elapsed&&!t.rest)),'Finalizá los entrenamientos y relojes');
  const entries=policy.portable.flatMap(k=>{const v=vault.storage.getItem(k);return v===null?[]:[[k,v]]});
  const modules={};for(const k of MODULES){const r=await store.read(k);if(r.revision)modules[k]=r.payload}
  return {payload:validatePayload({entries,modules},policy),devices};
 }finally{store?.close();vault.close()}
}
async function seal(payload,id,passphrase){return encrypt84({format,accountId:id,payload},passphrase)}
async function unseal(envelope,id,passphrase,policy){
 const x=await decrypt84(envelope,passphrase);check(exact(x,['format','accountId','payload'])&&x.format===format&&x.accountId===id,'Copia remota incompatible o de otra cuenta');return validatePayload(x.payload,policy)
}
export async function prepareSync({readSession,origin,fetcher=fetch,repository,policy,passphrase,maintenanceConfirmed}){
 check(maintenanceConfirmed===true,'Cerrá la interfaz antes de sincronizar');
 const identity=await readSession();check(valid(identity),'Sesión inválida');const id=identity.accountId;
 async function verify(){const s=await readSession();check(valid(s)&&s.accountId===id&&s.csrf===identity.csrf,'La sesión cambió');return s}
 const request=createIntegralRequest({origin,csrf:identity.csrf,fetcher});
 async function head(){await verify();const list=validateList844(await request('GET'));await verify();return list.head}
 const row=await repository.readSync(id),{payload:local,devices}=await localPayload({row,readSession:verify,passphrase,policy});
 const remoteRevision=await head();
 let remote=null;
 if(remoteRevision){const r=await request('GET',null,remoteRevision);check(r.ok===true&&r.revision===remoteRevision&&validIntegralEnvelope(r.envelope),'Copia remota inválida');remote=await unseal(r.envelope,id,passphrase,policy);await verify()}
 const lh=await checksum84(local),rh=remote?await checksum84(remote):null;
 const empty=local.entries.length===0&&Object.keys(local.modules).length===0;
 const base=row.baseline,localChanged=!base||base.local!==rev(row.local)||base.modules!==rev(row.modules),remoteChanged=!base||base.remote!==remoteRevision;
 const kind=remote&&lh===rh?'equal':!remote?empty?'empty':base?'conflict':'push':empty&&!base?'pull':base&&!remoteChanged&&localChanged?'push':base&&remoteChanged&&!localChanged&&remoteRevision>base.remote?'pull':'conflict';
 // Only an explicit pull may replace a nonempty local copy. Its encrypted backup is provided.
 const backup=kind==='pull'&&!empty?await seal(local,id,passphrase):null;
 let active=true;
 return Object.freeze({kind,remoteRevision,localChanged,remoteChanged,backup,
  cancel(){active=false},
  async apply({confirmed,backupSaved=false}={}){
   check(active,'Plan cerrado');check(confirmed===true&&['push','pull','equal'].includes(kind),'Sincronización no habilitada');check(!backup||backupSaved===true,'Confirmá respaldo previo');active=false;
   await verify();check(JSON.stringify(await repository.readSync(id))===JSON.stringify(row),'Conflicto de revisión local');
   check(await head()===remoteRevision,'Conflicto de revisión remota');
   let nextRemote=remoteRevision;
   if(kind==='push'){
    const envelope=await seal(local,id,passphrase);check(validIntegralEnvelope(envelope),'Copia supera límite remoto de 1,4 MB');
    await verify();check(JSON.stringify(await repository.readSync(id))===JSON.stringify(row),'Conflicto de revisión local');
    const saved=await request('POST',{expectedRevision:remoteRevision,envelope});
    check(saved.ok===true&&saved.revision===remoteRevision+1,'Guardado remoto no confirmado');
    nextRemote=saved.revision;const returned=await request('GET',null,nextRemote);
    check(returned.ok===true&&returned.revision===nextRemote&&JSON.stringify(returned.envelope)===JSON.stringify(envelope),'Verificación remota falló');
   }
   await verify();
   if(kind==='pull'){
    const lr=rev(row.local)+1,mr=rev(row.modules)+1;
    check(Number.isSafeInteger(lr)&&Number.isSafeInteger(mr),'Límite de revisión');
    const localRecord={revision:lr,envelope:await encrypt84({format:'asia-v1126-local-vault-v1',accountId:id,revision:lr,entries:[...remote.entries,...devices]},passphrase)};
    const modulesRecord={revision:mr,envelope:await encrypt84({format:'asia-v1128-modules-v1',accountId:id,revision:mr,modules:Object.fromEntries(Object.entries(remote.modules).map(([name,payload])=>[name,{name,revision:mr,payload}]))},passphrase)};
    await verify();check(await head()===remoteRevision,'Conflicto de revisión remota');
    await repository.commitSync(id,row,{local:localRecord,modules:modulesRecord,baseline:{remote:remoteRevision,local:lr,modules:mr}});
   }else await repository.commitSync(id,row,{baseline:{remote:nextRemote,local:rev(row.local),modules:rev(row.modules)}});
   return {kind,remoteRevision:nextRemote};
  }
 });
}
