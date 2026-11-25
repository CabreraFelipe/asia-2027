import {prepareLargeSync} from '../src/large-sync-client.mjs';
import {prepareSync} from '../../V11.36-INTEGRACION/src/sync.mjs';
import {openUnifiedRepository} from '../../V11.34-INTEGRACION/src/unified-repository.mjs';
import {openDeviceSession} from '../../V11.30-INTEGRACION/src/device-session.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
async function rejects(fn,p){try{await fn()}catch(e){check(p.test(e.message),e.message);return}throw Error('Se esperaba rechazo')}
export async function run(){
 const accountId='acct_'+'a'.repeat(32),csrf='a',policy=globalThis.asiaAccounts106,origin='https://asia-v1111-identity-staging.example.workers.dev',passphrase='frase sintética imagen grande';
 const readSession=async()=>({accountId,csrf});
 const stores=await Promise.all(['a','b'].map(tag=>openUnifiedRepository({open:(n,v)=>indexedDB.open(n+'-large-'+tag,v)})));
 const cloud={old:[],large:[]};
 const fetcher=async(url,opt)=>{const p=new URL(url).pathname,r=p.startsWith('/v11.38/sync')?cloud.large:cloud.old;
  if(opt.method==='POST'){const x=JSON.parse(opt.body);if(x.expectedRevision!==r.length)return new Response('{}',{status:409});r.push({revision:r.length+1,envelope:x.envelope,bytes:JSON.stringify(x.envelope).length,created_at:new Date().toISOString()});return new Response(JSON.stringify({ok:true,revision:r.length}),{status:201})}
  const id=Number(p.split('/').pop());return new Response(JSON.stringify(id?{ok:true,...r[id-1]}:{ok:true,head:r.length,versions:[...r].reverse().map(({revision,bytes,created_at})=>({revision,bytes,created_at}))}));
 };
 const opts=i=>({readSession,repository:stores[i],policy,origin,passphrase,fetcher,maintenanceConfirmed:true});
 const open=i=>openDeviceSession({readSession,repository:stores[i].local,policy,passphrase});
 const confirm={confirmed:true,backupSaved:true};
 try{
  let s=await open(0);s.storage.setItem('asia-theme-v4','dark');await s.close();
  let p=await prepareSync(opts(0));await p.apply(confirm);check(cloud.old.length===1,'Namespace original no inicializado');
  const raw={body:{},diet:{},work:{},settings:{},photos:{'2026-11-22_Frente':{date:'2026-11-22',view:'Frente',img:'data:image/jpeg;base64,'+'A'.repeat(1600000)}}};
  s=await open(0);s.storage.setItem('asia2027-v1',JSON.stringify(raw));await s.close();
  await rejects(()=>prepareLargeSync(opts(0)),/Transporte diferente/);
  p=await prepareLargeSync({...opts(0),allowTransportChange:true});check(p.kind==='push','Transición incorrecta');await p.apply(confirm);
  check(cloud.old.length===1&&cloud.large.length===1&&cloud.large[0].bytes>1400000,'Copia no separada o demasiado pequeña');
  p=await prepareLargeSync(opts(1));check(p.kind==='pull','Cuenta nueva no descarga');await p.apply(confirm);
  s=await open(1);check(s.storage.getItem('asia2027-v1')===JSON.stringify(raw),'Imagen sintética no preservada');await s.close();
  p=await prepareLargeSync(opts(0));check(p.kind==='equal','Marcador no reconocido');await p.apply(confirm);
  await rejects(()=>prepareSync(opts(0)),/Transporte diferente/);
  return {ok:true,checks:'Sincronización cifrada >1,4 MB, foto sintética íntegra, transición explícita, namespaces separados y pull en otro IndexedDB'};
 }finally{stores.forEach(s=>s.close())}
}
