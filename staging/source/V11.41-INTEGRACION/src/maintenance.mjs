// Integrated maintenance panels; no raw diary content rendered. Only explicit user actions write.
import {downloadEncryptedCopy,downloadRecoveryArchive1167} from '../../V11.32-INTEGRACION/src/download.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
export function mountMaintenance({doc,anchor,controller,download=downloadEncryptedCopy,downloadReview=downloadRecoveryArchive1167,onChange=()=>{}}){
 const el=(tag,text,id)=>{const n=doc.createElement(tag);if(text)n.textContent=text;if(id)n.id=id;return n};
 const root=el('details',null,'maintenance1141'),status=el('p',null,'maintenanceStatus1141');status.setAttribute('role','status');
 root.append(el('summary','Importación y recuperación cifradas'));
 const fields=el('div'),rows=el('div',null,'inventory1141'),actions=el('div');let busy=false,plan=null,kind=null,copy=null,requested=false;
 function input(id,type,label){const l=el('label',label),i=el('input',null,id);i.type=type;l.htmlFor=id;if(type==='password')i.autocomplete='off';if(type==='file')i.accept='.json,application/json';fields.append(l,i);return i}
 const file=input('archive1141','file','Archivo cifrado'),phrase=input('phrase1141','password','Frase del archivo'),backupPhrase=input('backupPhrase1141','password','Frase para respaldo previo o conflicto');
 const reviewFile=input('reviewFile1167','file','Volvé a seleccionar el respaldo de revisión descargado');
 const retained=input('retained1141','checkbox','Confirmo que conservé el archivo original'),reviewed=input('reviewed1141','checkbox','Revisé el inventario y confirmo la selección');
 const btn=(id,text,fn)=>{const b=el('button',text,id);b.type='button';b.onclick=()=>run(fn);actions.append(b);return b};
 const read=async()=>{const f=file.files[0];check(f&&f.size<=42e6,'Archivo inválido');return JSON.parse(await f.text())};
 function reset(){plan=null;kind=null;copy=null;requested=false;reviewFile.value='';retained.checked=reviewed.checked=false;rows.replaceChildren()}
 const imp=btn('import1141','Revisar importación integral',async()=>{reset();const sourcePhrase=phrase.value;phrase.value=backupPhrase.value='';plan=await controller.prepareImport({envelope:await read(),sourcePhrase});kind='import';for(const [k,v] of Object.entries(plan.inventory.diary))if(typeof v==='number')rows.append(el('p',k+': '+v));for(const r of plan.inventory.modules)rows.append(el('p',r.name+': '+(r.present?'presente':'ausente')));status.textContent='Inventario listo. Solo se importa a una cuenta vacía.'});
 const restore=btn('restore1141','Comparar recuperación selectiva',async()=>{reset();const recoveryPhrase=phrase.value,bp=backupPhrase.value;phrase.value=backupPhrase.value='';plan=await controller.prepareRestore({envelope:await read(),recoveryPhrase,backupPhrase:bp});kind='restore';copy=plan.backup;for(const r of plan.rows){const l=el('label',r.key+' · '+r.state),i=el('input');i.type='checkbox';i.value=r.key;i.disabled=!r.eligible;i.onchange=render;l.prepend(i);rows.append(l,el('div'))}status.textContent='Solo preferencias válidas seleccionables. El diario y los módulos no se sobrescriben.'});
 const conflict=btn('conflict1141','Preparar copia de conflicto offline',async()=>{reset();const bp=backupPhrase.value;phrase.value=backupPhrase.value='';copy=await controller.exportConflict(bp);kind='conflict';status.textContent='Copia cifrada preparada. No se borró la rama pendiente.'});
 const review=btn('review1167','Revisar copias históricas, locales y nube',async()=>{
  reset();const oldPhrase=phrase.value,bp=backupPhrase.value;phrase.value=backupPhrase.value='';
  plan=await controller.prepareRecoveryReview({oldPhrase,backupPhrase:bp});kind='review';copy=plan.archive;
  rows.append(el('p','Revisión histórica '+plan.referenceRevision+' · nube '+plan.head+' · ancestro común no demostrado.'));
  for(const v of plan.views){
   rows.append(el('h3',v.label+' · '+v.epoch));
   for(const r of v.rows)rows.append(el('p',r.group+' / '+r.key+' · '+r.state+' · histórico: '+(r.present.reference?'sí':'no')+' · local: '+(r.present.local?'sí':'no')+' · nube: '+(r.present.cloud?'sí':'no')));
  }
  status.textContent='Comparación de solo lectura. Descargá el respaldo y volvé a seleccionarlo para verificarlo. No se aplicarán cambios.';
 });
 const save=btn('download1141','Descargar copia cifrada',()=>{check(copy,'Copia no disponible');if(kind==='review')downloadReview(copy,{document:doc});else download(copy,{document:doc,filename:kind==='conflict'?'asia-conflicto-offline.json':'asia-respaldo-previo.json'});requested=true;status.textContent='Descarga solicitada; verificá el archivo antes de confirmar.'});
 const apply=btn('confirm1141','Aplicar selección',async()=>{check(plan&&reviewed.checked,'Confirmación pendiente');const p=plan,k=kind;try{if(k==='review'){
    check(requested&&retained.checked,'Descargá y conservá el respaldo');
    const f=reviewFile.files[0];check(f&&f.size<=700e6,'Archivo de revisión inválido');
    try{const result=await p.apply({confirmed:true,savedArchive:JSON.parse(await f.text())});check(result.kind==='verified-only'&&result.verified,'Verificación incompleta');status.textContent='Respaldo verificado. No se modificaron registros.'}catch(e){try{p.cancel()}catch{}throw e}
    return;
   }if(k==='import')await p.apply({confirmed:true,sourceRetained:retained.checked,inventoryReviewed:true});else await p.apply({confirmed:true,backupSaved:requested&&retained.checked,selectedKeys:[...rows.querySelectorAll('input:checked')].map(i=>i.value)});status.textContent='Operación confirmada.'}finally{if(k==='review'){try{p.cancel()}catch{}}reset()}});
 const cancel=btn('cancel1141','Cancelar',()=>{plan?.cancel();reset();status.textContent='Operación cancelada. No se modificaron registros.'});
 function render(){const maint=controller.state==='maintenance',ready=maint&&!busy&&!controller.busy&&!controller.hasPlan&&!kind;
  imp.disabled=restore.disabled=conflict.disabled=review.disabled=!ready;reviewFile.disabled=busy||!maint||kind!=='review'||!requested;file.disabled=phrase.disabled=backupPhrase.disabled=!ready;retained.disabled=reviewed.disabled=busy||!plan;
  save.disabled=busy||!copy||!maint;apply.textContent=kind==='review'?'Verificar respaldo (sin aplicar cambios)':'Aplicar selección';apply.disabled=busy||!plan||!maint||!retained.checked||!reviewed.checked||(kind==='restore'&&(!requested||!rows.querySelector('input:checked')))||(kind==='review'&&(!requested||!reviewFile.files[0]));cancel.disabled=busy||!kind;
 }
 retained.onchange=reviewed.onchange=reviewFile.onchange=render;
 async function run(fn){if(busy)return;busy=true;render();onChange();try{const task=fn();onChange();await task}catch(e){status.textContent='No se completó: '+e.message}finally{busy=false;render();onChange()}}
 root.append(fields,rows,actions,status);anchor.append(root);render();return Object.freeze({render,remove(){check(!busy,'Operación en curso');plan?.cancel();phrase.value=backupPhrase.value='';root.remove()}});
}
