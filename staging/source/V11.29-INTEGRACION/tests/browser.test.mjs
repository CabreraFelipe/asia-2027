import {openVaultRepository,openSessionVault} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
import {createLegacyBridge,createSaveCoordinator} from '../../V11.27-INTEGRACION/src/legacy-bridge.mjs';
import {openModuleRepository,openEncryptedModuleStore} from '../../V11.28-INTEGRACION/src/encrypted-module-store.mjs';
import {seedGym,applyGym} from '../../../../gym84.mjs';
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<150;i++){if(fn())return;await sleep(100)}throw Error(label)}
function transient(){const m=new Map();return Object.freeze({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]??null,get length(){return m.size}})}
export async function run(){
 const A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),policy=globalThis.asiaAccounts106;
 let id=A,frame,bridge,vault,csrf='first';
 const readSession=async()=>({accountId:id,csrf});
 const phrase=()=> 'frase sintética candidata '+id;
 const portable=await openVaultRepository(),modules=await openModuleRepository();
 const openModule=()=>openEncryptedModuleStore({readSession,repository:modules,passphrase:phrase()});
 async function mount(){
  vault=await openSessionVault({readSession,repository:portable,passphrase:phrase(),policy});
  bridge=createLegacyBridge({vault,policy});
  globalThis.__asiaCandidateFixture={readSession,passphrase:phrase(),storage:bridge.storage,sessionStorage:transient()};
  frame=document.createElement('iframe');frame.style.width='390px';frame.style.height='844px';
  const loaded=new Promise(r=>frame.addEventListener('load',r,{once:true}));
  frame.src='./candidate/index.html';document.body.append(frame);await loaded;
  const w=frame.contentWindow,d=frame.contentDocument;
  await until(()=>w.asiaGym84Ready===true,'Puente original de Gym no cargó: '+d.getElementById('releaseStatus831')?.textContent);
  check(d.title.includes('V10.6'),'Título original perdido');
  check(w.localStorage!==bridge.storage,'Storage nativo reemplazado');
  check(typeof w.indexedDB.open==='function','IndexedDB nativo reemplazado');
  check(w.localStorage.getItem('asia2027-v1')===null,'Escritura nativa');
  return {w,d};
 }
 async function unmount(){
  frame.remove();bridge.close();delete globalThis.__asiaCandidateFixture;
  await createSaveCoordinator(vault).close();frame=null;
 }
 function button(d,text){const b=[...d.querySelectorAll('button')].find(x=>x.textContent===text);check(b,'Falta botón '+text);return b}
 async function review(ui){
  ui.d.getElementById('tabTrain').click();button(ui.d,'Revisar sesiones PRO').click();
  await until(()=>ui.d.getElementById('gymMigrationStatus826').textContent.length>0,'Revisión Gym no respondió');
  return ui.d.getElementById('gymMigrationStatus826').textContent;
 }
 try{
  let s=seedGym();s=applyGym(s,{type:'start',id:'ci-session-a',routineId:s.routines[0].id,date:'2026-11-20'},1700000000000);
  s=applyGym(s,{type:'set',entryId:s.active.entries[0].id,index:0,values:{kg:20,reps:10,rir:2,done:true}},1700000001000);
  s=applyGym(s,{type:'finish'},1700000002000);
  let m=await openModule();await m.write('gym',0,s);m.close();
  let ui=await mount();check(!ui.w.asiaGym84Active,'A no debe tener sesión activa');
  check((await review(ui)).includes('1 sesiones revisadas'),'Consumidor original no leyó historial cifrado A');
  check(ui.d.getElementById('gymMigrationRows826').textContent.includes('2026-11-20'),'Fecha original no recuperada');
  ui.d.getElementById('height').value='1.83';ui.d.getElementById('saveHeight').click();
  check(JSON.parse(vault.storage.getItem('asia2027-v1')).settings.height===1.83,'Diario no usa adaptador lexical');
  check(ui.w.localStorage.getItem('asia2027-v1')===null,'Diario en claro en localStorage nativo');
  await unmount();
  id=B;csrf='b';ui=await mount();
  check((await review(ui)).includes('No hay sesiones PRO guardadas'),'B recibió sesiones de A');
  check(ui.d.getElementById('height').value!=='1.83','B recibió altura A');await unmount();
  id=A;csrf='a-new';m=await openModule();s=applyGym((await m.read('gym')).payload,{type:'start',id:'ci-active-a',routineId:s.routines[0].id,date:'2026-11-21'},1700000003000);await m.write('gym',1,s);m.close();
  ui=await mount();check(ui.w.asiaGym84Active===true,'Puente original no detectó sesión activa cifrada');
  check(ui.d.getElementById('releaseStatus831').textContent.includes('sesión PRO activa'),'Mensaje original no refleja sesión activa');
  check(ui.d.getElementById('height').value==='1.83','Altura no recuperada');
  check((await review(ui)).includes('Finalizá'),'No bloqueó revisión con sesión activa');await unmount();
  const dbs=await globalThis.indexedDB.databases();check(!dbs.some(x=>x.name==='asia2027-v84-dev'||x.name?.includes(':modules')),'Se creó base histórica sin cifrar');
  check(!JSON.stringify(await modules.read(A)).includes('ci-active-a'),'ID de sesión en claro');
  return {ok:true,checks:'V10.6 candidato sin parche de globals nativos; puente Gym y revisión real de sesiones cifradas; altura original; aislamiento A/B y bloqueo por sesión activa'};
 }finally{frame?.remove();bridge?.close();delete globalThis.__asiaCandidateFixture;portable.close();modules.close()}
}
