// Native diary UI. No direct network, no automatic save, no synthetic inference fallback.
(()=>{'use strict';
const D=window.asiaImportedDiet,G=window.asiaDocumentPlan,Gym=window.asiaGym826,P=window.asiaCoachPersist1184;
if(!D||!G||!Gym||!P)return;
const session=typeof asiaCandidateSession!=='undefined'?asiaCandidateSession:null;
const grant=session?.coachSyntheticOnly===true?null:session?.documentImport;
const allowed=()=>grant?.mode==='provider'&&typeof grant.analyze==='function'&&typeof grant.discard==='function'&&grant.available?.()===true;
const n=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e},check=(x,m)=>{if(!x)throw Error(m)};
const labels=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const statusLabels={followed:'Cumplida',partial:'Parcial',skipped:'No realizada'};
const current=()=>check(!blocked600&&localStorage.getItem(key)===disk600,'El diario cambió. Volvé a abrirlo.');
let busy=false;
async function save(kind,proposal,expected){current();await P.review(kind,proposal);return P.apply(kind,proposal,expected)}
function button(parent,text,fn){const b=n('button',text);b.type='button';b.onclick=fn;parent.append(b);return b}
function field(parent,label,value,change,type='text'){const l=n('label',label),x=n('input');x.type=type;x.value=value??'';x.onchange=()=>change(x.value);l.append(x);parent.append(l);return x}
function select(parent,label,options,value,change){const l=n('label',label),x=n('select');for(const [v,t] of options)x.add(new Option(t,v));x.value=value??'';x.onchange=()=>change(x.value);l.append(x);parent.append(l);return x}
function mount(kind,host){
 if(!host)return;
 const panel=n('details'),status=n('p'),editor=n('div'),file=n('input'),consent=n('input'),cl=n('label','Autorizo enviar este archivo al proveedor de IA para analizarlo.');
 panel.className='card sectionfold';panel.id=kind==='diet'?'documentDietImportV12':'documentRoutineImportV12';status.setAttribute('role','status');
 file.type='file';file.accept='application/pdf,image/jpeg,image/png';consent.type='checkbox';cl.prepend(consent);
 panel.append(n('summary',kind==='diet'?'Importar mi dieta (PDF o foto)':'Importar mi rutina (PDF o foto)'),n('p','Revisá el resultado antes de guardarlo. No se modifican metas ni registros anteriores. El archivo puede contener datos privados: quitá los identificadores innecesarios antes de enviarlo.'),file,cl);
 let draft=null,generation=0,originDiary=null;
 function reset(){generation++;grant?.discard?.();draft=null;originDiary=null;file.value='';consent.checked=false;editor.replaceChildren();}
 const analyze=button(panel,'Analizar archivo',async()=>{
  if(busy)return;busy=true;analyze.disabled=true;const mark=++generation,selected=file.files?.[0];draft=null;editor.replaceChildren();status.textContent='Analizando documento…';
  try{current();check(allowed()&&consent.checked&&selected&&selected.size<=10*1024*1024,'Seleccioná un archivo válido y autorizá su análisis.');
   const original=disk600,bytes=new Uint8Array(await selected.arrayBuffer());let result;
   try{result=await grant.analyze({mime:selected.type,bytes},true)}finally{bytes.fill(0)}
   if(mark!==generation||!panel.open)return;current();check(original===disk600,'El diario cambió durante el análisis.');check(result.kind===kind,'El archivo corresponde a otra sección.');draft=G.validateExtractedPlan(result);originDiary=original;render();status.textContent='Revisá cada dato antes de guardar.';
  }catch(e){if(mark===generation)status.textContent='No se pudo completar el análisis. Revisá el archivo y la conexión.'}
  finally{busy=false;analyze.disabled=!allowed();file.value='';consent.checked=false}
 });
 button(panel,'Descartar borrador',()=>{reset();status.textContent='Borrador descartado.'});
 panel.append(editor,status);host.append(panel);
 analyze.disabled=!allowed();file.disabled=!allowed();consent.disabled=!allowed();if(!allowed())status.textContent='La importación por IA todavía no está habilitada para esta cuenta.';
 file.onchange=()=>{generation++;grant?.discard?.();draft=null;originDiary=null;consent.checked=false;editor.replaceChildren()};
 panel.addEventListener('toggle',()=>{if(!panel.open)reset()});window.addEventListener('pagehide',reset);
 function render(){
  editor.replaceChildren();const d=draft;if(!d)return;
  field(editor,'Nombre del plan',d.name,v=>d.name=v);
  field(editor,'Indicaciones originales (revisar)',d.notes,v=>d.notes=v.trim()||null);
  for(const issue of d.uncertainties)editor.append(n('p','Revisar: '+issue));
  if(d.uncertainties.length){const l=n('label','Revisé las incertidumbres y corregí los datos.'),c=n('input');c.type='checkbox';c.onchange=()=>{if(c.checked)d.uncertainties=[]};l.prepend(c);editor.append(l)}
  d.days.forEach(day=>{
   const box=n('details');box.open=true;box.append(n('summary',day.label));field(box,'Nombre del día',day.label,v=>day.label=v);
   select(box,'Día de semana',[['','Sin día específico'],...labels.map((l,i)=>[String(i),l])],day.weekday===null?'':String(day.weekday),v=>day.weekday=v===''?null:Number(v));
   for(const section of day.sections){field(box,'Comida o sección',section.label,v=>section.label=v);
    for(const option of section.alternatives??[{items:section.items}]){
     if(option.label!==undefined)field(box,'Alternativa',option.label,v=>option.label=v);
     for(const item of option.items){const row=n('div');row.append(n('small','Texto de origen: '+item.source));field(row,kind==='diet'?'Alimento':'Ejercicio',item.name,v=>item.name=v);
      if(kind==='diet')field(row,'Cantidad (vacío = no indicada)',item.quantity,v=>item.quantity=v.trim()||null);
      else for(const [k,t] of [['sets','Series'],['min','Repeticiones mínimas'],['max','Repeticiones máximas'],['rest','Descanso en segundos']])field(row,t,item[k],v=>item[k]=v===''?null:Number(v),'number');
      box.append(row)
     }
    }
   }editor.append(box)
  });
  const config={start:date(),end:date(),dayMap:Array(7).fill(null)};
  if(kind==='diet'){
   field(editor,'Inicio',config.start,v=>config.start=v,'date');field(editor,'Fin',config.end,v=>config.end=v,'date');
   for(let w=0;w<7;w++){const ix=d.days.findIndex(x=>x.weekday===w);config.dayMap[w]=ix<0?null:ix;select(editor,labels[w],[['','Sin plan'],...d.days.map((x,i)=>[String(i),x.label])],ix<0?'':String(ix),v=>config.dayMap[w]=v===''?null:Number(v))}
  }
  button(editor,'Revisar y guardar',async()=>{if(busy)return;busy=true;try{current();check(originDiary===disk600,'Cambió el diario. Analizá nuevamente.');const reviewed=G.validateExtractedPlan(d);let proposal,next,operation;
   if(kind==='diet'){const id='dietplan-'+crypto.randomUUID().replaceAll('-','');proposal=D.reviewDietPlan(data.importedDietV12,reviewed,{id,...config},date());next={...data,importedDietV12:D.applyDietPlan(data.importedDietV12,proposal,date(),{confirmed:true})};operation='documentDiet'}
   else{proposal=G.reviewNativeRoutines(data,reviewed,Gym);next=G.applyNativeRoutines(data,proposal,Gym,{confirmed:true});operation='documentRoutine'}
   if(!confirm(kind==='diet'?'¿Guardar el menú y calendario revisados sin cambiar tus objetivos?':'¿Guardar las nuevas plantillas Gym sin modificar las existentes?'))return;
   await save(operation,proposal,next);reset();status.textContent='Guardado local verificado. La sincronización se realiza por separado.';window.asiaImportedDietRefresh?.();refresh();
  }catch(e){status.textContent=e.message||'No se pudo guardar.'}finally{busy=false}});
 }
}
mount('diet',document.getElementById('diet'));mount('routine',document.getElementById('training'));
const host=document.getElementById('diet');if(!host)return;
const panel=n('details'),content=n('div'),status=n('p'),dateInput=n('input');panel.id='importedDietTrackingV12';panel.className='card sectionfold';dateInput.type='date';dateInput.value=date();status.setAttribute('role','status');panel.append(n('summary','Mi dieta importada · seguimiento'),dateInput,content,status);host.append(panel);
function render(){
 content.replaceChildren();try{current();const today=date(),d=D.dietDay(data.importedDietV12,dateInput.value);if(!d){content.append(n('p','No hay dieta importada para esta fecha.'));return}
 content.append(n('h3',d.name));if(d.notes)content.append(n('p',d.notes));
 for(const meal of d.meals){const box=n('div');box.append(n('h4',meal.label));for(const [i,a] of meal.alternatives.entries())box.append(n('p',a.label+': '+a.items.map(x=>x.name+' · '+(x.quantity??'cantidad no indicada')).join(' + ')));
 let choice=meal.log?.choice??0,state=meal.log?.status??'followed';select(box,'Alternativa',meal.alternatives.map((a,i)=>[String(i),a.label]),String(choice),v=>choice=Number(v));select(box,'Cumplimiento',Object.entries(statusLabels),state,v=>state=v);
 button(box,'Registrar cumplimiento',async()=>{if(busy)return;busy=true;try{current();const b=D.validateDietPlanBook(data.importedDietV12),entry={planId:d.planId,day:d.day,meal:meal.index,choice:state==='skipped'?null:choice,status:state},nextBook=D.recordDietMeal(b,entry,date(),{confirmed:true}),p={basis:JSON.stringify(b),entry,view:D.dietDay(nextBook,d.day)};await save('documentDietLog',p,{...data,importedDietV12:nextBook});status.textContent='Cumplimiento guardado. No se registró una ingesta automáticamente.';render()}catch(e){status.textContent=e.message}finally{busy=false}});
 if(meal.log)box.append(n('p','Registrado: '+statusLabels[meal.log.status]));content.append(box)
 }
 if(d.day<=today){const r=D.dietAdherence(data.importedDietV12,d.day,d.day,today);content.append(n('p','Registradas: '+r.recorded+'/'+r.scheduled+' · Cumplidas: '+r.followed+' · Parciales: '+r.partial+' · No realizadas: '+r.skipped))}
 }catch(e){status.textContent=e.message}}
 dateInput.onchange=render;panel.addEventListener('toggle',()=>{if(panel.open)render()});window.asiaImportedDietRefresh=()=>{if(panel.open)render()};
})();
