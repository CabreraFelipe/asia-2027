// Candidate-only controls. Mount in original backup card; no changes to original files.
import {downloadEncryptedCopy} from '../../V11.32-INTEGRACION/src/download.mjs';
import {prepareSelectiveRestore} from '../../V11.32-INTEGRACION/src/selective-restore.mjs';
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const states={saved:'Guardado confirmado',pending:'Cambios pendientes',saving:'Guardando…',error:'Guardado no confirmado. Conservá esta sesión.',locked:'Sesión bloqueada',closed:'Sesión cerrada'};
const names={'asia-theme-v4':'Tema','asia-layout-v51':'Inicio','asia-layout-v541-diet':'Dieta','asia-layout-v541-training':'Gym','asia-layout-v541-health':'Salud','asia-layout-v541-progress54':'Progreso','asia-layout-v822':'Indicadores y accesos','asia2027-v1':'Diario','asia-gym-active53':'Entrenamiento activo','asia-timers-v4':'Cronómetros','asia-coach-v50':'Coach','asia-coach-memory-v55':'Memoria Coach','asia-chat-v4':'Chat','asia-weekly-ai-v4':'Análisis semanal'};
function element(doc,tag,text,id){const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(id)n.id=id;return n}
function button(doc,text,id){const n=element(doc,'button',text,id);n.type='button';n.className='secondary';return n}
function field(doc,id,text,type){const l=element(doc,'label',text),i=element(doc,'input',undefined,id);i.type=type;l.htmlFor=id;if(type==='password'){i.autocomplete='off';i.maxLength=200}return [l,i]}
export function mountRecoveryPanel({doc,session,download=downloadEncryptedCopy}){
 const anchor=doc.getElementById('backupNow42')?.closest('.card');
 check(anchor&&!doc.getElementById('recovery1133'),'Contenedor original no disponible');
 const panel=element(doc,'details',undefined,'recovery1133');panel.className='sectionfold';
 const status=element(doc,'p',undefined,'saveStatus1133');status.className='meta';status.setAttribute('role','status');
 const retry=button(doc,'Reintentar guardado','retry1133'),[label,phrase]=field(doc,'recoveryPhrase1133','Frase de recuperación (mín. 12 caracteres)','password');
 const prepare=button(doc,'Preparar copia cifrada de cambios pendientes','preparePending1133'),save=button(doc,'Descargar copia cifrada','downloadPending1133');
 const message=element(doc,'p',undefined,'recoveryStatus1133');message.setAttribute('role','status');message.className='tiny';
 let envelope=null,busy=false,disposed=false;
 function render(){if(disposed)return;const phase=session.status.phase;status.textContent=states[phase]||'Estado desconocido';retry.disabled=busy||!['error','pending'].includes(phase);prepare.disabled=busy||phase!=='error';save.disabled=busy||!envelope||phase!=='error';if(phase!=='error'&&envelope){envelope=null;message.textContent='La copia preparada dejó de estar vigente.'}}
 async function action(fn){if(busy||disposed)return;busy=true;render();try{await fn()}catch{message.textContent='No se completó. Conservá la sesión y verificá la conexión o la frase.'}finally{busy=false;render()}}
 retry.onclick=()=>action(async()=>{await session.flush();message.textContent='Guardado confirmado.'});
 phrase.oninput=()=>{envelope=null;render()};
 prepare.onclick=()=>action(async()=>{envelope=null;const p=phrase.value;check(p.length>=12,'Frase inválida');try{envelope=await session.exportPending(p);message.textContent='Copia preparada. Descargala y conservá la frase.'}finally{phrase.value=''}});
 save.onclick=()=>{if(save.disabled)return;try{download(envelope,{document:doc,filename:'asia-recuperacion-pendiente.json'});message.textContent='Descarga solicitada. Verificá que el archivo esté guardado.'}catch{message.textContent='No se pudo solicitar la descarga.'}};
 panel.append(element(doc,'summary','Guardado y recuperación'),status,retry,element(doc,'p','Solo ante cambios no confirmados. No reemplaza el respaldo integral.'),label,phrase,prepare,save,message);
 anchor.append(panel);render();
 return Object.freeze({render,dispose(){disposed=true;envelope=null;phrase.value='';panel.remove()}});
}
// Separate maintenance document: caller must not mount an editable diary during restore.
export function mountMaintenancePanel({doc,anchor,options,download=downloadEncryptedCopy}){
 check(anchor&&!doc.getElementById('maintenance1133'),'Contenedor inválido');
 const panel=element(doc,'section',undefined,'maintenance1133');panel.className='card';
 const [fl,file]=field(doc,'recoveryFile1133','Copia cifrada','file');file.accept='.json,application/json';
 const [rl,recovery]=field(doc,'restorePhrase1133','Frase de recuperación','password'),[bl,backup]=field(doc,'backupPhrase1133','Frase para respaldo previo','password');
 const compare=button(doc,'Comparar copia','compare1133'),rows=element(doc,'div',undefined,'restoreRows1133'),downloadButton=button(doc,'Descargar respaldo previo','backupDownload1133');
 const [cl,confirmed]=field(doc,'backupConfirmed1133','Confirmo que guardé el respaldo previo','checkbox');
 const apply=button(doc,'Restaurar selección','apply1133'),cancel=button(doc,'Cancelar comparación','cancel1133'),message=element(doc,'p',undefined,'restoreStatus1133');message.setAttribute('role','status');
 let plan=null,busy=false,requested=false,disposed=false;
 function clear(){plan?.cancel();plan=null;requested=false;confirmed.checked=false;rows.replaceChildren()}
 function render(){const selected=rows.querySelectorAll('input:checked').length;compare.disabled=busy||disposed;file.disabled=recovery.disabled=backup.disabled=busy;downloadButton.disabled=busy||!plan;confirmed.disabled=busy||!requested;apply.disabled=busy||!plan||!requested||!confirmed.checked||!selected;cancel.disabled=busy||!plan}
 async function action(fn){if(busy||disposed)return;busy=true;render();try{await fn()}catch{message.textContent='No se completó. No se confirmó ninguna restauración; revisá la copia o la sesión.'}finally{busy=false;render()}}
 for(const input of [file,recovery,backup])input.onchange=()=>{if(!busy){clear();render()}};
 compare.onclick=()=>action(async()=>{clear();const f=file.files[0];check(f&&f.size<=42e6,'Archivo inválido');const rp=recovery.value,bp=backup.value;recovery.value=backup.value='';const envelope=JSON.parse(await f.text());plan=await prepareSelectiveRestore({...options,envelope,recoveryPhrase:rp,backupPhrase:bp});for(const r of plan.rows){const l=element(doc,'label',names[r.key]||r.key),i=element(doc,'input');i.type='checkbox';i.value=r.key;i.disabled=!r.eligible;i.onchange=render;l.prepend(i);l.append(doc.createTextNode(' · '+({absent:'ausente',same:'igual',new:'nuevo',changed:'diferente'}[r.state])+(r.eligible?'':' · no restaurable')));rows.append(l)}message.textContent='Comparación lista. Solo preferencias habilitadas.'});
 downloadButton.onclick=()=>{if(downloadButton.disabled)return;try{download(plan.backup,{document:doc,filename:'asia-respaldo-previo.json'});requested=true;confirmed.checked=false;message.textContent='Descarga solicitada. Confirmá solo si conservaste el archivo.'}catch{message.textContent='No se pudo solicitar la descarga.'}render()};
 confirmed.onchange=render;
 apply.onclick=()=>action(async()=>{const selectedKeys=[...rows.querySelectorAll('input:checked')].map(i=>i.value),p=plan;check(requested&&confirmed.checked,'Respaldo pendiente');try{await p.apply({selectedKeys,backupSaved:true,confirmed:true});message.textContent='Restauración confirmada. Volvé a abrir el diario.'}finally{clear()}});
 cancel.onclick=()=>{clear();message.textContent='Comparación cancelada.';render()};
 panel.append(element(doc,'h2','Recuperación selectiva'),element(doc,'p','Modo mantenimiento. No edites el diario en otra ventana.'),fl,file,rl,recovery,bl,backup,compare,rows,downloadButton,cl,confirmed,apply,cancel,message);anchor.append(panel);render();
 return Object.freeze({dispose(){check(!busy,'Operación en curso');clear();recovery.value=backup.value='';disposed=true;panel.remove()}});
}
