import {openDeviceRepository,openDeviceSession,persistentDeviceKeys} from '../src/device-session.mjs';
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<150;i++){if(fn())return;await sleep(100)}throw Error(label)}
async function rejects(fn,pattern){try{await fn()}catch(e){check(pattern.test(e.message),e.message);return}throw Error('Se esperaba rechazo')}
function transient(){const m=new Map();return Object.freeze({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]??null,get length(){return m.size}})}
export async function run(){
 const policy=globalThis.asiaAccounts106,A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32);
 let accountId=A,csrf='a',offline=false,frame,session,detach;
 const readSession=async()=>{if(offline)throw Error('offline');return {accountId,csrf}};
 let repo=await openDeviceRepository();
 const phrase=()=> 'frase sintética dispositivo '+accountId;
 const open=(extra={})=>openDeviceSession({readSession,repository:repo,passphrase:phrase(),policy,...extra});
 async function mount(){
  session=await open();globalThis.__asiaCandidateFixture={readSession,passphrase:phrase(),storage:session.storage,sessionStorage:transient()};
  frame=document.createElement('iframe');frame.style.width='390px';frame.style.height='844px';
  const loaded=new Promise(r=>frame.addEventListener('load',r,{once:true}));
  frame.src='/staging/source/V11.29-INTEGRACION/tests/candidate/index.html';document.body.append(frame);await loaded;
  const w=frame.contentWindow,d=frame.contentDocument;
  await until(()=>w.asiaGym84Ready===true,'Puente Gym no cargó');
  detach=session.attachLifecycle(d,w);d.getElementById('tabTrain').click();
  return {w,d,click:id=>d.getElementById(id).click()};
 }
 async function unmount(){
  await session.close();detach();frame.remove();delete globalThis.__asiaCandidateFixture;frame=null;
 }
 const key='asia2027-v1',[gym,timers]=persistentDeviceKeys;
 try{
  let ui=await mount();
  ui.click('startSession');check(ui.w.asiaClassicRunning532(),'Cronómetro original no inició');
  const start=JSON.parse(session.storage.getItem(timers)).start;check(start>0,'Inicio no guardado en memoria');
  ui.d.getElementById('height').value='1.82';ui.click('saveHeight');
  await until(()=>session.status.phase==='saved','Autoguardado no confirmado');
  check((await repo.read(A))?.revision>0,'Autoguardado sin commit');
  await unmount();repo.close();repo=await openDeviceRepository();
  ui=await mount();check(ui.w.asiaClassicRunning532(),'Cronómetro no recuperado');
  check(JSON.parse(session.storage.getItem(timers)).start===start,'Inicio alterado');
  check(ui.d.getElementById('height').value==='1.82','Diario no recuperado');
  await unmount();
  accountId=B;csrf='b';ui=await mount();check(!ui.w.asiaClassicRunning532(),'Cronómetro de A visible en B');
  ui.click('gymStart53');ui.click('gymBegin53');check(ui.w.asiaGymHasSession532(),'Gym original no inició');
  ui.d.querySelector('[data-gym-rest571="120"]').click();ui.click('gymPause53');
  const active=JSON.parse(session.storage.getItem(gym));check(active.start>0&&active.paused>0&&active.end===0,'Descanso no pausado');
  await unmount();ui=await mount();check(ui.w.asiaGymHasSession532(),'Sesión Gym no recuperada');
  ui.click('gymStart53');check(ui.d.getElementById('gymPhase53').textContent==='En curso','UI no retomó sesión');
  check(ui.d.getElementById('gymPause53').textContent==='Reanudar','Descanso pausado no recuperado');
  check(JSON.parse(session.storage.getItem(gym)).paused===active.paused,'Tiempo pausado alterado');
  check(ui.w.localStorage.getItem(gym)===null&&ui.w.localStorage.getItem(timers)===null,'Temporizador en claro');
  await unmount();
  accountId=A;csrf='a2';ui=await mount();check(!ui.w.asiaGymHasSession532()&&ui.w.asiaClassicRunning532(),'Mezcla de sesiones A/B');await unmount();
  const raw=await repo.read(A);check(raw.envelope.format==='asia84-encrypted-v1'&&!JSON.stringify(raw).includes(timers),'Dato en claro');
  // Explicit save errors are observable, a temporary network error retains pending edits.
  session=await open();offline=true;session.storage.setItem('asia-theme-v4','synthetic-retry');
  await rejects(()=>session.flush(),/verificar/);check(session.status.phase==='error','Error oculto');
  check(session.storage.getItem('asia-theme-v4')==='synthetic-retry','Cambio pendiente perdido por red');
  offline=false;await session.flush();check(session.status.phase==='saved','Reintento no confirmado');await session.close();
  // Conflict across two live handles cannot silently overwrite the winner.
  const one=await open(),two=await open();one.storage.setItem('asia-theme-v4','winner');await one.flush();
  two.storage.setItem('asia-theme-v4','loser');await rejects(()=>two.flush(),/Conflicto/);
  check(two.status.phase==='error'&&two.storage.getItem('asia-theme-v4')==='loser','Conflicto perdió edición o estado');
  await rejects(()=>two.close(),/Conflicto/);check(two.status.phase==='error','Cierre ocultó conflicto');
  await one.close();session=await open();check(session.storage.getItem('asia-theme-v4')==='winner','Conflicto sobrescribió ganador');
  session.storage.setItem('asia-rest533-enabled','1');await rejects(()=>session.storage.setItem('asia-rest533-token','secret'),/Credenciales/);
  await session.close();session=await open();check(session.storage.getItem('asia-rest533-enabled')===null,'Preferencia de servicio persistida');
  await session.close();
  return {ok:true,checks:'Cronómetro clásico, Gym activo y descanso pausado originales, diario, autoguardado confirmado, reapertura, aislamiento A/B, error de red, conflicto y cierre bloqueado'};
 }finally{detach?.();frame?.remove();delete globalThis.__asiaCandidateFixture;repo.close()}
}
