import {createController} from '../src/controller.mjs';
import {candidateMount} from '../src/fixture-mount.mjs';
import {mountShell} from '../src/shell.mjs';
import {openUnifiedRepository} from '../../V11.34-INTEGRACION/src/unified-repository.mjs';
import {openOfflineRepository} from '../../V11.37-INTEGRACION/src/offline-repository.mjs';
import {openDeviceSession} from '../../V11.30-INTEGRACION/src/device-session.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,m){for(let i=0;i<200;i++){if(fn())return;await sleep(100)}throw Error(m)}
async function rejects(fn,p){try{await fn()}catch(e){check(p.test(e.message),e.message);return}throw Error('Se esperaba rechazo')}
export async function run(){
 const A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),policy=globalThis.asiaAccounts106,origin='https://asia-v1111-identity-staging.example.workers.dev',passphrase='frase sintética V11.40';
 let accountId=A,csrf='a',offline=false,authorized=true,shell;
 const repository=await openUnifiedRepository(),pending=await openOfflineRepository(),cloud=new Map();
 const readSession=async()=>({accountId,csrf});
 const fetcher=async(url,opt={})=>{
  if(offline)throw Error('sin red');const path=new URL(url).pathname,response=(x,status=200)=>new Response(JSON.stringify(x),{status});
  if(path==='/v11.11/auth/me')return response(authorized?{ok:true,syntheticOnly:true,accountId,csrf}:{ok:false},authorized?200:401);
  if(path==='/v11.11/auth/logout'){authorized=false;return response({ok:true})}
  if(path.startsWith('/v11.39/services/')){const kind=path.split('/').pop();return response({ok:true,syntheticOnly:true,...kind==='health'?{records:[]}:kind==='workouts'?{workouts:[]}:{model:'fixture',remaining:0,result:{answer:'SIMULACIÓN',proposal:null}}})}
  check(path.startsWith('/v11.38/sync'),'Ruta no autorizada');if(!cloud.has(accountId))cloud.set(accountId,[]);const r=cloud.get(accountId);
  if(opt.method==='POST'){const x=JSON.parse(opt.body);if(x.expectedRevision!==r.length)return response({},409);r.push({revision:r.length+1,envelope:x.envelope,bytes:JSON.stringify(x.envelope).length,created_at:new Date().toISOString()});return response({ok:true,revision:r.length},201)}
  const id=Number(path.split('/').pop());return response(id?{ok:true,...r[id-1]}:{ok:true,head:r.length,versions:[...r].reverse().map(({revision,bytes,created_at})=>({revision,bytes,created_at}))});
 };
 const options={origin,fetcher,repository,pending,policy,passphrase,mount:candidateMount({anchor:document.getElementById('diary')}),onState:()=>shell?.render()};
 const el=id=>document.getElementById(id),frame=()=>document.querySelector('iframe');
 try{
  authorized=false;await rejects(()=>createController(options),/Sesión no disponible/);check(!frame(),'Montaje anónimo');authorized=true;
  const c=await createController(options);shell=mountShell({doc:document,anchor:el('shell'),controller:c});
  el('open1140').click();await until(()=>c.state==='editing','No abrió diario');
  const w=frame().contentWindow,d=frame().contentDocument;
  check(el('sync1140').disabled&&el('reconcile1140').disabled,'Mantenimiento habilitado con diario');
  await rejects(()=>c.prepareSync(),/Cerrá/);await rejects(()=>c.prepareImport({}),/Cerrá/);await rejects(()=>c.prepareRestore({}),/Cerrá/);
  offline=true;d.getElementById('height').value='1.84';d.getElementById('saveHeight').click();await until(()=>c.status?.phase==='saved','No guardó offline');
  w.asiaTheme8812.set('ocean',true);await until(()=>c.status?.phase==='saved','Tema offline no guardado');
  el('close1140').click();await until(()=>c.state==='maintenance'&&!frame(),'No cerró offline');
  offline=false;await rejects(()=>c.prepareSync(),/Conciliá/);
  el('reconcile1140').click();await until(()=>!c.busy&&!el('reconcile1140').disabled,'No concilió');
  check(await pending.inspect(A)===null,'Pendientes sin conciliar');
  const local=await openDeviceSession({readSession,repository:repository.local,passphrase,policy});
  check(JSON.parse(local.storage.getItem('asia2027-v1')).settings.height===1.84,'Registro original no preservado');await local.close();
  el('sync1140').click();await until(()=>!el('apply1140').disabled,'No preparó push');el('apply1140').click();await until(()=>cloud.get(A)?.length===1&&!c.busy,'Push no confirmado');
  el('logout1140').click();await until(()=>c.state==='closed','Logout no confirmado');
  shell.remove();shell=null;accountId=B;csrf='b';authorized=true;
  const b=await createController(options);await b.openDiary();check(frame().contentDocument.getElementById('height').value!=='1.84','Datos de A cruzados');await b.closeDiary();await b.reconcile(true);
  return {ok:true,checks:'Shell unificado: acceso verificado, interfaz original V10.6, altura/tema offline, mantenimiento excluyente, conciliación, sincronización amplia, logout y cuenta B aislada'};
 }finally{frame()?.remove();delete globalThis.__asiaCandidateFixture;repository.close();pending.close()}
}
