import {newRecoveryCode,keyFromRecoveryCode,encryptDemo,decryptDemo,blankPayload,nextSyntheticEntry,kinds1112,sealPending,openPending} from '/v11.13/crypto.js';
import {validSynthetic,mergeSynthetic,containsDraft,validateRevisionList} from '/v11.13/sync113.js';
const app=document.querySelector('#app'),base='/v11.11';
const S={accountId:null,csrf:null,head:0,versions:[],key:null,payload:null,pending:null,notice:'',failure:false,originalCode:null,sessionExpired:false};
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
function openKeys(){return new Promise((resolve,reject)=>{const q=indexedDB.open(databaseName,1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(Error('ALMACENAMIENTO_NO_DISPONIBLE'));});}
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
function render(){
 app.replaceChildren();
 const hero=ui(app,'section',undefined,'hero'),left=ui(hero,'div');ui(left,'div','Integración · Google + D1 · V11.13','eyebrow');ui(left,'h1','Sincronización de prueba');ui(left,'p','Datos cifrados, revisión histórica y borradores protegidos. Solo actividades ficticias.','muted');ui(hero,'span','STAGING AISLADO','pill');
 if(S.notice)ui(app,'div',S.notice,'status'+(S.failure?' error':''));
 if(!S.accountId||S.sessionExpired){const c=container(app,'Acceso con Google');explain(c,'La cuenta se verifica con Google, sin contraseña obligatoria de Asia.');const link=ui(c,'a','Iniciar sesión con Google','btn primary');link.href='/v11.11/auth/start';return;}
 const info=container(app,'Cuenta ficticia autenticada');explain(info,'Sesión Google real. Almacenamiento de prueba separado por cuenta.');btn(ui(info,'div',undefined,'actions'),'Cerrar sesión',logout,'btn ghost');
 const view=ui(app,'div',undefined,'grid two'),keycard=container(view,'Protección y recuperación');
 if(S.originalCode){ui(keycard,'p','Guardá este código en un lugar privado. Se muestra UNA SOLA VEZ y NO es una contraseña de acceso.','hint');ui(keycard,'code',S.originalCode,'code');btn(keycard,'Ya guardé el código',async()=>{S.originalCode=null;},'btn ghost');}
 else if(!S.key){explain(keycard,S.head===0?'Generá una clave aleatoria para empezar.':'Hay una copia cifrada; introducí el código de recuperación en este navegador.');
  if(S.head===0)btn(keycard,'Generar clave de recuperación',createKey);
  else{const form=ui(keycard,'form',undefined,'stack'),field=ui(form,'div',undefined,'field');ui(field,'label','Código de recuperación');const input=ui(field,'input');input.type='password';input.autocomplete='off';input.required=true;input.minLength=43;input.maxLength=43;const submit=ui(form,'button','Importar código y abrir','btn primary');submit.type='submit';form.addEventListener('submit',e=>{e.preventDefault();submit.disabled=true;importKey(input.value).then(()=>{S.notice='Clave de prueba importada.';S.failure=false;},err=>{S.notice=err.message;S.failure=true;}).finally(()=>{input.value='';render();});});}}
 else{explain(keycard,'Clave local disponible. Para otro navegador, conservá el código original; Google no puede recuperarlo.');btn(keycard,'Cambiar clave local',async()=>{if(S.pending)fail('RESOLVE_EL_BORRADOR_PRIMERO');S.key=null;S.payload=null;S.originalCode=null;},'btn ghost');}
 const versions=container(view,'Revisiones y resguardo');ui(versions,'div',`Revisión actual: ${S.head} / 20`,'stat');explain(versions,`${S.versions.length} revisiones cifradas en Cloudflare D1. Restaurar crea una revisión nueva.`);btn(versions,'Actualizar desde Cloudflare',refresh,'btn ghost');
 if(S.head>=17)ui(versions,'p','Atención: se aproxima el límite de 20 revisiones de este laboratorio. No ingreses datos reales.','hint');
 if(S.head>0&&S.key&&!S.pending)btn(versions,'Descargar historial cifrado',downloadEncryptedHistory,'btn ghost');
 if(S.key&&S.payload&&!S.pending&&S.head>1){for(const revision of S.versions.map(x=>x.revision).filter(n=>n<S.head).slice(0,5))btn(versions,'Restaurar revisión '+revision,()=>restore(revision),'btn ghost');}
 if(S.key&&S.payload&&!S.pending){const c=container(app,'Actividad ficticia');c.style.marginTop='17px';explain(c,'Elegí actividades inventadas. Se cifran antes de enviarse.');const actions=ui(c,'div',undefined,'actions');if(S.head<20)for(const [kind,label] of Object.entries(kinds1112))btn(actions,'+ '+label,()=>add(kind),'btn');const listing=ui(c,'div',undefined,'list');if(!S.payload.entries.length)ui(listing,'div','Todavía no hay actividades ficticias.','empty');for(const x of [...S.payload.entries].reverse())ui(listing,'div',kinds1112[x.kind],'list-item');}
 if(S.pending){const c=container(app,'Borrador cifrado pendiente');ui(c,'p','Hay una operación cuya confirmación falta o que entró en conflicto. El borrador está CIFRADO en este navegador y se conserva al actualizar.','hint');explain(c,S.pending.mode==='restore'?'Restauración pendiente: no se fusiona automáticamente con otras revisiones.':'Podés comprobar si ya se guardó y, cuando sea seguro, integrar las actividades de ambas pestañas.');const acts=ui(c,'div',undefined,'actions');btn(acts,'Verificar y resolver sin sobrescribir',resolvePending);btn(acts,'Descartar borrador (confirmar)',discardPending,'btn ghost');}
}
init();
