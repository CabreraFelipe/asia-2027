import {newRecoveryCode,keyFromRecoveryCode,encryptDemo,decryptDemo,blankPayload,nextSyntheticEntry,kinds1112} from '/v11.12/crypto.js';
const app=document.querySelector('#app');
const base='/v11.11';
const state={accountId:null,csrf:null,head:0,versions:[],key:null,payload:null,pending:null,notice:'',failure:false,originalCode:null};
const ui=(parent,tag,content,cls)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;if(cls)e.className=cls;parent.append(e);return e;};
const container=(parent,title)=>{const x=ui(parent,'section',undefined,'card stack');ui(x,'h2',title);return x;};
const explain=(x,t)=>ui(x,'p',t,'note');
const btn=(x,text,handler,cls='btn primary')=>{const b=ui(x,'button',text,cls);b.type='button';b.addEventListener('click',async()=>{b.disabled=true;try{await handler();state.notice='';state.failure=false;}catch(e){state.notice=e?.message||'ERROR';state.failure=true;}finally{render();}});return b;};
const request=async(path,opts={})=>{
 const r=await fetch(base+path,{credentials:'same-origin',cache:'no-store',redirect:'manual',...opts});
 let data;try{data=await r.json();}catch{throw Error('SERVIDOR_NO_DISPONIBLE');}
 if(!r.ok)return {ok:false,status:r.status,error:data.error||'ERROR'};
 return {...data,status:r.status};
};
const storeName='asia-v1112-demo-keys';
const storeOpen=()=>new Promise((resolve,reject)=>{const req=indexedDB.open(storeName,1);req.onupgradeneeded=()=>{req.result.createObjectStore('account_keys');};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error('ALMACENAMIENTO_NO_DISPONIBLE'));});
async function readKey(id){const db=await storeOpen();try{return await new Promise((res,rej)=>{const tx=db.transaction('account_keys','readonly');const r=tx.objectStore('account_keys').get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(Error('ALMACENAMIENTO_NO_DISPONIBLE'));});}finally{db.close();}}
async function saveKey(id,key){const db=await storeOpen();try{return await new Promise((res,rej)=>{const tx=db.transaction('account_keys','readwrite');tx.objectStore('account_keys').put(key,id);tx.oncomplete=res;tx.onerror=()=>rej(Error('ALMACENAMIENTO_NO_DISPONIBLE'));tx.onabort=()=>rej(Error('ALMACENAMIENTO_NO_DISPONIBLE'));});}finally{db.close();}}
async function remote(){
 const versions=await request('/data/snapshots');
 if(!versions.ok)throw Error(versions.error==='DATOS_DESACTIVADOS'?'RESPALDOS_DE_PRUEBA_DESACTIVADOS':`REMOTE_${versions.status}`);
 state.head=versions.head;state.versions=versions.versions;
 if(state.head&&state.key){const r=await request('/data/snapshots/'+state.head);if(!r.ok)throw Error(`DESCARGA_${r.status}`);state.payload=await decryptDemo(r.envelope,state.key,state.accountId);}else state.payload=state.head?null:blankPayload(state.accountId);
}
async function init(){
 try{const me=await request('/auth/me');if(!me.ok){state.accountId=null;state.notice=me.status===401?'Iniciá sesión con Google para usar la prueba.':`SERVICIO_${me.status}`;return render();}
  state.accountId=me.accountId;state.csrf=me.csrf;state.key=await readKey(me.accountId);await remote();
 }catch(e){state.notice=e.message;state.failure=true;}render();
}
async function createKey(){
 if(state.head!==0)throw Error('YA_EXISTEN_REVISIONES_IMPORTA_LA_CLAVE');
 const code=newRecoveryCode(),key=await keyFromRecoveryCode(code);await saveKey(state.accountId,key);state.key=key;state.originalCode=code;state.payload=blankPayload(state.accountId);
}
async function importKey(value){
 const key=await keyFromRecoveryCode(value.trim());
 if(state.head){const r=await request('/data/snapshots/'+state.head);if(!r.ok)throw Error('DESCARGA_NO_DISPONIBLE');const payload=await decryptDemo(r.envelope,key,state.accountId);state.payload=payload;}
 await saveKey(state.accountId,key);state.key=key;state.originalCode=null;
}
async function add(kind){
 if(!state.key||!state.payload||state.pending)throw Error('BOVEDA_NO_DISPONIBLE');
 const proposed=nextSyntheticEntry(state.payload,kind),envelope=await encryptDemo(proposed,state.key,state.accountId);
 const result=await request('/data/snapshots',{method:'POST',headers:{'Content-Type':'application/json','X-Asia-CSRF':state.csrf},body:JSON.stringify({expectedRevision:state.head,envelope})});
 if(result.status===409){state.pending=proposed;throw Error('CONFLICTO_SIN_SOBRESCRITURA');}
 if(!result.ok)throw Error(`GUARDADO_${result.status}_${result.error}`);
 state.head=result.revision;state.payload=proposed;await remote();
}
async function refresh(){if(state.pending)throw Error('RESOLVE_EL_CONFLICTO_PRIMERO');await remote();}
async function logout(){const res=await request('/auth/logout',{method:'POST',headers:{'X-Asia-CSRF':state.csrf}});if(!res.ok)throw Error('NO_SE_PUDO_CERRAR_SESION');state.accountId=null;state.csrf=null;state.key=null;state.payload=null;state.pending=null;state.originalCode=null;state.notice='Sesión cerrada. Tus datos ficticios cifrados permanecen en staging.';}
function render(){
 app.replaceChildren();
 const hero=ui(app,'section',undefined,'hero');const left=ui(hero,'div');ui(left,'div','Integración · Google + D1 · V11.12','eyebrow');ui(left,'h1','Sincronización de prueba');ui(left,'p','Acceso con Google, copias cifradas y revisiones independientes por cuenta. Sin datos reales.','muted');ui(hero,'span','STAGING AISLADO','pill');
 if(state.notice)ui(app,'div',state.notice,'status'+(state.failure?' error':''));
 if(!state.accountId){const c=container(app,'Acceso con Google');explain(c,'No hace falta una contraseña de Asia. El proveedor de identidad verifica tu cuenta.');const a=ui(c,'a','Iniciar sesión con Google','btn primary');a.href='/v11.11/auth/start';return;}
 const info=ui(app,'section',undefined,'card stack');ui(info,'h2','Cuenta de prueba autenticada');ui(info,'p','Google verificó tu identidad. Los datos cifrados se asocian exclusivamente a esta cuenta.','note');const acts=ui(info,'div',undefined,'actions');btn(acts,'Cerrar sesión',logout,'btn ghost');
 const view=ui(app,'div',undefined,'grid two');const keycard=container(view,'Protección y recuperación');
 if(state.originalCode){ui(keycard,'p','Guardá este código de recuperación de prueba: aparece UNA sola vez. No es una contraseña de inicio de sesión.','hint');ui(keycard,'code',state.originalCode,'code');btn(keycard,'Ya guardé el código',async()=>{state.originalCode=null;},'btn ghost');}
 else if(!state.key){explain(keycard,state.head===0?'Tu cuenta todavía no tiene una copia cifrada. Generá una clave aleatoria para empezar.':'Encontramos una copia cifrada. Para leerla en este navegador necesitás el código de recuperación que se generó originalmente.');if(state.head===0)btn(keycard,'Generar clave de recuperación',createKey);else {const form=ui(keycard,'form',undefined,'stack');const field=ui(form,'div',undefined,'field');ui(field,'label','Código de recuperación');const input=ui(field,'input');input.type='password';input.autocomplete='off';input.required=true;input.minLength=43;input.maxLength=43;const submit=ui(form,'button','Importar código y abrir','btn primary');submit.type='submit';form.addEventListener('submit',e=>{e.preventDefault();submit.disabled=true;importKey(input.value).then(()=>{state.notice='Clave de prueba importada correctamente.';state.failure=false;},err=>{state.notice=err.message;state.failure=true;}).finally(()=>{input.value='';render();});});}}
 else{ui(keycard,'p','Clave local disponible. En otro navegador, iniciá sesión con Google e importá el código de recuperación para descifrar.','hint');explain(keycard,'La clave no se envía a Cloudflare y no se puede recuperar desde Google. Si la perdés en todos los dispositivos, no podremos descifrar estas copias de prueba.');btn(keycard,'Usar otro código de recuperación',async()=>{state.key=null;state.payload=null;state.originalCode=null;},'btn ghost');}
 const versions=container(view,'Estado remoto');ui(versions,'div',`Revisión actual: ${state.head}`,'stat');ui(versions,'p',`${state.versions.length} versiones almacenadas en Cloudflare D1 para esta cuenta.`,'note');btn(versions,'Actualizar desde Cloudflare',refresh,'btn ghost');
 if(state.key&&state.payload){const c=container(app,'Actividad ficticia');c.style.marginTop='17px';explain(c,'Elegí exclusivamente actividades inventadas predefinidas. El contenido se cifra en el navegador antes de enviarse.');const actions=ui(c,'div',undefined,'actions');for(const [kind,label] of Object.entries(kinds1112))btn(actions,'+ '+label,()=>add(kind),'btn');const listing=ui(c,'div',undefined,'list');if(!state.payload.entries.length)ui(listing,'div','Todavía no hay actividades ficticias.','empty');for(const x of [...state.payload.entries].reverse())ui(listing,'div',kinds1112[x.kind],'list-item');}
 if(state.pending){const c=container(app,'Conflicto detectado');ui(c,'p','Otra pestaña o dispositivo actualizó la cuenta antes que vos. La operación no sobrescribió su contenido.','hint');explain(c,'Este borrador permanece en la pestaña abierta. Es una demostración con datos ficticios.');btn(c,'Descartar borrador y cargar última revisión',async()=>{state.pending=null;await remote();},'btn ghost');}
}
init();
