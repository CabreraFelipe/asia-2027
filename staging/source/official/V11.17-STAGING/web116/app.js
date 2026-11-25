import {newRecoveryCode,keyFromRecoveryCode} from '/v11.13/crypto.js';
import {verifyArchive,restoreArchive,MAX_ARCHIVE_BYTES} from '/v11.16/archive116.js';
import {encryptJournal,decryptJournal,sealDraft,openDraft} from '/v11.15/crypto115.js';
import {validJournal,blankJournal,addEntry,mergeJournal,journalContains,summary} from '/v11.15/journal115.js';
const origin='/v11.11',journalApi='/v11.15/data/journal',root=document.querySelector('#app');
const S={account:null,csrf:null,key:null,head:0,versions:[],data:null,pending:null,showCode:null,tab:'inicio',notice:'',failed:false,sessionExpired:false,importCandidate:null};
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
 S.account=who.accountId;S.csrf=who.csrf;S.key=await getKey(S.account);await refresh();await loadPending();
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
async function logout(){
 const r=await api(origin+'/auth/logout',{method:'POST',headers:{'X-Asia-CSRF':S.csrf}});if(!r.ok)fail('CIERRE_NO_DISPONIBLE');
 Object.assign(S,{account:null,csrf:null,key:null,head:0,versions:[],data:null,pending:null,showCode:null,sessionExpired:false,importCandidate:null});S.notice='Sesión cerrada.';
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
function render(){
 root.replaceChildren();for(const b of document.querySelectorAll('nav [data-tab]'))b.classList.toggle('active',b.dataset.tab===S.tab);
 if(S.notice){const div=el(root,'div',S.notice,'status114'+(S.failed?' error':''));div.setAttribute('role','status');}
 if(!S.account||S.sessionExpired){const c=card('Iniciar sesión con Google');desc(c,'Acceso real de staging, sin contraseña propia. La prueba usa únicamente datos inventados.');const a=el(c,'a','Iniciar sesión con Google','btnlink114');a.href='/v11.16/auth/start';return;}
 if(S.tab==='inicio'){
  const c=card('Diario conectado con Google');desc(c,'Campos de alimentación y cardio inspirados en V10.6; almacenamiento cifrado separado para no alterar V11.14.');
  const metrics=el(c,'div',undefined,'grid');if(S.data){const report=summary(S.data);for(const [name,value] of Object.entries({'Días de alimentación':report.dietDays,'Sesiones de entrenamiento':report.trainingDays,'Pasos ficticios':report.stepsTotal,'Minutos de cardio':report.cardioMinutes})){const m=el(metrics,'div',undefined,'metric115');el(m,'small',name);el(m,'b',String(value));}}else desc(c,'Necesitás la clave de recuperación para descifrar el diario.');
  const cloud=card('Sincronización');el(cloud,'span','Revisión '+S.head+' / 30','tag115');desc(cloud,'El Worker solo almacena un sobre cifrado y aplica los permisos de la cuenta Google. No puede leer tu diario.');
  const a=el(cloud,'div',undefined,'cta114');if(!S.pending)action(a,'Actualizar desde Cloudflare',refresh,true);if(S.key&&S.head&&!S.pending)action(a,'Descargar historial cifrado',downloadEncrypted,true);
 }
 if(S.tab==='nutricion'||S.tab==='entrenamiento'){
  const isDiet=S.tab==='nutricion',kind=isDiet?'diet':'workout';
  const c=card(isDiet?'Registro diario · alimentación':'Entrenamiento de hoy');
  desc(c,'Campos basados en el diario V10.6. Fechas y opciones ficticias predefinidas: no ingreses mediciones reales.');
  if(!S.key)desc(c,'Primero entrá en Cuenta y configurá o recuperá tu clave.');
  else if(!S.data)desc(c,'No se pudo abrir el diario cifrado.');
  else if(S.pending)desc(c,'Antes de agregar otro registro, resolvé el borrador cifrado pendiente en Cuenta.');
  else if(S.head>=30)desc(c,'Se alcanzó el límite de 30 revisiones de staging.');
  else if(S.data.entries.length>=40)desc(c,'Se alcanzó el límite de 40 registros ficticios.');
  else form(c,kind);
  const hist=card('Historial ficticio');const entries=(S.data?.entries||[]).filter(x=>x.kind===kind).sort((a,b)=>b.date.localeCompare(a.date));
  if(!entries.length)desc(hist,'Todavía no hay ejemplos en esta sección.');
  for(const item of entries){const entry=el(hist,'div',undefined,'entry115');el(entry,'strong',item.date);el(entry,'small',item.kind==='diet'?`Adherencia ${item.ad} · ${item.steps} pasos · energía ${item.energy}/5`:`Rutina ${item.routine} · ${item.cardioMin} min · ${item.cardioSpeed} km/h · esfuerzo ${item.cardioRPE}/10`);}
 }
 if(S.tab==='cuenta'){
  const c=card('Cuenta Google y clave de recuperación');desc(c,'El inicio de sesión usa Google, no una contraseña de Asia. La clave de recuperación descifra exclusivamente los datos cifrados.');action(c,'Cerrar sesión',logout,true);
  const k=card('Código de recuperación');
  if(S.showCode){desc(k,'Guardá este código fuera de Asia. Se mostrará una sola vez y no lo conoce Cloudflare.');el(k,'code',S.showCode,'code115');action(k,'Ya guardé el código',async()=>{S.showCode=null;},true);}
  else if(S.key){desc(k,'Clave guardada en este perfil de Chrome. Podés usar el mismo código para abrir estas copias en otro navegador. Si perdés el código y todos los dispositivos, las copias no se pueden descifrar.');}
  else{
   if(S.head===0)action(k,'Generar código de recuperación',createKey);
   const f=el(k,'form',undefined,'form115'),input=el(f,'input');input.type='password';input.placeholder='Código de recuperación guardado';input.autocomplete='off';input.minLength=43;input.maxLength=43;input.required=true;input.setAttribute('aria-label','Código de recuperación');
   const b=el(f,'button','Importar código');b.type='submit';f.addEventListener('submit',async e=>{e.preventDefault();b.disabled=true;S.failed=false;try{await importKey(input.value);S.notice='Código importado.';}catch(err){S.failed=true;S.notice=err.message;}finally{input.value='';render();}});
   desc(k,'Si ya usaste V11.14 con este usuario, reutilizá su código. Nunca crees un código diferente para las copias existentes.');
  }
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
 if(S.pending){const p=card('Borrador cifrado pendiente');desc(p,'Una operación no terminó o hubo cambios simultáneos. Conservamos las dos versiones y NO hacemos una fusión destructiva.');const a=el(p,'div',undefined,'cta114');action(a,'Verificar y resolver',resolvePending);action(a,'Descartar borrador (confirmar)',discardPending,true);}
}
for(const b of document.querySelectorAll('nav [data-tab]'))b.addEventListener('click',()=>{S.tab=b.dataset.tab;S.notice='';S.failed=false;render();window.scrollTo(0,0);});
init();
