import {openWorkoutRepository,openWorkoutVault,WORKOUT_KEYS,workoutPolicy} from '../src/workout-vault.mjs';
import {openSessionVault} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
import {decrypt84} from '../../../../model84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<150;i++){if(fn())return;await sleep(100)}throw Error(label)}
async function rejects(fn,pattern){try{await fn()}catch(e){check(pattern.test(e.message),e.message);return}throw Error('Se esperaba rechazo')}
function transient(){const m=new Map();return Object.freeze({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]??null,get length(){return m.size}})}
export async function run(){
 const A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),policy=globalThis.asiaAccounts106,[gym,timer]=WORKOUT_KEYS;
 const diary='asia2027-v1',phrase='frase sintética entrenamiento V11.30';
 let accountId=A,csrf='a1',frame,detach,app;
 const readSession=async()=>({accountId,csrf});
 const repository=await openWorkoutRepository();
 const open=()=>openWorkoutVault({readSession,repository,passphrase:phrase,policy});
 const saved=async()=>{await until(()=>app.status().dirty===false&&!app.status().saving,'No se confirmó autoguardado: '+JSON.stringify(app.status()));check(!app.status().error,'Error de autoguardado')};
 async function mount(){
  app=await open();
  globalThis.__asiaCandidateFixture={readSession,passphrase:phrase,storage:app.storage,sessionStorage:transient()};
  frame=document.createElement('iframe');frame.style.width='390px';frame.style.height='844px';
  const loaded=new Promise(r=>frame.addEventListener('load',r,{once:true}));
  frame.src='../../V11.29-INTEGRACION/tests/candidate/index.html';document.body.append(frame);await loaded;
  const w=frame.contentWindow,d=frame.contentDocument;
  detach=app.attachLifecycle(w,d);
  await until(()=>w.asiaGym84Ready===true,'Puente Gym no listo');
  return {w,d,el:id=>{const e=d.getElementById(id);check(e,'Control ausente: '+id);return e}};
 }
 async function unmount(){await saved();detach();frame.remove();frame=null;delete globalThis.__asiaCandidateFixture;await app.close();app=null}
 function read(k){return JSON.parse(app.storage.getItem(k))}
 async function envelope(id){const r=await repository.read(id);check(r&&r.envelope,'No hay sobre persistido');return {r,p:await decrypt84(r.envelope,phrase)}}
 try{
  check(!policy.portable.includes(gym)&&!policy.portable.includes(timer),'Se modificó política de exportación');
  let ui=await mount();
  ui.el('height').value='1.83';ui.el('saveHeight').click();
  ui.el('tabTrain').click();ui.el('startSession').click();
  check(ui.w.asiaClassicRunning532(),'No inició cronómetro clásico');
  ui.d.querySelector('button[data-rest="120"]').click();
  const classic=read(timer);check(classic.start>0&&classic.rest>Date.now(),'Cronómetro o descanso ausente');
  await saved();let {r,p}=await envelope(A);
  check(p.entries.some(([k,v])=>k===diary&&JSON.parse(v).settings.height===1.83),'Diario no quedó en misma bóveda');
  check(p.entries.some(([k,v])=>k===timer&&JSON.parse(v).start===classic.start),'Cronómetro no quedó en misma revisión');
  check(!JSON.stringify(r).includes('"'+timer+'"'),'Clave en claro');
  check(ui.w.localStorage.getItem(timer)===null&&ui.w.localStorage.getItem(diary)===null,'Escritura nativa');
  await unmount();ui=await mount();
  check(ui.w.asiaClassicRunning532()&&read(timer).start===classic.start,'Cronómetro no recuperado');
  check(read(timer).rest===classic.rest,'Descanso clásico no recuperado');
  ui.w.asiaResetClassic532();
  ui.el('tabTrain').click();ui.el('gymStart53').click();ui.el('gymBegin53').click();
  check(ui.w.asiaGymHasSession532(),'No inició Gym original');
  ui.d.querySelector('[data-gym-rest571="120"]').click();ui.el('gymPause53').click();
  const active=read(gym);check(active.start>0&&active.paused>0&&active.end===0,'Descanso pausado no guardado');
  await saved();({r,p}=await envelope(A));
  check(p.entries.some(([k,v])=>k===gym&&JSON.parse(v).paused===active.paused),'Sesión ausente del sobre');
  check(!JSON.stringify(r).includes('"'+gym+'"'),'Clave Gym en claro');
  await unmount();
  accountId=B;csrf='b1';ui=await mount();
  check(!ui.w.asiaGymHasSession532()&&!ui.w.asiaClassicRunning532(),'B recibió entrenamiento de A');
  check(ui.el('height').value!=='1.83','B recibió diario A');await unmount();
  accountId=A;csrf='a2';ui=await mount();
  check(ui.w.asiaGymHasSession532()&&read(gym).start===active.start&&read(gym).paused===active.paused,'Sesión pausada perdida');
  check(ui.el('height').value==='1.83','Diario perdido');
  ui.el('tabTrain').click();ui.el('gymStart53').click();
  if(!ui.el('gymOther53').hidden)ui.el('gymOther53').click();
  check(ui.el('gymPause53').textContent==='Reanudar','UI no refleja pausa');
  ui.el('gymPause53').click();
  check(read(gym).paused===null&&read(gym).end>Date.now(),'No reanudó descanso');
  await saved();await unmount();
  // Two independent tabs: no silent overwrite; failed snapshot remains in memory.
  const a=await open(),b=await open();
  a.storage.setItem(timer,JSON.stringify({start:1,elapsed:0,rest:0,key:'a'}));await a.flush();
  b.storage.setItem(timer,JSON.stringify({start:2,elapsed:0,rest:0,key:'b'}));
  await rejects(()=>b.flush(),/Conflicto/);
  check(b.status().dirty&&b.status().error&&JSON.parse(b.storage.getItem(timer)).start===2,'Se perdió edición en conflicto');
  await rejects(()=>b.close(),/Conflicto/);
  await a.close();b.invalidate();
  // Network/session check transient failure retains memory and explicit retry can save.
  let unavailable=false;
  const c=await openWorkoutVault({readSession:async()=>{if(unavailable)throw Error('sin red');return readSession()},repository,passphrase:phrase,policy});
  unavailable=true;c.storage.setItem(timer,JSON.stringify({start:3,elapsed:0,rest:0,key:'c'}));
  await rejects(()=>c.flush(),/verificar/);check(c.status().dirty,'Cambio transitorio perdido');
  unavailable=false;await c.flush();check(!c.status().dirty,'Reintento no guardó');await c.close();
  const d=await open();d.storage.setItem('asia-diagnostic-v56','temporal');
  check(d.storage.getItem('asia-diagnostic-v56')==='temporal','Temporal incompatible');
  await rejects(()=>Promise.resolve(d.storage.setItem('asia-rest533-token','prohibido')),/Credenciales/);
  await d.flush();const record=await envelope(A);
  check(!record.p.entries.some(([k])=>k==='asia-diagnostic-v56'||k==='asia-rest533-token'),'Clave excluida persistida');
  csrf='revoked';await rejects(()=>d.flush(),/cambió/);d.invalidate();
  return {ok:true,checks:'V10.6 controles originales: cronómetro clásico y descanso, Gym pausa/reanudación, diario mismo sobre AES-GCM, aislamiento A/B, conflicto sin sobrescritura, error transitorio y credenciales excluidas'};
 }finally{detach?.();frame?.remove();app?.invalidate();delete globalThis.__asiaCandidateFixture;repository.close()}
}
