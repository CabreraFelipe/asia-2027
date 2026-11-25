import {openVaultRepository,openSessionVault} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
import {createLegacyBridge,createSaveCoordinator} from '../src/legacy-bridge.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
const policy=globalThis.asiaAccounts106;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function transient(){const m=new Map();return Object.freeze({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]??null,get length(){return m.size}})}
export async function run(){
 const A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32);
 let accountId=A;
 const readSession=async()=>({accountId,csrf:accountId});
 const repo=await openVaultRepository();
 const open=()=>openSessionVault({readSession,repository:repo,policy,passphrase:'frase sintética solo CI '+accountId});
 let frame,bridge;
 async function mount(vault){
  bridge=createLegacyBridge({vault,policy});
  globalThis.__asiaFixture={storage:bridge.storage,sessionStorage:transient(),indexedDB:policy.scopedFactory(globalThis.indexedDB,accountId)};
  frame=document.createElement('iframe');frame.style.width='390px';frame.style.height='844px';
  const loaded=new Promise(r=>frame.addEventListener('load',r,{once:true}));frame.src='/index.html';document.body.append(frame);await loaded;
  for(let i=0;i<80&&!frame.contentWindow.__asiaOriginalMounted;i++)await sleep(100);
  const w=frame.contentWindow,d=frame.contentDocument;
  check(w.__asiaOriginalMounted,'Preload no montado');
  check(d.title.includes('V10.6'),'No es HTML original');
  for(const id of ['tabHome','tabDiet','tabTrain','tabHealth','saveHeight','height'])check(d.getElementById(id),'Falta control '+id);
  check(w.localStorage===bridge.storage,'Storage nativo no aislado en fixture');
  return {w,d};
 }
 function unmount(){frame.remove();bridge.close();delete globalThis.__asiaFixture}
 const a=await open();let ui=await mount(a);
 const height=ui.d.getElementById('height');height.value='1.83';ui.d.getElementById('saveHeight').click();
 const key='asia2027-v1',saved=JSON.parse(a.storage.getItem(key)||'null');
 check(saved?.settings?.height===1.83,'Control original no guardó altura');
 ui.d.getElementById('tabDiet').click();check(!ui.d.getElementById('diet').classList.contains('hide'),'Navegación Dieta no funciona');
 ui.d.getElementById('tabTrain').click();check(!ui.d.getElementById('training').classList.contains('hide'),'Navegación Gym no funciona');
 const coordinator=createSaveCoordinator(a);await coordinator.close();unmount();
 check(!globalThis.localStorage.getItem(key),'Registro en Storage nativo');
 accountId=B;const b=await open();ui=await mount(b);
 check(b.storage.getItem(key)===null||JSON.parse(b.storage.getItem(key)).settings?.height!==1.83,'B recibió datos A');
 ui.d.getElementById('height').value='1.65';ui.d.getElementById('saveHeight').click();
 check(JSON.parse(b.storage.getItem(key)).settings.height===1.65,'Control B no guardó');await createSaveCoordinator(b).close();unmount();
 accountId=A;const again=await open();ui=await mount(again);
 check(JSON.parse(again.storage.getItem(key)).settings.height===1.83,'A no recuperó registro');
 check(ui.d.getElementById('height').value==='1.83','La UI no recuperó la altura');
 await createSaveCoordinator(again).close();unmount();repo.close();
 return {ok:true,checks:'HTML original V10.6, controles de altura y navegación Dieta/Gym, persistencia cifrada y dos cuentas aisladas en Chrome'};
}