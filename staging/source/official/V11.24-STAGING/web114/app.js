import {newRecoveryCode,keyFromRecoveryCode,encryptDemo,decryptDemo,blankPayload,nextSyntheticEntry,kinds1112,sealPending,openPending} from '/v11.13/crypto.js';
import {validSynthetic,mergeSynthetic,containsDraft,validateRevisionList} from '/v11.13/sync113.js';
const app=document.querySelector('#app'),base='/v11.11';
const S={accountId:null,csrf:null,head:0,versions:[],key:null,payload:null,pending:null,notice:'',failure:false,originalCode:null,sessionExpired:false,tab:'inicio'};
const ui=(parent,tag,content,cls)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;if(cls)e.className=cls;parent.append(e);return e;};
const container=(parent,title)=>{const x=ui(parent,'section',undefined,'card stack');ui(x,'h2',title);return x;};
const explain=(x,t)=>ui(x,'p',t,'note');
const btn=(x,text,handler,cls='btn primary')=>{const b=ui(x,'button',text,cls);b.type='button';b.addEventListener('click',async()=>{b.disabled=true;S.notice='';S.failure=false;try{await handler();}catch(e){S.notice=e?.message||'ERROR';S.failure=true;}finally{render();}});return b;};
const fail=(message)=>{throw Error(message);};
async function api(path,opts={}){
 let r;try{r=await fetch(base+path,{credentials:'same-origin',cache:'no-store',redirect:'manual',...opts});}catch{fail('RED_NO_DISPONIBLE');}
 let data;try{data=await r.json();}catch{fail('SERVIDOR_NO_DISPONIBLE');}
 if(r.status===401){S.sessionExpired=true;fail('SESION_VENCIDA_INICIA_GOOGLE');}
 return {...data,status:r.status};
}
const databaseName='asia-v1112-demo-keys';
function openKeys(){return new Promise((resolve,reject)=>{const q=indexedDB.open(databaseName,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('account_keys'))q.result.createObjectStore('account_keys');};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(Error('ALMACENAMIENTO_NO_DISPONIBLE'));});}
function openDrafts(){return new Promise((resolve,reject)=>{const q=indexedDB.open('asia-v1113-encrypted-pending',1);q.onupgradeneeded=()=>q.result.createObjectStore('drafts');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(Error('BORRADOR_LOCAL_NO_DISPONIBLE'));});}
async function useStore(open,store,mode,operate){const db=await open();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);const req=operate(tx.objectStore(store));let value;req.onsuccess=()=>{value=req.result;};tx.oncomplete=()=>resolve(value||null);tx.onerror=()=>reject(Error('ALMACENAMIENTO_NO_DISPONIBLE'));tx.onabort=()=>reject(Error('ALMACENAMIENTO_NO_DISPONIBLE'));});}finally{db.close();}}
const readKey=id=>useStore(openKeys,'account_keys','readonly',st=>st.get(id));
const saveKey=(id,key)=>useStore(openKeys,'account_keys','readwrite',st=>st.put(key,id));
const readDraft=id=>useStore(openDrafts,'drafts','readonly',st=>st.get(id));
const saveDraft=(id,item)=>useStore(openDrafts,'drafts','readwrite',st=>st.put(item,id));
const clearDraft=id=>useStore(openDrafts,'drafts','readwrite',st=>st.delete(id));
async function fetchHead(){
 const r=await api('/data/snapshots');if(!r.ok)fail(r.error==='DATOS_DESACTIVADOS'?'RESPALDOS_DE_PRUEBA_DESACTIVADOS':`REMOTE_${r.status}`);
 if(!Number.isSafeInteger(r.head)||r.head<0||r.head>20||!Array.isArray(r.versions))fail('INDICE_REMOTO_INVALIDO');
 if(r.head!==r.versions[0]?.revision&&r.head!==0)fail('INDICE_REMOTO_INVALIDO');
 const revision=r.head;
 let payload=blankPayload(S.accountId);
 if(revision&&S.key){const latest=await api('/data/snapshots/'+revision);if(!latest.ok)fail('DESCARGA_NO_DISPONIBLE');payload=await decryptDemo(latest.envelope,S.key,S.accountId);}
 else if(revision)payload=null;
 return {revision,versions:r.versions,payload};
}
async function remote(){const latest=await fetchHead();S.head=latest.revision;S.versions=latest.versions;S.payload=latest.payload;return latest;}
async function loadPending(){
 if(!S.key||!S.accountId)return;
 const item=await readDraft(S.accountId);
 if(!item){S.pending=null;return;}
 if(!item||Object.keys(item).sort().join(',')!=='baseRevision,mode,sealed'||!['append','restore'].includes(item.mode)||!Number.isInteger(item.baseRevision)||item.baseRevision<0||item.baseRevision>20)fail('BORRADOR_LOCAL_INVALIDO');
 const pair=await openPending(item.sealed,S.key,S.accountId);
 S.pending={mode:item.mode,baseRevision:item.baseRevision,base:pair.base,proposed:pair.proposed};
}
async function init(){
 try{
  const m=await api('/auth/me');if(!m.ok){S.notice='Iniciá sesión con Google para usar esta prueba.';return render();}
  S.accountId=m.accountId;S.csrf=m.csrf;S.key=await readKey(m.accountId);await remote();await loadPending();
 }catch(e){S.notice=e.message;S.failure=true;}render();
}
async function createKey(){
 if(S.head!==0)fail('YA_EXISTEN_REVISIONES_IMPORTA_LA_CLAVE');
 const code=newRecoveryCode(),key=await keyFromRecoveryCode(code);await saveKey(S.accountId,key);S.key=key;S.originalCode=code;S.payload=blankPayload(S.accountId);await loadPending();
}
async function importKey(value){
 const key=await keyFromRecoveryCode(value.trim());
 if(S.head){const r=await api('/data/snapshots/'+S.head);if(!r.ok)fail('DESCARGA_NO_DISPONIBLE');S.payload=await decryptDemo(r.envelope,key,S.accountId);}
 await saveKey(S.accountId,key);S.key=key;S.originalCode=null;await loadPending();
}
async function createPending(proposed,mode){
 if(S.pending)fail('BORRADOR_PENDIENTE_RESOLVELO_PRIMERO');
 if(!S.key||!S.payload||!validSynthetic(proposed,S.accountId))fail('DATOS_DE_PRUEBA_INVALIDOS');
 const basePayload=S.payload,baseRevision=S.head;
 const sealed=await sealPending(basePayload,proposed,S.key,S.accountId);
 await saveDraft(S.accountId,{baseRevision,mode,sealed}); // Durability BEFORE any network write.
 S.pending={baseRevision,mode,base:basePayload,proposed};
}
async function commitPending(){
 const item=S.pending;if(!item||!S.key)fail('SIN_BORRADOR');
 const envelope=await encryptDemo(item.proposed,S.key,S.accountId);
 const r=await api('/data/snapshots',{method:'POST',headers:{'Content-Type':'application/json','X-Asia-CSRF':S.csrf},body:JSON.stringify({expectedRevision:item.baseRevision,envelope})});
 if(r.status===409){S.notice='Conflicto detectado. Conservamos tu borrador cifrado en este navegador.';S.failure=true;return;}
 if(!r.ok)fail('GUARDADO_'+r.status+'_'+(r.error||'ERROR'));
 // The server acknowledged. If clearing fails, next launch will detect the saved entry.
 await clearDraft(S.accountId);S.pending=null;S.head=r.revision;S.payload=item.proposed;
 await remote();S.notice='Revisión '+r.revision+' guardada correctamente.';S.failure=false;
}
async function add(kind){
 if(!S.key||!S.payload||S.pending)fail('BOVEDA_NO_DISPONIBLE');
 if(S.head>=20)fail('LIMITE_DE_REVISIONES_DE_PRUEBA');
 await createPending(nextSyntheticEntry(S.payload,kind),'append');await commitPending();
}
async function restore(revision){
 if(S.pending||!S.key||!S.payload)fail('RESOLVE_PRIMERO_EL_BORRADOR');
 if(S.head>=20)fail('LIMITE_DE_REVISIONES_DE_PRUEBA');
 if(!Number.isInteger(revision)||revision<=0||revision>=S.head)fail('REVISION_INVALIDA');
 const r=await api('/data/snapshots/'+revision);if(!r.ok)fail('REVISION_NO_DISPONIBLE');
 const old=await decryptDemo(r.envelope,S.key,S.accountId);
 if(!window.confirm(`¿Restaurar la revisión ${revision} como una NUEVA revisión? No se borrará ninguna copia anterior.`))return;
 await createPending(old,'restore');await commitPending();
}
async function resolvePending(){
 const item=S.pending;if(!item||!S.key)fail('SIN_BORRADOR');
 const latest=await fetchHead();
 if(latest.payload===null)fail('CLAVE_NECESARIA');
 if((item.mode==='append'&&containsDraft(latest.payload,item.proposed))||
   (item.mode==='restore'&&latest.revision>item.baseRevision&&latest.payload.entries.length===item.proposed.entries.length&&containsDraft(latest.payload,item.proposed))){
  await clearDraft(S.accountId);S.pending=null;S.head=latest.revision;S.payload=latest.payload;S.versions=latest.versions;S.notice='La operación ya estaba guardada en Cloudflare. No se duplicó.';S.failure=false;return;
 }
 if(item.mode==='restore')fail('RESTAURACION_EN_CONFLICTO_DESCARGA_Y_REINTENTA_MANUALMENTE');
 const merged=mergeSynthetic(item.base,item.proposed,latest.payload);
 if(merged.status==='YA_GUARDADO'){
  await clearDraft(S.accountId);S.pending=null;S.head=latest.revision;S.payload=latest.payload;S.versions=latest.versions;S.notice='Los cambios ya están presentes.';S.failure=false;return;
 }
 if(merged.status!=='LISTO')fail('NO_SE_PUDO_FUSIONAR_'+merged.status);
 if(latest.revision>=20)fail('LIMITE_DE_REVISIONES_DE_PRUEBA');
 // Re-encrypt the new pending candidate BEFORE a conditional upload.
 const sealed=await sealPending(latest.payload,merged.payload,S.key,S.accountId);
 await saveDraft(S.accountId,{baseRevision:latest.revision,mode:'append',sealed});
 S.pending={baseRevision:latest.revision,mode:'append',base:latest.payload,proposed:merged.payload};
 await commitPending();
}
async function discardPending(){
 if(!S.pending)return;
 if(!window.confirm('¿Descartar definitivamente el borrador LOCAL de prueba? No borra revisiones remotas.'))return;
 await clearDraft(S.accountId);S.pending=null;await remote();S.notice='Borrador local descartado.';S.failure=false;
}
async function downloadEncryptedHistory(){
 if(!S.key||!S.head||S.pending)fail('HISTORIAL_NO_DISPONIBLE');
 const index=await api('/data/snapshots');if(!index.ok||!Number.isInteger(index.head)||index.head!==S.head)fail('HISTORIAL_CAMBIO_ACTUALIZAR_PRIMERO');
 const history=[];
 for(let revision=1;revision<=S.head;revision++){
  const r=await api('/data/snapshots/'+revision);
  if(!r.ok||r.revision!==revision)fail('HISTORIAL_INCOMPLETO');
  await decryptDemo(r.envelope,S.key,S.accountId); // Refuse corrupt or wrong-key archives.
  history.push({revision,envelope:r.envelope});
 }
 if(!validateRevisionList(history))fail('HISTORIAL_INVALIDO');
 // The backup contains ciphertext only; NEVER include the recovery code, key or CSRF.
 const payload={format:'asia-v1113-encrypted-archive-v1',accountId:S.accountId,head:S.head,history};
 const bytes=new TextEncoder().encode(JSON.stringify(payload));
 const checksum=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 const file=JSON.stringify({...payload,sha256:checksum},null,2);
 const blob=new Blob([file],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=`asia-staging-v11.13-respaldo-cifrado-${S.head}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 S.notice='Archivo cifrado descargado. El código de recuperación se guarda por separado: no está incluido.';S.failure=false;
}
async function refresh(){if(S.pending)fail('RESOLVE_EL_BORRADOR_PRIMERO');await remote();}
async function logout(){
 const result=await api('/auth/logout',{method:'POST',headers:{'X-Asia-CSRF':S.csrf}});if(!result.ok)fail('NO_SE_PUDO_CERRAR_SESION');
 S.accountId=null;S.csrf=null;S.key=null;S.payload=null;S.pending=null;S.originalCode=null;S.sessionExpired=false;S.notice='Sesión cerrada. Los datos ficticios permanecen cifrados.';S.failure=false;
}

// This screen intentionally reuses the original V10.6 CSS; it does not execute legacy app code.
// All content is fixed synthetic selections and is inserted through textContent.
const entryNames={meal:'Comida ficticia',walk:'Caminata ficticia',rest:'Descanso ficticio',training:'Entrenamiento ficticio'};
const count=k=>S.payload?.entries.filter(x=>x.kind===k).length||0;
function card(parent,heading){const c=ui(parent,'section',undefined,'card');ui(c,'h2',heading);return c;}
function action(parent,label,fn,secondary=false){return btn(parent,label,fn,secondary?'secondary':'');}
function info(parent,message){ui(parent,'p',message,'muted114');}
function navState(){for(const b of document.querySelectorAll('nav [data-tab]'))b.classList.toggle('active',b.dataset.tab===S.tab);}
function render(){
 app.replaceChildren();navState();
 if(S.notice){const c=ui(app,'div',S.notice,'status114'+(S.failure?' error':''));c.setAttribute('role','status');}
 if(!S.accountId||S.sessionExpired){const c=card(app,'Iniciá sesión con Google');info(c,'No necesitás una contraseña de Asia. Si Google te devuelve a V11.13, volvé a abrir la dirección V11.14.');const a=ui(c,'a','Iniciar sesión con Google','btnlink114');a.href='/v11.14/auth/start';return;}
 if(S.tab==='inicio'){
  const c=card(app,'Resumen de actividades');info(c,'Este es el estilo visual de Asia 2027 V10.6, conectado a la sesión Google y a copias cifradas de prueba.');
  const g=ui(c,'div',undefined,'grid');for(const [label,k] of [['Alimentación','meal'],['Entrenamiento','training'],['Caminatas','walk'],['Descanso','rest']]){const m=ui(g,'div',undefined,'metric');ui(m,'small',label);ui(m,'b',String(count(k)));}
  const sync=card(app,'Sincronización segura');ui(sync,'span',`Revisión en Cloudflare: ${S.head} de 20`,'pill');info(sync,S.key?'Datos ficticios cifrados con una clave que solamente controla este navegador.':'Para empezar, configurá o importá tu clave de recuperación desde la sección Cuenta.');
  const acts=ui(sync,'div',undefined,'cta114');action(acts,'Actualizar desde Cloudflare',refresh,true);if(S.key&&S.head>0&&!S.pending)action(acts,'Descargar historial cifrado',downloadEncryptedHistory,true);
 }
 if(['nutricion','entrenamiento','descanso'].includes(S.tab)){
  const mapping={nutricion:['Alimentación',['meal']],entrenamiento:['Entrenamiento',['training','walk']],descanso:['Descanso',['rest']]};const [name,types]=mapping[S.tab];const c=card(app,name);
  info(c,'Estas opciones generan solamente eventos ficticios. No representan el registro nutricional ni la planificación de entrenamiento completa de V10.6.');
  if(!S.key)info(c,'Primero abrí Cuenta y configurá la clave de recuperación de prueba.');
  else if(!S.payload)info(c,'No se pudo descifrar la copia remota. Revisá tu clave de recuperación.');
  else if(S.pending)info(c,'Existe un borrador cifrado pendiente. Resolvelo desde Cuenta.');
  else if(S.head>=20)info(c,'Se alcanzó el límite de 20 revisiones de prueba.');
  else{const actions=ui(c,'div',undefined,'cta114');for(const kind of types)action(actions,'+ '+entryNames[kind],()=>add(kind));}
  const hist=card(app,'Historial de prueba');const entries=(S.payload?.entries||[]).filter(x=>types.includes(x.kind));
  if(!entries.length)info(hist,'Todavía no hay registros de esta categoría.');for(const item of [...entries].reverse())ui(hist,'div',entryNames[item.kind],'entry114');
 }
 if(S.tab==='cuenta'){
  const c=card(app,'Tu cuenta Google');info(c,'Google verificó tu identidad. Los respaldos cifrados de staging están separados por cuenta.');action(ui(c,'div',undefined,'cta114'),'Cerrar sesión',logout,true);
  const k=card(app,'Clave de recuperación');
  if(S.originalCode){ui(k,'p','Copiá el código y guardalo de forma privada. Se muestra una sola vez; NO es la contraseña de acceso a Asia.','notice');ui(k,'code',S.originalCode,'code114');action(k,'Ya guardé el código',async()=>{S.originalCode=null;},true);}
  else if(!S.key){info(k,S.head===0?'Generá una clave aleatoria antes de guardar pruebas.':'La cuenta tiene copias cifradas: importá el código que guardaste en otro navegador.');
   if(S.head===0)action(k,'Generar clave de recuperación',createKey);
   else{const f=ui(k,'form');const l=ui(f,'label','Código de recuperación');l.setAttribute('for','recovery114');const input=ui(f,'input');input.id='recovery114';input.type='password';input.autocomplete='off';input.required=true;input.minLength=43;input.maxLength=43;const sub=ui(f,'button','Abrir datos cifrados');sub.type='submit';f.addEventListener('submit',e=>{e.preventDefault();sub.disabled=true;importKey(input.value).then(()=>{S.notice='Clave importada correctamente.';S.failure=false;},err=>{S.notice=err.message;S.failure=true;}).finally(()=>{input.value='';render();});});}}
  else{info(k,'La clave está guardada localmente para esta cuenta. No se envía a Cloudflare. Si la perdés en todos tus dispositivos, no podremos recuperar las copias.');action(k,'Introducir otro código',async()=>{if(S.pending)fail('RESOLVE_BORRADOR_PRIMERO');S.key=null;S.payload=null;S.originalCode=null;},true);}
  const versions=card(app,'Revisiones y respaldo');ui(versions,'div',`Revisión actual: ${S.head} / 20`,'pill');info(versions,`${S.versions.length} revisiones cifradas disponibles.`);const acts=ui(versions,'div',undefined,'cta114');if(!S.pending)action(acts,'Actualizar desde Cloudflare',refresh,true);if(S.head>0&&S.key&&!S.pending)action(acts,'Descargar historial cifrado',downloadEncryptedHistory,true);
  if(S.head>1&&S.key&&!S.pending&&S.head<20){info(versions,'Restaurar no borra el historial anterior.');for(const rev of S.versions.map(x=>x.revision).filter(n=>n<S.head).slice(0,4))action(versions,'Restaurar revisión '+rev,()=>restore(rev),true);}
 }
 if(S.pending){const p=card(app,'Borrador cifrado pendiente');ui(p,'p','Tu última operación está protegida en este navegador. No se sobrescribió otra revisión.','notice');const actions=ui(p,'div',undefined,'cta114');action(actions,'Comprobar y resolver conflicto',resolvePending);action(actions,'Descartar borrador (confirmar)',discardPending,true);}
}
for(const b of document.querySelectorAll('nav [data-tab]'))b.addEventListener('click',()=>{S.tab=b.dataset.tab;S.notice='';render();window.scrollTo(0,0);});
init();
