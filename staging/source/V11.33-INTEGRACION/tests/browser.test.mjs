import {mountRecoveryPanel,mountMaintenancePanel} from '../src/recovery-panel.mjs';
import {openRecoverableDeviceSession,inspectPendingRecovery} from '../../V11.31-INTEGRACION/src/recovery.mjs';
import {openDeviceRepository,devicePolicy} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {openSessionVault} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<150;i++){if(fn())return;await sleep(100)}throw Error(label)}
function transient(){const m=new Map();return Object.freeze({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]??null,get length(){return m.size}})}
export async function run(){
 const policy=globalThis.asiaAccounts106,A='acct_'+'a'.repeat(32);
 let csrf='a1',panel,frame,maintenance;
 const readSession=async()=>({accountId:A,csrf}),repository=await openDeviceRepository(),passphrase='frase sintética V11.33 de bóveda',rp='frase sintética V11.33 recuperación',bp='frase sintética V11.33 respaldo';
 const options={readSession,repository,passphrase,policy};
 const open=()=>openSessionVault({...options,policy:devicePolicy(policy)});
 const copies=[],download=(e,o)=>copies.push({e,name:o.filename});
 const key='asia2027-v1',theme='asia-theme-v4';
 try{
  const session=await openRecoverableDeviceSession({...options,onStatus:()=>panel?.render()});
  globalThis.__asiaCandidateFixture={readSession,passphrase,storage:session.storage,sessionStorage:transient()};
  frame=document.createElement('iframe');frame.style.width='390px';frame.style.height='844px';const loaded=new Promise(r=>frame.addEventListener('load',r,{once:true}));
  frame.src='/staging/source/V11.29-INTEGRACION/tests/candidate/index.html';document.body.append(frame);await loaded;
  const w=frame.contentWindow,d=frame.contentDocument,el=id=>d.getElementById(id);
  await until(()=>w.asiaGym84Ready===true,'Gym no disponible');
  panel=mountRecoveryPanel({doc:d,session,download});
  el('height').value='1.83';el('saveHeight').click();
  await until(()=>session.status.phase==='saved','Guardado no confirmado');
  check(el('saveStatus1133').textContent==='Guardado confirmado','Estado UI incorrecto');
  const winner=await open();winner.storage.setItem(theme,'dark:forest');await winner.flush();winner.close();
  // Actual original theme control writes into stale session.
  w.asiaTheme8812.set('ocean',true);
  await until(()=>session.status.phase==='error','Conflicto no detectado');
  check(el('saveStatus1133').textContent.includes('no confirmado')&&!el('preparePending1133').disabled,'UI no muestra error');
  el('recoveryPhrase1133').value=rp;el('preparePending1133').click();
  await until(()=>!el('downloadPending1133').disabled,'No preparó copia');
  check(el('recoveryPhrase1133').value==='','Frase visible después de cifrar');
  el('downloadPending1133').click();
  check(copies.length===1&&copies[0].name==='asia-recuperacion-pendiente.json','Descarga no solicitada');
  const snapshot=await inspectPendingRecovery({readSession,policy,envelope:copies[0].e,recoveryPhrase:rp});
  check(new Map(snapshot.entries).get(theme)==='light:ocean','Copia no conserva tema');
  check(el('recoveryStatus1133').textContent.includes('Verificá'),'Descarga presentada como guardado confirmado');
  panel.dispose();panel=null;frame.remove();frame=null;delete globalThis.__asiaCandidateFixture;
  csrf='a2'; // separate new authenticated maintenance session, original UI unmounted.
  maintenance=mountMaintenancePanel({doc:document,anchor:document.getElementById('maintenance'),options,download});
  const m=id=>document.getElementById(id);
  const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(copies[0].e)],'recuperacion.json',{type:'application/json'}));m('recoveryFile1133').files=dt.files;
  m('restorePhrase1133').value=rp;m('backupPhrase1133').value=bp;m('compare1133').click();
  await until(()=>!m('backupDownload1133').disabled,'No comparó copia');
  const choice=[...m('restoreRows1133').querySelectorAll('input')].find(i=>i.value===theme);
  check(choice&&!choice.disabled,'Tema no seleccionable');choice.click();
  check(m('apply1133').disabled,'Restauración sin respaldo');
  m('backupDownload1133').click();check(copies.length===2&&m('apply1133').disabled,'Falta confirmación');
  m('backupConfirmed1133').click();check(!m('apply1133').disabled,'Confirmación no habilitó');
  m('apply1133').click();await until(()=>m('restoreStatus1133').textContent.includes('Restauración confirmada'),'No confirmó restauración');
  const final=await open();check(final.storage.getItem(theme)==='light:ocean','Tema no restaurado');check(JSON.parse(final.storage.getItem(key)).settings.height===1.83,'Diario alterado');final.close();
  check(m('restorePhrase1133').value===''&&m('backupPhrase1133').value==='','Frases retenidas');
  maintenance.dispose();maintenance=null;
  return {ok:true,checks:'Controles originales V10.6 altura/tema, estado de guardado y conflicto, copia cifrada solicitada, mantenimiento separado, selección y respaldo confirmados, diario intacto'};
 }finally{panel?.dispose();maintenance?.dispose();frame?.remove();delete globalThis.__asiaCandidateFixture;repository.close()}
}
