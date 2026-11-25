import {newRecoveryCode,keyFromRecoveryCode} from '/v11.13/crypto.js';
import {verifyArchive,restoreArchive,MAX_ARCHIVE_BYTES} from '/v11.16/archive116.js';
import {verifyBundle,exportBundle,restoreBundle,MAX_BUNDLE_BYTES} from '/v11.17/bundle117.js';
import {createRecoveryKit,openRecoveryKit,MAX_KIT_BYTES} from '/v11.18/kit118.js';
import {encryptDemo,decryptDemo} from '/v11.13/crypto.js';
import {encryptJournal,decryptJournal,sealDraft,openDraft} from '/v11.15/crypto115.js';
import {validJournal,blankJournal,addEntry,mergeJournal,journalContains,summary} from '/v11.15/journal115.js';
const origin='/v11.11',journalApi='/v11.15/data/journal',root=document.querySelector('#app');
const S={account:null,csrf:null,key:null,head:0,versions:[],data:null,pending:null,showCode:null,tab:'inicio',notice:'',failed:false,sessionExpired:false,importCandidate:null,bundleCandidate:null,kitRescueCode:null,prefs:{density:'normal',palette:'asia'},historyFilter:'todos'};
const el=(parent,tag,content,cls)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;if(cls)e.className=cls;parent.append(e);return e;};
const card=(name)=>{const c=el(root,'section',undefined,'card');el(c,'h2',name);return c;};
const desc=(parent,t)=>el(parent,'p',t,'muted114');
const fail=msg=>{throw Error(msg);};
const label=(parent,text,control,id)=>{const field=el(parent,'div',undefined,'field115'),l=el(field,'label',text);l.htmlFor=id;control.id=id;field.append(control);return control;};
const choice=(parent,id,title,options)=>{const s=document.createElement('select');for(const [value,text] of options){const o=el(s,'option',text);o.value=value;}return label(parent,title,s,id);};
const number=(parent,id,title,values)=>choice(parent,id,title,values.map(n=>[String(n),String(n)]));
function action(parent,text,handler,secondary=false){const b=el(parent,'button',text,secondary?'secondary':'');b.type='button';b.addEventListener('click',async()=>{b.disabled=true;S.notice='';S.failed=false;try{await handler();}catch(e){S.notice=e?.message||'ERROR';S.failed=true;}finally{render();}});return b;}
const openDB=(name,store)=>new Promise((resolve,reject)=>{const q=indexedDB.open(name,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(store))q.result.createObjectStore(store);};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(Error('INDEXEDDB_NO_DISPONIBLE'));});
async function store(name,collection,mode,fn){const db=await openDB(name,collection);try{return await new Promise((resolve,reject)=>{const tx=db.transaction(collection,mode),req=fn(tx.objectStore(collection));let value=null;req.onsuccess=()=>{value=req.result??null;};tx.oncomplete=()=>resolve(value);tx.onabort=tx.onerror=()=>reject(Error('ALMACENAMIENTO_LOCAL_NO_DISPONIBLE'));});}finally{db.close();}}
const getKey=id=>store('asia-v1112-demo-keys','account_keys','readonly',s=>s.get(id));
const putKey=(id,key)=>store('asia-v1112-demo-keys','account_keys','readwrite',s=>s.put(key,id));
const getDraft=id=>store('asia-v1115-domain-pending','drafts','readonly',s=>s.get(id));
const putDraft=(id,x)=>store('asia-v1115-domain-pending','drafts','readwrite',s=>s.put(x,id));
const dropDraft=id=>store('asia-v1115-domain-pending','drafts','readwrite',s=>s.delete(id));
// Visual preferences only: per-account, local to this browser, no private content in this store.
const defaultPrefs=()=>({density:'normal',palette:'asia'});
const safePrefs=p=>({density:p?.density==='compacto'?'compacto':'normal',palette:['asia','oceano','grafito'].includes(p?.palette)?p.palette:'asia'});
const getVisualPrefs=id=>store('asia-v1124-visual','settings','readonly',s=>s.get(id));
const saveVisualPrefs=(id,value)=>store('asia-v1124-visual','settings','readwrite',s=>s.put(value,id));
async function api(path,opts={}){
 let r;try{r=await fetch(path,{credentials:'same-origin',cache:'no-store',redirect:'manual',...opts});}catch{fail('RED_NO_DISPONIBLE');}
 let data;try{data=await r.json();}catch{fail('RESPUESTA_INVALIDA');}
 if(r.status===401){S.sessionExpired=true;fail('SESION_EXPIRADA_INICIA_GOOGLE');}
 return {...data,status:r.status};
}
async function head(){
 const info=await api(journalApi);if(!info.ok||!Array.isArray(info.versions)||!Number.isInteger(info.head)||info.head<0||info.head>30||info.versions[0]?.revision!==info.head&&info.head!==0)fail('INDICE_NO_DISPONIBLE');
 let data=blankJournal(S.account);
 if(info.head&&S.key){const latest=await api(journalApi+'/'+info.head);if(!latest.ok)fail('DESCARGA_NO_DISPONIBLE');data=await decryptJournal(latest.envelope,S.key,S.account);}
 else if(info.head)data=null;
 return {head:info.head,versions:info.versions,data};
}
async function refresh(){if(S.pending)fail('RESOLVE_EL_BORRADOR_PRIMERO');const next=await head();Object.assign(S,next);}
async function loadPending(){
 if(!S.account||!S.key)return;
 const item=await getDraft(S.account);if(!item){S.pending=null;return;}
 if(!item||Object.keys(item).sort().join(',')!=='baseRevision,mode,sealed'||item.mode!=='append'||!Number.isInteger(item.baseRevision)||item.baseRevision<0||item.baseRevision>30)fail('BORRADOR_LOCAL_INVALIDO');
 const {base,proposed}=await openDraft(item.sealed,S.key,S.account);
 S.pending={baseRevision:item.baseRevision,mode:'append',base,proposed};
}
async function init(){try{
 const who=await api(origin+'/auth/me');if(!who.ok)fail('INICIA_SESION_CON_GOOGLE');
 S.account=who.accountId;S.csrf=who.csrf;S.key=await getKey(S.account);S.prefs=safePrefs(await getVisualPrefs(S.account).catch(()=>null));await refresh();await loadPending();
 }catch(e){S.failed=true;S.notice=e.message;}render();}
async function createKey(){
 if(S.head!==0)fail('EXISTEN_COPIAS_IMPORTA_EL_CODIGO');
 // Reuse the key family used by V11.14. Never create a conflicting local key if older snapshots exist.
 const old=await api(origin+'/data/snapshots');if(!old.ok||old.head!==0)fail('YA_EXISTEN_COPIAS_V11_14_IMPORTA_SU_CODIGO_PRIMERO');
 const code=newRecoveryCode(),key=await keyFromRecoveryCode(code);
 await putKey(S.account,key);S.key=key;S.showCode=code;S.data=blankJournal(S.account);await loadPending();
}
async function importKey(code){
 const key=await keyFromRecoveryCode(code.trim());
 if(S.head){const response=await api(journalApi+'/'+S.head);if(!response.ok)fail('DESCARGA_NO_DISPONIBLE');S.data=await decryptJournal(response.envelope,key,S.account);}
 // When journal is empty but V11.14 has encrypted data, verify the code against that first.
 if(!S.head){const old=await api(origin+'/data/snapshots');if(!old.ok)fail('ALMACENAMIENTO_ANTERIOR_NO_DISPONIBLE');if(old.head){const copy=await api(origin+'/data/snapshots/'+old.head);if(!copy.ok)fail('COPIA_ANTERIOR_NO_DISPONIBLE');const {decryptDemo}=await import('/v11.13/crypto.js');await decryptDemo(copy.envelope,key,S.account);}}
 await putKey(S.account,key);S.key=key;S.showCode=null;await loadPending();
}
async function prepare(proposed){
 if(!S.key||!validJournal(S.data,S.account)||!validJournal(proposed,S.account)||S.pending)fail('DIARIO_NO_DISPONIBLE');
 const base=S.data,baseRevision=S.head,sealed=await sealDraft(base,proposed,S.key,S.account);
 await putDraft(S.account,{baseRevision,mode:'append',sealed});S.pending={base,proposed,baseRevision,mode:'append'};
}
async function commit(){
 if(!S.pending||!S.key)fail('SIN_BORRADOR');
 const item=S.pending,envelope=await encryptJournal(item.proposed,S.key,S.account);
 const r=await api(journalApi,{method:'POST',headers:{'Content-Type':'application/json','X-Asia-CSRF':S.csrf},body:JSON.stringify({expectedRevision:item.baseRevision,envelope})});
 if(r.status===409){S.notice='Conflicto de versión: se conservó un borrador cifrado local.';S.failed=true;return;}
 if(!r.ok)fail('GUARDADO_FALLIDO_'+r.status);
 await dropDraft(S.account);S.pending=null;S.head=r.revision;S.data=item.proposed;await refresh();S.notice='Guardado cifrado correcto (revisión '+r.revision+').';S.failed=false;
}
async function saveRecord(fields){
 if(!S.key||!S.data||S.pending)fail('DIARIO_NO_DISPONIBLE');
 if(S.head>=30)fail('LIMITE_DE_REVISIONES');
 await prepare(addEntry(S.data,fields));await commit();
}
async function resolvePending(){
 const pending=S.pending;if(!pending||!S.key)fail('SIN_BORRADOR');
 const latest=await head();if(!latest.data)fail('CLAVE_NECESARIA');
 if(journalContains(latest.data,pending.proposed)){
  await dropDraft(S.account);S.pending=null;Object.assign(S,latest);S.notice='La operación ya estaba guardada, sin duplicaciones.';return;
 }
 const merge=mergeJournal(pending.base,pending.proposed,latest.data);
 if(merge.status==='YA_GUARDADO'){await dropDraft(S.account);S.pending=null;Object.assign(S,latest);S.notice='Sin cambios pendientes.';return;}
 if(merge.status!=='LISTO')fail('NO_SE_PUEDE_FUSIONAR_'+merge.status);
 if(latest.head>=30)fail('LIMITE_DE_REVISIONES');
 const sealed=await sealDraft(latest.data,merge.payload,S.key,S.account);
 await putDraft(S.account,{baseRevision:latest.head,mode:'append',sealed});
 S.pending={baseRevision:latest.head,mode:'append',base:latest.data,proposed:merge.payload};
 await commit();
}
async function discardPending(){
 if(!S.pending||!confirm('¿Descartar el borrador local de prueba? No se borrarán copias de Cloudflare.'))return;
 await dropDraft(S.account);S.pending=null;await refresh();S.notice='Borrador local descartado.';
}
async function downloadEncrypted(){
 if(!S.key||!S.head||S.pending)fail('RESPALDO_NO_DISPONIBLE');
 const idx=await api(journalApi);if(!idx.ok||idx.head!==S.head)fail('REVISION_CAMBIO_PRIMERO_ACTUALIZA');
 const history=[];
 for(let rev=1;rev<=S.head;rev++){
  const r=await api(journalApi+'/'+rev);if(!r.ok||r.revision!==rev)fail('HISTORIAL_INCOMPLETO');
  await decryptJournal(r.envelope,S.key,S.account);history.push({revision:rev,envelope:r.envelope});
 }
 const file=JSON.stringify({format:'asia-v1115-domain-archive-v1',accountId:S.account,head:S.head,history},null,2);
 const blob=new Blob([file],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='asia-v11.16-diario-ficticio-cifrado.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 S.notice='Respaldo cifrado descargado; NO contiene el código de recuperación.';
}
async function importArchiveFile(file){
 if(!S.key||!S.account||S.pending)fail('PRIMERO_CONFIGURA_LA_CLAVE_Y_RESOLVE_BORRADORES');
 if(!file||file.size>MAX_ARCHIVE_BYTES||file.size===0)fail('ARCHIVO_INVALIDO_O_DEMASIADO_GRANDE');
 S.importCandidate=null;
 const text=await file.text();
 const verified=await verifyArchive(text,S.key,S.account);
 S.importCandidate=verified;
 S.notice='Archivo validado: '+verified.head+' revisiones cifradas de esta cuenta. No se modificó la nube.';
}
async function restoreImported(){
 const archive=S.importCandidate;
 if(!archive||!S.key||!S.account||archive.accountId!==S.account||S.pending)fail('IMPORTACION_NO_DISPONIBLE');
 if(!confirm('¿Recuperar SOLO las revisiones que falten en Cloudflare STAGING? Se interrumpe si existe una revisión diferente. No se borrará nada.'))return;
 const result=await restoreArchive(archive,{
  index:()=>api(journalApi),
  read:revision=>api(journalApi+'/'+revision),
  post:(expectedRevision,envelope)=>api(journalApi,{method:'POST',headers:{'Content-Type':'application/json','X-Asia-CSRF':S.csrf},body:JSON.stringify({expectedRevision,envelope})})
 });
 await refresh();
 S.importCandidate=null;
 S.failed=false;
 S.notice=result.status==='YA_RESTAURADO'?'El historial ya estaba íntegro; no se escribió nada.':result.status==='NUBE_MAS_RECIENTE'?'La nube contiene revisiones posteriores; no se escribió nada.':'Recuperación verificada: '+result.written+' revisiones faltantes recuperadas en staging.';
}

const stagingCollections=()=>({
 snapshots:{index:()=>api(origin+'/data/snapshots'),read:revision=>api(origin+'/data/snapshots/'+revision),post:(expectedRevision,envelope)=>api(origin+'/data/snapshots',{method:'POST',headers:{'Content-Type':'application/json','X-Asia-CSRF':S.csrf},body:JSON.stringify({expectedRevision,envelope})})},
 journal:{index:()=>api(journalApi),read:revision=>api(journalApi+'/'+revision),post:(expectedRevision,envelope)=>api(journalApi,{method:'POST',headers:{'Content-Type':'application/json','X-Asia-CSRF':S.csrf},body:JSON.stringify({expectedRevision,envelope})})}
});
async function checkNoDrafts(){
 if(S.pending||await store('asia-v1113-encrypted-pending','drafts','readonly',s=>s.get(S.account)))fail('HAY_BORRADORES_PENDIENTES_EN_OTRA_VERSION');
}
async function downloadFullBundle(){
 if(!S.key||!S.account)fail('CLAVE_O_CUENTA_NO_DISPONIBLE');
 await checkNoDrafts();
 const raw=await exportBundle(S.key,S.account,stagingCollections());
 const blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='asia-v11.17-copia-integral-sintetica-cifrada.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 S.notice='Copia integral CIFRADA descargada: diario y respaldos antiguos ficticios. El código de recuperación no está incluido.';
}
async function importFullBundle(file){
 if(!S.key||!S.account)fail('CLAVE_O_CUENTA_NO_DISPONIBLE');
 await checkNoDrafts();
 S.bundleCandidate=null;
 if(!file||!file.size||file.size>MAX_BUNDLE_BYTES)fail('TAMANO_DE_ARCHIVO_INVALIDO');
 const candidate=await verifyBundle(await file.text(),S.key,S.account);
 S.bundleCandidate=candidate;
 S.notice='Copia integral verificada en este navegador. TODAVÍA no se escribió ningún dato.';
}
async function restoreFullBundle(){
 if(!S.bundleCandidate||S.bundleCandidate.accountId!==S.account||!S.key)fail('COPIA_INTEGRAL_NO_VALIDADA');
 await checkNoDrafts();
 if(!confirm('¿Recuperar SOLO las revisiones faltantes de AMBAS colecciones FICTICIAS en esta misma cuenta? Se bloqueará ante divergencias; no se borrarán revisiones.'))return;
 const result=await restoreBundle(S.bundleCandidate,stagingCollections());
 await refresh();S.bundleCandidate=null;S.importCandidate=null;
 S.notice='Recuperación integral verificada: '+result.written+' revisiones nuevas. Snapshots: '+result.snapshots.status+'; diario: '+result.journal.status+'.';
}

// V11.18: two-factor offline rescue: original recovery code + independent encrypted rescue file.
// Neither original nor rescue code is written to IndexedDB or Cloudflare.
async function verifyExistingKey(key){
 if(!key||!S.account)fail('CLAVE_O_CUENTA_NO_DISPONIBLE');
 const current=await api(journalApi);
 const legacy=await api(origin+'/data/snapshots');
 if(!current.ok||!legacy.ok||!Number.isInteger(current.head)||!Number.isInteger(legacy.head))fail('HISTORIAL_NO_DISPONIBLE');
 if(current.head){const row=await api(journalApi+'/'+current.head);if(!row.ok)fail('DIARIO_NO_DISPONIBLE');await decryptJournal(row.envelope,key,S.account);}
 if(legacy.head){const row=await api(origin+'/data/snapshots/'+legacy.head);if(!row.ok)fail('COPIA_NO_DISPONIBLE');await decryptDemo(row.envelope,key,S.account);}
}
async function createKitWithCode(code){
 if(!S.key||!S.account)fail('PRIMERO_IMPORTA_LA_CLAVE_ORIGINAL');
 S.kitRescueCode=null;
 const candidate=await keyFromRecoveryCode(code);
 // Fresh challenge compares this candidate with the non-extractable local key, even on empty accounts.
 const challenge=await encryptJournal(blankJournal(S.account),S.key,S.account);
 await decryptJournal(challenge,candidate,S.account);
 await verifyExistingKey(candidate);
 const prepared=await createRecoveryKit(code,S.account);
 const blob=new Blob([prepared.json],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='asia-v11.18-kit-rescate-cifrado-STAGING.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 S.kitRescueCode=prepared.rescueCode;
 S.notice='Kit cifrado preparado para descargar. Guardá el código de rescate en otro lugar; no se guarda en Cloudflare.';
}
async function recoverKit(file,rescueCode){
 if(!S.account)fail('INICIA_GOOGLE_PRIMERO');
 if(!file||file.size===0||file.size>MAX_KIT_BYTES)fail('KIT_INVALIDO');
 const key=await openRecoveryKit(await file.text(),rescueCode,S.account);
 await verifyExistingKey(key);
 // Do not overwrite an already functioning local key or bypass pending drafts.
 if(S.key){const challenge=await encryptJournal(blankJournal(S.account),S.key,S.account);await decryptJournal(challenge,key,S.account);}
 await putKey(S.account,key);S.key=key;S.showCode=null;S.kitRescueCode=null;
 const next=await head();Object.assign(S,next);await loadPending();
 S.notice='Clave recuperada con el kit en este dispositivo. Historial remoto verificado y sin cambios.';
}
async function logout(){
 const r=await api(origin+'/auth/logout',{method:'POST',headers:{'X-Asia-CSRF':S.csrf}});if(!r.ok)fail('CIERRE_NO_DISPONIBLE');
 Object.assign(S,{account:null,csrf:null,key:null,head:0,versions:[],data:null,pending:null,showCode:null,sessionExpired:false,importCandidate:null,bundleCandidate:null,kitRescueCode:null,prefs:defaultPrefs(),historyFilter:'todos'});S.notice='Sesión cerrada.';
}
function form(parent,type){
 const f=el(parent,'form',undefined,'form115'),fields=el(f,'div',undefined,'formgrid115');
 const dates=Array.from({length:31},(_,i)=>[String(i+1).padStart(2,'0'),`Enero ${i+1}, 2026 (ficticio)`]);
 const day=choice(fields,'date115','Fecha de ejemplo',dates);
 let controls;
 if(type==='diet'){
  const adherence=choice(fields,'ad115','Cumplimiento (como V10.6)',[['yes','Cumplido'],['part','Parcial'],['no','No cumplido'],['flex','Flexible']]);
  const steps=number(fields,'steps115','Pasos de ejemplo',[0,3000,5000,7500,10000,12500]);
  const energy=number(fields,'energy115','Energía (1–5)',[1,2,3,4,5]);
  controls=()=>({kind:'diet',date:'2026-01-'+day.value,ad:adherence.value,steps:Number(steps.value),energy:Number(energy.value)});
 }else{
  const routine=choice(fields,'routine115','Rutina',[['A','Rutina A'],['B','Rutina B'],['C','Rutina C']]);
  const minutes=number(fields,'minutes115','Cardio · minutos',[0,10,15,20,30,45]);
  const speed=number(fields,'speed115','Cardio · km/h',[0,4,5,6,8,10]);
  const incline=number(fields,'incline115','Inclinación %',[0,2,5,8,10]);
  const rpe=number(fields,'rpe115','Esfuerzo / 10',[3,4,5,6,7,8]);
  controls=()=>({kind:'workout',date:'2026-01-'+day.value,routine:routine.value,cardioMin:Number(minutes.value),cardioSpeed:Number(speed.value),cardioIncline:Number(incline.value),cardioRPE:Number(rpe.value)});
 }
 const submit=el(f,'button','Guardar ejemplo cifrado');submit.type='submit';
 f.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;S.notice='';S.failed=false;try{await saveRecord(controls());}catch(err){S.notice=err.message;S.failed=true;}finally{render();}});
}
// V11.19–V11.24: presentation over the existing verified synthetic journal only.
const TAB_TITLES=Object.freeze({inicio:'Tu día',nutricion:'Dieta',entrenamiento:'Gym',salud:'Salud',progreso:'Progreso',cuenta:'Cuenta'});
function workIntro(){
 const c=el(root,'section',undefined,'workspace-intro121');
 const a=el(c,'div',undefined,'workspace-title121');
 el(a,'span',S.tab==='cuenta'?'SEGURIDAD DE TU CUENTA':'ASIA 2027 · ENTORNO PRIVADO','eyebrow121');
 el(a,'h2',TAB_TITLES[S.tab]||'Tu día');
 el(a,'p',S.tab==='cuenta'?'Cuenta de staging y respaldos cifrados.':
  S.tab==='salud'?'Interfaz preparada · sin datos de Salud conectados.':
  S.tab==='progreso'?'Indicadores calculados exclusivamente sobre ejemplos guardados.':
  'Estructura de V10.6 · contenido ficticio de pruebas.','introdesc121');
 const status=el(c,'div',undefined,'sync-status121');
 el(status,'span',S.key?'Clave disponible':'Clave pendiente','sync-dot121'+(S.key?' ready':''));
 el(status,'span',S.head+' / 30 revisiones','sync-count121');
}
function headline(parent,title,detail){
 const h=el(parent,'div',undefined,'blockhead121');el(h,'h3',title);if(detail)el(h,'p',detail,'muted114');return h;
}
function shortcut(parent,title,sub,tab){
 const b=el(parent,'button',undefined,'shortcut121');b.type='button';
 el(b,'span',title,'shortcut-title121');el(b,'small',sub,'shortcut-sub121');
 b.addEventListener('click',()=>{S.tab=tab;S.notice='';S.failed=false;render();window.scrollTo(0,0);});return b;
}
function safeJournalRows(){return S.data&&validJournal(S.data,S.account)?S.data.entries:[];}
function metricPanel(parent,labelText,value,unit){const c=el(parent,'div',undefined,'metric121');el(c,'small',labelText);el(c,'strong',String(value));if(unit)el(c,'span',unit,'metric-unit121');return c;}
function demoCoachText(){
 const rows=safeJournalRows();const diet=rows.filter(x=>x.kind==='diet'),work=rows.filter(x=>x.kind==='workout');
 if(!S.key)return 'Primero activá tu clave en Cuenta para ver el resumen local de los ejemplos.';
 if(!S.data)return 'El diario está cifrado; primero recuperá la clave correcta.';
 if(!rows.length)return 'Todavía no hay ejemplos. Probá guardar un registro ficticio en Dieta o Gym para visualizar la orientación local.';
 if(diet.length&&work.length)return `En los ejemplos hay ${diet.length} días de Dieta y ${work.length} sesiones de Gym. Revisá el historial antes de completar nuevas fechas.`;
 return diet.length?`Hay ${diet.length} días ficticios de Dieta registrados. La pestaña Gym todavía no tiene ejemplos.`:`Hay ${work.length} sesiones ficticias de Gym registradas. La pestaña Dieta todavía no tiene ejemplos.`;
}
// Aggregate ONLY the already decrypted synthetic diary. Never derive actual health advice.
function weeklySynthetic(rows){
 const weeks=Array.from({length:5},(_,i)=>({name:'Semana '+(i+1),diet:0,gym:0,minutes:0,steps:0}));
 for(const row of rows){const day=Number(row.date.slice(-2)),index=Math.min(4,Math.floor((day-1)/7)),w=weeks[index];
  if(row.kind==='diet'){w.diet++;w.steps+=row.steps;}else if(row.kind==='workout'){w.gym++;w.minutes+=row.cardioMin;}}
 return weeks;
}
function weeklyBars(parent,rows){
 const weeks=weeklySynthetic(rows),total=weeks.reduce((s,w)=>s+w.diet+w.gym,0),max=Math.max(1,...weeks.map(w=>w.diet+w.gym));
 const panel=el(parent,'div',undefined,'weeks124');
 for(const w of weeks){const item=el(panel,'div',undefined,'week124');
  const top=el(item,'div',undefined,'week-label124');el(top,'span',w.name);el(top,'strong',(w.diet+w.gym)+' registros');
  const rail=el(item,'div',undefined,'week-rail124');rail.setAttribute('role','meter');rail.setAttribute('aria-label',w.name+' de ejemplo');rail.setAttribute('aria-valuemin','0');rail.setAttribute('aria-valuemax',String(max));rail.setAttribute('aria-valuenow',String(w.diet+w.gym));
  const bar=el(rail,'span',undefined,'week-fill124');bar.style.width=(100*(w.diet+w.gym)/max).toFixed(1)+'%';
  el(item,'small',w.diet+' Dieta · '+w.gym+' Gym · '+w.minutes+' min cardio de prueba');
 }
 if(!total)desc(parent,'El gráfico se completará al guardar ejemplos cifrados en Dieta y Gym.');
}
function activityRibbon(parent,rows){
 const recent=rows.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
 const section=el(parent,'div',undefined,'recent124');
 if(!recent.length){desc(parent,'Aún no hay eventos ficticios registrados.');return;}
 for(const record of recent){const line=el(section,'div',undefined,'recent-item124');
  el(line,'span',record.date.slice(-2)+' ENE','recent-date124');
  const text=record.kind==='diet'?record.steps.toLocaleString('es-UY')+' pasos · energía '+record.energy+'/5':'Rutina '+record.routine+' · '+record.cardioMin+' min de cardio';
  el(line,'span',(record.kind==='diet'?'Dieta · ':'Gym · ')+text);}
}
function preferencesPreview(){
 const c=card('Personalizar esta vista');desc(c,'Preferencias visuales guardadas solo en este navegador y asociadas a esta cuenta de pruebas. No modifican D1, historial ni datos de producción.');
 const f=el(c,'div',undefined,'prefs124');
 const p=choice(f,'palette124','Acento visual',[['asia','Asia · azul y dorado'],['oceano','Océano · azul'],['grafito','Grafito · lavanda']]);p.value=S.prefs.palette;
 const d=choice(f,'density124','Espaciado',[['normal','Cómodo'],['compacto','Compacto']]);d.value=S.prefs.density;
 for(const ctrl of [p,d])ctrl.addEventListener('change',async()=>{const next=safePrefs({palette:p.value,density:d.value});
  ctrl.disabled=true;try{await saveVisualPrefs(S.account,next);S.prefs=next;S.notice='Preferencia visual guardada localmente.';S.failed=false;}
  catch(e){S.notice='No se pudo guardar la preferencia local.';S.failed=true;}render();});
}
function overviewExtras(){
 const rows=safeJournalRows();const diet=rows.filter(x=>x.kind==='diet'),work=rows.filter(x=>x.kind==='workout');
 const quick=card('Accesos rápidos');const shortcuts=el(quick,'div',undefined,'shortcuts121');
 shortcut(shortcuts,'Registrar Dieta','Enero 2026 · ejemplo', 'nutricion');
 shortcut(shortcuts,'Entreno ficticio','Rutinas A, B o C','entrenamiento');
 shortcut(shortcuts,'Ver progreso','Actividad de prueba','progreso');
 shortcut(shortcuts,'Cuenta y backups','Clave y restauración','cuenta');
 const day=card('Actividad de prueba');
 const box=el(day,'div',undefined,'insight-grid121');
 const d=el(box,'div',undefined,'insight121');headline(d,'Dieta',diet.length?`${diet.length} registros ficticios.`:'Sin datos de ejemplo.');
 const latestD=diet.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];if(latestD)el(d,'p',`${latestD.date}: ${latestD.steps.toLocaleString('es-UY')} pasos de ejemplo · energía ${latestD.energy}/5.`);
 const g=el(box,'div',undefined,'insight121');headline(g,'Gym',work.length?`${work.length} sesiones ficticias.`:'Todavía sin sesiones.');
 const latestG=work.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];if(latestG)el(g,'p',`${latestG.date}: Rutina ${latestG.routine}, ${latestG.cardioMin} min de cardio.`);
 const coach=card('Resumen inteligente local · sin IA');
 const header=el(coach,'div',undefined,'coachtag121');el(header,'span','SIN CONSULTAS A IA');
 desc(coach,demoCoachText());
 const go=el(coach,'div',undefined,'cta114');shortcut(go,'Ver registros','Inspeccionar datos ficticios','progreso');
 const month=card('Un vistazo a enero · registros de prueba');
 weeklyBars(month,rows);
 const recent=card('Movimientos recientes · datos de ejemplo');activityRibbon(recent,rows);
 const goals=card('Mis metas · estructura en preparación');
 desc(goals,'En V10.6 tenés metas reales y un historial personal. Aquí no se copian ni se muestran: la migración de objetivos y motivos individuales todavía está pendiente.');
 const chips=el(goals,'div',undefined,'chips121');el(chips,'span','Fechas independientes · pendiente');el(chips,'span','Motivación de cada meta · pendiente');
}
function healthPreview(){
 const c=card('Salud · integración no habilitada');
 desc(c,'Se conserva la pestaña Salud de V10.6 para recuperar su navegación. Esta versión NO conecta Apple Health, Xiaomi ni registros médicos.');
 const grid=el(c,'div',undefined,'grid health-grid121');
 metricPanel(grid,'Pasos reales','—','No conectados');
 metricPanel(grid,'Último peso','—','No importado');
 metricPanel(grid,'Frecuencia cardíaca','—','No conectada');
 metricPanel(grid,'Recuperación','—','Sin registros de Salud');
 const r=card('Privacidad antes que integración');
 desc(r,'Los formularios de Dieta y Gym solo aceptan valores predefinidos de enero de 2026. No se transfieren ni se analizan mediciones personales.');
 const btns=el(r,'div',undefined,'shortcuts121');shortcut(btns,'Ver Cuenta','Google y claves cifradas','cuenta');shortcut(btns,'Volver a Inicio','Resumen del laboratorio','inicio');
}
function progressPreview(){
 const rows=safeJournalRows(),diet=rows.filter(x=>x.kind==='diet'),work=rows.filter(x=>x.kind==='workout');
 const sum=S.data?summary(S.data):null;
 const overview=card('Mi evolución · ejemplos cifrados');
 desc(overview,'La vista de progreso utiliza exclusivamente los registros sintéticos de enero de 2026. No calcula evolución corporal real.');
 const metrics=el(overview,'div',undefined,'grid');
 metricPanel(metrics,'Días de Dieta',sum?.dietDays??'—','Enero 2026');
 metricPanel(metrics,'Sesiones Gym',sum?.trainingDays??'—','Enero 2026');
 metricPanel(metrics,'Pasos acumulados',sum?.stepsTotal.toLocaleString('es-UY')??'—','Solo ejemplos');
 metricPanel(metrics,'Cardio total',sum?.cardioMinutes??'—','Minutos de prueba');
 const timeline=card('Actividad de enero · vista de calendario');
 if(!S.data){desc(timeline,'Configurá o recuperá la clave en Cuenta para visualizar el calendario.');return;}
 const days=el(timeline,'div',undefined,'days121');
 for(let day=1;day<=31;day++){
  const stamp='2026-01-'+String(day).padStart(2,'0');const d=rows.some(x=>x.kind==='diet'&&x.date===stamp),g=rows.some(x=>x.kind==='workout'&&x.date===stamp);
  const cell=el(days,'div',undefined,'day121'+(d||g?' recorded':''));
  el(cell,'b',day);if(d)el(cell,'span','D');if(g)el(cell,'span','G');
  cell.title=stamp+' · '+(d?'Dieta':'')+(d&&g?' + ':'')+(g?'Gym':'')+(!d&&!g?'Sin registro':'');
 }
 desc(timeline,'D = Dieta · G = Gym. El calendario no representa la actividad del mes actual.');
 const graph=card('Actividad semanal · enero ficticio');
 desc(graph,'Cada barra representa registros inventados de Dieta y Gym, no el progreso de tu salud.');weeklyBars(graph,rows);
 const trends=card('Lectura de los ejemplos');const insight=el(trends,'div',undefined,'insight-grid121');
 const a=el(insight,'div',undefined,'insight121');headline(a,'Dieta',diet.length?'Datos de cumplimiento ficticio':'Sin ejemplos');
 if(diet.length){const n=diet.filter(x=>x.ad==='yes').length;el(a,'p',`${n} de ${diet.length} registros marcados como cumplidos.`);}
 const b=el(insight,'div',undefined,'insight121');headline(b,'Gym',work.length?'Carga de cardio ficticia':'Sin ejemplos');
 if(work.length){const m=Math.round(work.reduce((x,y)=>x+y.cardioRPE,0)/work.length*10)/10;el(b,'p',`Esfuerzo promedio: ${m}/10 (solo datos de prueba).`);}
}

function render(){
 root.replaceChildren();document.documentElement.dataset.palette124=S.prefs.palette;
 document.documentElement.dataset.density124=S.prefs.density;
 for(const b of document.querySelectorAll('[data-tab]')){b.classList.toggle('active',b.dataset.tab===S.tab);if(b.dataset.tab===S.tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
 if(S.notice){const div=el(root,'div',S.notice,'status114'+(S.failed?' error':''));div.setAttribute('role','status');}
 if(!S.account||S.sessionExpired){const c=card('Iniciar sesión con Google');desc(c,'Acceso real de staging, sin contraseña propia. La prueba usa únicamente datos inventados.');const a=el(c,'a','Iniciar sesión con Google','btnlink114');a.href='/v11.24/auth/start';return;}
 workIntro();
 if(S.tab==='inicio'){
  const c=card('Tu día · centro de control');desc(c,'Resumen exclusivo del diario ficticio cifrado. No representa tus valores, tus metas ni tu información de V10.6.');
  const metrics=el(c,'div',undefined,'grid');if(S.data){const report=summary(S.data);for(const [name,value] of Object.entries({'Días de alimentación':report.dietDays,'Sesiones de entrenamiento':report.trainingDays,'Pasos ficticios':report.stepsTotal,'Minutos de cardio':report.cardioMinutes})){const m=el(metrics,'div',undefined,'metric115');el(m,'small',name);el(m,'b',String(value));}}else desc(c,'Necesitás la clave de recuperación para descifrar el diario.');
  const cloud=card('Cloudflare · Sincronización cifrada');el(cloud,'span','Revisión '+S.head+' / 30','tag115');desc(cloud,'El Worker solo almacena un sobre cifrado y aplica los permisos de la cuenta Google. No puede leer tu diario.');
  const a=el(cloud,'div',undefined,'cta114');if(!S.pending)action(a,'Actualizar desde Cloudflare',refresh,true);if(S.key&&S.head&&!S.pending)action(a,'Descargar historial cifrado',downloadEncrypted,true);
 }
 if(S.tab==='inicio')overviewExtras();
 if(S.tab==='salud')healthPreview();
 if(S.tab==='progreso')progressPreview();
 if(S.tab==='nutricion'||S.tab==='entrenamiento'){
  const isDiet=S.tab==='nutricion',kind=isDiet?'diet':'workout';
  const c=card(isDiet?'Registro diario · Dieta':'Entrenamiento de hoy · Gym');
  desc(c,'Elegí un ejemplo de enero de 2026. No se admiten datos reales ni se importan registros personales.');
  if(!S.key)desc(c,'Primero entrá en Cuenta y configurá o recuperá tu clave.');
  else if(!S.data)desc(c,'No se pudo abrir el diario cifrado.');
  else if(S.pending)desc(c,'Antes de agregar otro registro, resolvé el borrador cifrado pendiente en Cuenta.');
  else if(S.head>=30)desc(c,'Se alcanzó el límite de 30 revisiones de staging.');
  else if(S.data.entries.length>=40)desc(c,'Se alcanzó el límite de 40 registros ficticios.');
  else form(c,kind);
  const hist=card(isDiet?'Historial de Dieta · ficticio':'Historial de Gym · ficticio');
  const filter=choice(hist,'historyFilter124','Ver registros',[['todos','Todo enero'],['primera','1–15 de enero'],['segunda','16–31 de enero']]);filter.value=S.historyFilter;
  filter.addEventListener('change',()=>{S.historyFilter=filter.value;render();});
  const entries=(S.data?.entries||[]).filter(x=>x.kind===kind&&(S.historyFilter==='todos'||(S.historyFilter==='primera'?Number(x.date.slice(-2))<=15:Number(x.date.slice(-2))>15))).sort((a,b)=>b.date.localeCompare(a.date));
  if(!entries.length)desc(hist,'Todavía no hay ejemplos en esta sección.');
  for(const item of entries){const entry=el(hist,'div',undefined,'entry115');el(entry,'strong',item.date);el(entry,'small',item.kind==='diet'?`Adherencia ${item.ad} · ${item.steps} pasos · energía ${item.energy}/5`:`Rutina ${item.routine} · ${item.cardioMin} min · ${item.cardioSpeed} km/h · esfuerzo ${item.cardioRPE}/10`);}
 }
 if(S.tab==='cuenta'){
  preferencesPreview();
  const c=card('Cuenta · identidad y seguridad');desc(c,'El inicio de sesión usa Google, no una contraseña de Asia. La clave de recuperación descifra exclusivamente los datos cifrados.');action(c,'Cerrar sesión',logout,true);
  const k=card('Código de recuperación');
  if(S.showCode){desc(k,'Guardá este código fuera de Asia. Se mostrará una sola vez y no lo conoce Cloudflare.');el(k,'code',S.showCode,'code115');action(k,'Ya guardé el código',async()=>{S.showCode=null;},true);}
  else if(S.key){desc(k,'Clave guardada en este perfil de Chrome. Podés usar el mismo código para abrir estas copias en otro navegador. Si perdés el código y todos los dispositivos, las copias no se pueden descifrar.');}
  else{
   if(S.head===0)action(k,'Generar código de recuperación',createKey);
   const f=el(k,'form',undefined,'form115'),input=el(f,'input');input.type='password';input.placeholder='Código de recuperación guardado';input.autocomplete='off';input.minLength=43;input.maxLength=43;input.required=true;input.setAttribute('aria-label','Código de recuperación');
   const b=el(f,'button','Importar código');b.type='submit';f.addEventListener('submit',async e=>{e.preventDefault();b.disabled=true;S.failed=false;try{await importKey(input.value);S.notice='Código importado.';}catch(err){S.failed=true;S.notice=err.message;}finally{input.value='';render();}});
   desc(k,'Si ya usaste V11.14 con este usuario, reutilizá su código. Nunca crees un código diferente para las copias existentes.');
  }
  const kit=card('Kit de rescate cifrado · compatible con V11.18');
  desc(kit,'El kit permite recuperar el código ORIGINAL si lo olvidás, siempre que conserves el archivo cifrado Y el código de rescate de 43 caracteres. Es distinto del respaldo integral V11.17 y NO cambia la clave usada por las revisiones existentes.');
  if(S.key){
   const f=el(kit,'form',undefined,'form115');
   const input=el(f,'input');input.type='password';input.required=true;input.minLength=43;input.maxLength=43;input.autocomplete='off';input.placeholder='Código ORIGINAL para preparar el kit';input.setAttribute('aria-label','Código original para generar kit');
   const b=el(f,'button','Crear y descargar kit cifrado');b.type='submit';
   f.addEventListener('submit',async e=>{e.preventDefault();b.disabled=true;S.failed=false;try{await createKitWithCode(input.value);}catch(err){S.kitRescueCode=null;S.failed=true;S.notice=err.message||'KIT_INVALIDO';}finally{input.value='';render();}});
  }else desc(kit,'No tenés la clave en este dispositivo. Podés recuperarla usando un kit ya descargado y su código de rescate. Si no disponés de ninguna de las dos claves originales ni de un kit, los datos cifrados no son recuperables.');
  if(S.kitRescueCode){
   desc(kit,'CÓDIGO DE RESCATE: copiá y guardá este valor FUERA de la carpeta del kit. Solo se muestra ahora. Si perdés ambos métodos de acceso, no podremos descifrar el historial.');
   el(kit,'code',S.kitRescueCode,'code115');
   action(kit,'Ya guardé el código de rescate',async()=>{S.kitRescueCode=null;S.notice='Código de rescate oculto de esta sesión.';},true);
  }
  const f2=el(kit,'form',undefined,'form115');
  const picker=el(f2,'input');picker.type='file';picker.required=true;picker.accept='.json,application/json';picker.className='file116';picker.setAttribute('aria-label','Archivo kit de rescate cifrado V11.18');
  const rescue=el(f2,'input');rescue.type='password';rescue.required=true;rescue.minLength=43;rescue.maxLength=43;rescue.autocomplete='off';rescue.placeholder='Código de rescate (43 caracteres)';rescue.setAttribute('aria-label','Código de rescate para abrir el kit');
  const b2=el(f2,'button','Recuperar clave con kit');b2.type='submit';
  f2.addEventListener('submit',async e=>{e.preventDefault();b2.disabled=true;S.failed=false;try{await recoverKit(picker.files?.[0],rescue.value);}catch(err){S.failed=true;S.notice=err.message||'KIT_INVALIDO';}finally{rescue.value='';picker.value='';render();}});
  desc(kit,'La recuperación verifica el código y las dos colecciones cifradas de esta cuenta sin escribir en D1. No recupera una clave sin el archivo y su código de rescate; no constituye rotación de clave ni desactiva el código original. SOLO datos ficticios.');
  const v=card('Historial cifrado de pruebas');el(v,'p',`${S.versions.length} revisiones · máximo 30`);if(S.key&&S.head&&!S.pending)action(v,'Descargar historial cifrado',downloadEncrypted,true);
  const recovery=card('Importar y recuperar copia cifrada · V11.16');
  desc(recovery,'Acepta archivos exportados por V11.15/V11.16 de esta MISMA cuenta Google. Necesita el código de recuperación. Verifica todas las revisiones antes de escribir. No elimina ni sobrescribe datos.');
  if(!S.key)desc(recovery,'Primero recuperá la clave en esta sección para habilitar la importación.');
  else if(S.pending)desc(recovery,'Resolvé antes el borrador cifrado pendiente.');
  else{
   const picker=el(recovery,'input');picker.type='file';picker.accept='.json,application/json';picker.className='file116';picker.setAttribute('aria-label','Elegir respaldo cifrado de V11.15');
   picker.addEventListener('change',async()=>{const file=picker.files?.[0];picker.disabled=true;S.failed=false;try{await importArchiveFile(file);}catch(err){S.importCandidate=null;S.failed=true;S.notice=err.message;}finally{render();}});
   if(S.importCandidate){
    const info=S.importCandidate,report=info.overview;
    desc(recovery,`Archivo verificado: ${info.head} revisiones · ${report.dietDays} días de alimentación · ${report.trainingDays} entrenamientos ficticios.`);
    action(recovery,'Recuperar solo revisiones faltantes',restoreImported);
    action(recovery,'Quitar archivo de memoria',async()=>{S.importCandidate=null;S.notice='Archivo retirado. La nube permanece intacta.';},true);
   }
  }
  desc(recovery,'Si se corta una recuperación, volvé a importar el mismo archivo: solo se reanudará si las revisiones ya presentes coinciden exactamente. Una nube divergente bloquea el proceso. No se permite importar archivos de otras cuentas.');
 }
 if(S.tab==='cuenta'){
  const whole=card('Respaldo INTEGRAL cifrado · V11.17');
  desc(whole,'Incluye las dos colecciones ficticias independientes: snapshots V11.14 y diario V11.15+. Se recuperan únicamente revisiones faltantes en la MISMA cuenta y código. No incluye borradores locales, claves ni datos de V10.6.');
  if(!S.key)desc(whole,'Primero introducí tu código de recuperación en Cuenta.');
  else if(S.pending)desc(whole,'Resolvé primero los borradores locales.');
  else{
   action(whole,'Descargar copia integral cifrada',downloadFullBundle,true);
   const picker=el(whole,'input');picker.type='file';picker.accept='.json,application/json';picker.className='file116';picker.setAttribute('aria-label','Seleccionar copia integral cifrada V11.17');
   picker.addEventListener('change',async()=>{const file=picker.files?.[0];picker.disabled=true;S.failed=false;try{await importFullBundle(file);}catch(err){S.bundleCandidate=null;S.failed=true;S.notice=err?.message||'ERROR';}finally{render();}});
   if(S.bundleCandidate){const v=S.bundleCandidate;desc(whole,`Verificado: ${v.collections.snapshots.head} copias antiguas + ${v.collections.journal.head} revisiones del diario · ${v.snapshotEntries} eventos sintéticos previos · ${v.overview.dietDays} días de alimentación ficticia.`);action(whole,'Recuperar revisiones faltantes de ambas colecciones',restoreFullBundle);action(whole,'Quitar archivo de memoria',async()=>{S.bundleCandidate=null;S.notice='Copia retirada. La nube no cambió.';},true);}
  }
  desc(whole,'Si los historiales remotos difieren del archivo, se bloquea SIN sobrescribir. Una interrupción puede dejar algunas revisiones nuevas ya guardadas; volver a importar reanuda la operación. No se borra Cloudflare para hacer pruebas.');
 }
 if(S.pending){const p=card('Borrador cifrado pendiente');desc(p,'Una operación no terminó o hubo cambios simultáneos. Conservamos las dos versiones y NO hacemos una fusión destructiva.');const a=el(p,'div',undefined,'cta114');action(a,'Verificar y resolver',resolvePending);action(a,'Descartar borrador (confirmar)',discardPending,true);}
}
for(const b of document.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>{S.tab=b.dataset.tab;S.notice='';S.failed=false;render();window.scrollTo(0,0);});
init();
