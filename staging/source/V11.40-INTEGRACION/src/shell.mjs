// Small maintenance shell for synthetic candidate. No automatic sync/import or deletion.
import {downloadEncryptedCopy} from '../../V11.32-INTEGRACION/src/download.mjs';
export function mountShell({doc,anchor,controller,download=downloadEncryptedCopy,onRender=()=>{}}){
 const el=(tag,text,id)=>{const n=doc.createElement(tag);if(text)n.textContent=text;if(id)n.id=id;return n};
 const root=el('section',null,'shell1140'),status=el('p',null,'status1140');status.setAttribute('role','status');
 const syncStatus=el('p',null,'syncStatus1170');syncStatus.setAttribute('role','status');
 const message=el('p',null,'message1140'),actions=el('div'),preview=el('div');let plan=null,busy=false,requested=false;
 const btn=(id,text,fn)=>{const b=el('button',text,id);b.type='button';b.onclick=()=>run(fn);actions.append(b);return b};
 const open=btn('open1140','Abrir diario',()=>controller.openDiary()),close=btn('close1140','Guardar y cerrar diario',()=>controller.closeDiary());
 function showSync(result){
  message.textContent=result.kind==='synced'?'Sincronización confirmada · revisión '+result.remoteRevision:result.kind==='empty'?'Sin registros para sincronizar.':'Revisión manual necesaria. No se sustituyeron registros locales.';
 }
 const saveSync=btn('saveSync1170','Guardar y sincronizar',async()=>showSync(await controller.saveAndSync()));
 const retry=btn('retrySync1170','Reintentar sincronización segura',async()=>showSync(await controller.retryManagedSync()));
 const onOnline=()=>{if(!busy&&controller.canRetrySync)run(async()=>showSync(await controller.retryManagedSync()))};
 doc.defaultView?.addEventListener?.('online',onOnline);
 const reconcile=btn('reconcile1140','Conciliar cambios locales',()=>controller.reconcile(true));
 const sync=btn('sync1140','Comparar con nube',async()=>{plan=await controller.prepareSync();requested=false;preview.textContent='Comparación: '+plan.kind;});
 const downloadButton=btn('backup1140','Descargar respaldo previo',()=>{download(plan.backup,{document:doc,filename:'asia-respaldo-previo-sync.json'});requested=true;message.textContent='Descarga solicitada; verificá que el archivo se haya guardado.'});
 const apply=btn('apply1140','Confirmar sincronización',async()=>{if(plan.backup&&!doc.defaultView.confirm('¿Confirmás que guardaste el respaldo cifrado?'))return;const p=plan;try{await p.apply({confirmed:true,backupSaved:requested});message.textContent='Sincronización confirmada.'}finally{plan=null;preview.textContent='';requested=false}});
 const cancel=btn('cancel1140','Cancelar comparación',()=>{plan.cancel();plan=null;preview.textContent='';requested=false});
 const logout=btn('logout1140','Cerrar sesión',()=>controller.logout());
 const unlock=btn('unlock1172','Volver a verificar acceso',()=>doc.defaultView.location.reload());
 function render(){const state=controller.state;status.textContent=state==='editing'?'Diario abierto · '+(controller.status?.phase??''):state==='maintenance'?(controller.recoveryOnly?'Modo exclusivo de recuperación':'Modo mantenimiento'):state==='locked'?'Sesión bloqueada':'Sesión cerrada';
  const ready=!busy&&state==='maintenance'&&!plan&&!controller.hasPlan&&!controller.busy;open.disabled=reconcile.disabled=sync.disabled=!ready||controller.recoveryOnly===true;logout.disabled=!ready;unlock.hidden=state!=='locked';unlock.disabled=busy||controller.busy||state!=='locked';close.disabled=busy||state!=='editing';saveSync.hidden=controller.canManagedSync!==true;saveSync.disabled=busy||controller.busy||controller.hasPlan||!['editing','maintenance'].includes(state)||!controller.canManagedSync;retry.hidden=controller.canManagedSync!==true||controller.syncState?.kind!=='retry-required';retry.disabled=busy||!controller.canRetrySync;
  const ss=controller.syncState;syncStatus.textContent=ss?.kind==='synced'?'Última sincronización confirmada: revisión '+ss.remoteRevision:ss?.kind==='retry-required'?'Sincronización no confirmada; conservá la copia local. Reintento seguro al volver la conexión.':ss?.kind==='review-required'?'Hay cambios que necesitan revisión manual.':'';downloadButton.disabled=busy||state!=='maintenance'||!plan?.backup;apply.disabled=busy||state!=='maintenance'||!plan||!['equal','push','pull'].includes(plan.kind)||!!plan.backup&&!requested;cancel.disabled=busy||!plan;onRender();
 }
 async function run(fn){if(busy)return;busy=true;message.textContent='';render();try{await fn()}catch(e){message.textContent='No se completó: '+e.message}finally{busy=false;render()}}
 root.append(el('h1','Asia 2027 · candidato sintético'),el('p','Solo pruebas. No ingreses registros personales.'),status,actions,preview,syncStatus,message);anchor.append(root);render();return {render,remove(){doc.defaultView?.removeEventListener?.('online',onOnline);if(plan)plan.cancel();root.remove()}};
}
