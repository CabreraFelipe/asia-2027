import {prepareSync} from '../src/sync.mjs';
import {openUnifiedRepository} from '../../V11.34-INTEGRACION/src/unified-repository.mjs';
import {openDeviceSession} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {openEncryptedModuleStore} from '../../V11.28-INTEGRACION/src/encrypted-module-store.mjs';
import {seedGym} from '../../../../gym84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
async function rejects(fn,pattern){try{await fn()}catch(e){check(pattern.test(e.message),e.message);return}throw Error('Se esperaba rechazo')}
export async function run(){
 const A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),policy=globalThis.asiaAccounts106,origin='https://asia-v1111-identity-staging.example.workers.dev',passphrase='frase sintética sincronización';
 let accountId=A,csrf='a',offline=false,failAfterPost=false;
 const readSession=async()=>{if(offline)throw Error('sin red');return {accountId,csrf}};
 const dbs=await Promise.all(['phone','android'].map(tag=>openUnifiedRepository({open:(name,version)=>indexedDB.open(name+'-'+tag,version)})));
 const cloud=new Map(),records=()=>{if(!cloud.has(accountId))cloud.set(accountId,[]);return cloud.get(accountId)};
 const response=(value,status=200)=>new Response(JSON.stringify(value),{status});
 const fetcher=async(url,opt)=>{if(offline)throw Error('sin red');check(opt.credentials==='same-origin'&&opt.cache==='no-store','Contrato HTTP');
  const r=records(),path=new URL(url).pathname;
  if(opt.method==='POST'){check(opt.headers['X-Asia-CSRF']===csrf,'CSRF');const p=JSON.parse(opt.body);if(p.expectedRevision!==r.length)return response({},409);r.push({revision:r.length+1,envelope:p.envelope,created_at:new Date().toISOString(),bytes:JSON.stringify(p.envelope).length});if(failAfterPost){failAfterPost=false;throw Error('respuesta perdida')}return response({ok:true,revision:r.length},201)}
  const id=Number(path.split('/').pop());if(id)return r[id-1]?response({ok:true,...r[id-1]}):response({},404);
  return response({ok:true,head:r.length,versions:[...r].reverse().map(({revision,created_at,bytes})=>({revision,created_at,bytes}))});
 };
 const open=(i)=>openDeviceSession({readSession,repository:dbs[i].local,passphrase,policy});
 const mod=(i)=>openEncryptedModuleStore({readSession,repository:dbs[i].modules,passphrase});
 const prepare=(i)=>prepareSync({readSession,origin,fetcher,repository:dbs[i],policy,passphrase,maintenanceConfirmed:true});
 const theme='asia-theme-v4',diary='asia2027-v1',timer='asia-timers-v4',raw={body:{'2026-11-22':{weight:78.2}},diet:{},work:{},settings:{},photos:{}};
 async function edit(i,k,v){const s=await open(i);s.storage.setItem(k,v);await s.close()}
 async function get(i,k){const s=await open(i);const v=s.storage.getItem(k);await s.close();return v}
 const confirmed={confirmed:true,backupSaved:true};
 try{
  await edit(0,diary,JSON.stringify(raw));await edit(0,theme,'dark:forest');await edit(0,timer,'{"start":0,"elapsed":0,"rest":0,"key":"device-a"}');
  let m=await mod(0);await m.write('gym',0,seedGym());m.close();
  let p=await prepare(0);check(p.kind==='push','Primera subida');await p.apply(confirmed);
  p=await prepare(1);check(p.kind==='pull','Primer dispositivo nuevo');await p.apply(confirmed);
  check(await get(1,diary)===JSON.stringify(raw)&&await get(1,theme)==='dark:forest'&&await get(1,timer)===null,'Datos perdidos o reloj transferido');
  m=await mod(1);check((await m.read('gym')).revision>0,'Gym ausente');m.close();
  await edit(1,theme,'light:ocean');p=await prepare(1);check(p.kind==='push','Cambio Android');await p.apply(confirmed);
  p=await prepare(0);check(p.kind==='pull'&&p.backup,'No detectó cambio remoto');await rejects(()=>p.apply({confirmed:true}),/respaldo/);await p.apply(confirmed);
  check(await get(0,theme)==='light:ocean'&&(await get(0,timer)).includes('device-a'),'Pull perdió estado local');
  await edit(0,theme,'dark');await edit(1,theme,'light:graphite');
  p=await prepare(0);await p.apply(confirmed);p=await prepare(1);check(p.kind==='conflict','Conflicto no detectado');await rejects(()=>p.apply(confirmed),/habilitada/);
  check(await get(1,theme)==='light:graphite','Sobrescritura silenciosa');
  // Lost response after remote commit: equal content is safely recognized on next comparison.
  await edit(0,theme,'dark:forest');p=await prepare(0);failAfterPost=true;await rejects(()=>p.apply(confirmed),/perdida/);
  p=await prepare(0);check(p.kind==='equal','No reconoció commit ambiguo');await p.apply(confirmed);
  p=await prepare(0);await edit(0,theme,'light');await rejects(()=>p.apply(confirmed),/local/);
  offline=true;await rejects(()=>prepare(0),/red/);offline=false;check(await get(0,theme)==='light','Cambio local perdido');
  accountId=B;csrf='b';p=await prepare(0);check(p.kind==='empty','B recibió copia A');
  accountId=A;csrf='a2';p=await prepare(0);accountId=B;csrf='b2';await rejects(()=>p.apply(confirmed),/cambió/);
  return {ok:true,checks:'Dos IndexedDB independientes, push/pull bidireccional cifrado, CAS, respaldo previo, reloj local excluido, conflicto, respuesta perdida, red y aislamiento'};
 }finally{for(const db of dbs)db.close()}
}
