import {captureFullArchive,prepareFullImport} from '../src/full-archive.mjs';
import {unlockCandidate} from '../src/auth-gate.mjs';
import {openUnifiedRepository} from '../../V11.34-INTEGRACION/src/unified-repository.mjs';
import {openEncryptedModuleStore} from '../../V11.28-INTEGRACION/src/encrypted-module-store.mjs';
import {MODULES} from '../../../../store84.mjs';
import {empty84} from '../../../../model84.mjs';
import {seedGym,applyGym} from '../../../../gym84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
async function rejects(fn,pattern){try{await fn()}catch(e){check(pattern.test(e.message),e.message);return}throw Error('Se esperaba rechazo')}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<150;i++){if(fn())return;await sleep(100)}throw Error(label)}
function transient(){const m=new Map();return Object.freeze({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]??null,get length(){return m.size}})}
export async function run(){
 const policy=globalThis.asiaAccounts106,A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),origin='https://asia-v1111-identity-staging.example.workers.dev';
 let accountId=A,csrf='a1',authorized=true,loggedOut=false,frame;
 const readSession=async()=>({accountId,csrf});
 const fetcher=async(url,options)=>{check(options.credentials==='same-origin'&&options.cache==='no-store'&&options.redirect==='error','Solicitud insegura');
  if(url===origin+'/v11.11/auth/me')return new Response(JSON.stringify(authorized?{ok:true,syntheticOnly:true,accountId,csrf}:{ok:false}),{status:authorized?200:401});
  check(url===origin+'/v11.11/auth/logout'&&options.method==='POST'&&options.headers['X-Asia-CSRF']===csrf,'Logout inválido');loggedOut=true;authorized=false;return new Response('{"ok":true}');
 };
 const repository=await openUnifiedRepository(),sourcePhrase='frase sintética archivo completo',passphrase='frase sintética destino completo';
 const raw={body:{'2026-11-22':{weight:78.2}},diet:{'2026-11-22':{steps:7812,notes:'prueba ñ'}},work:{},photos:{},settings:{height:1.81}};
 const map=new Map([['asia2027-v1',JSON.stringify(raw)],['asia-theme-v4','dark:forest']]);
 let gym=seedGym();gym=applyGym(gym,{type:'start',id:'ci-full-gym',routineId:gym.routines[0].id,date:'2026-11-22'},1700000000000);gym=applyGym(gym,{type:'set',entryId:gym.active.entries[0].id,index:0,values:{kg:20,reps:10,rir:2,done:true}},1700000001000);gym=applyGym(gym,{type:'finish'},1700000002000);
 const records=Object.fromEntries(MODULES.map(name=>[name,{name,revision:1,payload:name==='preferences'?empty84():name==='gym'?gym:{fixture:name}}]));
 records.recovery={name:'recovery',revision:0,payload:{}};
 const store={read:async name=>structuredClone(records[name]),readPair:async()=>({preferences:structuredClone(records.preferences),gym:structuredClone(records.gym)})};
 const capture=()=>captureFullArchive({storage:{getItem:k=>map.get(k)??null},store,policy,passphrase:sourcePhrase,sourceContextConfirmed:true});
 try{
  const captured=await capture();check(captured.inventory.length===12&&captured.inventory.filter(x=>x.present).length===11,'Inventario incompleto');
  const plan=await prepareFullImport({readSession,repository,policy,envelope:captured.envelope,sourcePhrase,accountPhrase:passphrase});
  check(await repository.empty(A),'Preview escribió');await plan.commit({confirmed:true,sourceRetained:true,inventoryReviewed:true});
  const m=await openEncryptedModuleStore({readSession,repository:repository.modules,passphrase});
  for(const name of MODULES){const got=await m.read(name);check(JSON.stringify(got.payload)===JSON.stringify(records[name].payload)&&got.revision===records[name].revision,'Módulo perdido: '+name)}m.close();
  authorized=false;const unlock=()=>unlockCandidate({origin,fetcher,repository,policy,passphrase});
  await rejects(unlock,/Sesión no disponible/);authorized=true;
  const gate=await unlock();check(JSON.parse(gate.storage.getItem('asia2027-v1')).settings.height===1.81,'Diario no recuperado');
  globalThis.__asiaCandidateFixture={readSession:gate.readSession,passphrase:gate.passphrase,storage:gate.storage,sessionStorage:transient()};
  frame=document.createElement('iframe');frame.style.width='390px';frame.style.height='844px';const loaded=new Promise(r=>frame.addEventListener('load',r,{once:true}));
  frame.src='/staging/source/V11.29-INTEGRACION/tests/candidate/index.html';document.body.append(frame);await loaded;
  const w=frame.contentWindow,d=frame.contentDocument;await until(()=>w.asiaGym84Ready===true,'Gym no disponible');
  check(d.getElementById('height').value==='1.81','UI no recuperó diario');
  d.getElementById('tabTrain').click();[...d.querySelectorAll('button')].find(b=>b.textContent==='Revisar sesiones PRO').click();
  await until(()=>d.getElementById('gymMigrationStatus826').textContent.includes('1 sesiones revisadas'),'UI no recuperó módulo Gym unificado');
  await gate.close({logout:true,unmount(){frame.remove();frame=null;delete globalThis.__asiaCandidateFixture}});
  check(loggedOut&&!authorized,'Logout no confirmado');await rejects(()=>Promise.resolve(gate.storage.getItem('asia2027-v1')),/bloqueada/);
  accountId=B;csrf='b';authorized=true;const b=await unlock();check(b.storage.getItem('asia2027-v1')===null,'B recibió datos de A');authorized=false;await rejects(()=>b.readSession(),/Sesión no disponible/);await rejects(()=>Promise.resolve(b.storage.getItem('asia2027-v1')),/bloqueada/);authorized=true;
  check(map.get('asia2027-v1')===JSON.stringify(raw),'Fuente modificada');
  return {ok:true,checks:'12 módulos inventariados, 11 presentes y 1 ausente preservados, puerta HTTP sintética, rechazo anónimo, ambas bóvedas y controles originales, logout y aislamiento'};
 }finally{frame?.remove();delete globalThis.__asiaCandidateFixture;repository.close()}
}
