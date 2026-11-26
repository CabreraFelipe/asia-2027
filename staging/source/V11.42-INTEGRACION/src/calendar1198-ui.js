// Read-only manual refresh; no polling, no storage writes.
(()=>{'use strict';
const C=window.asiaCalendar1198,n=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e},panel=n('details');
panel.id='calendar1198';panel.className='card sectionfold';panel.append(n('summary','Agenda integral · 14 días'),n('p','Combina agenda clásica, PRO, Running y deporte. Registros por fecha no equivalen a sesiones cumplidas. Los eventos declarados pueden ser previstos o reales; no se suman como carga fisiológica.'));
const anchor=document.getElementById('trainCalendarV4')??document.getElementById('training');if(!anchor)return;anchor.append(panel);
const input=n('input');input.type='date';input.id='calendarStart1198';input.value=date();const label=n('label','Desde');label.htmlFor=input.id;
const button=n('button','Actualizar agenda');button.type='button';button.id='calendarRefresh1198';const status=n('p');status.setAttribute('role','status');status.id='calendarStatus1198';const body=n('div');body.id='calendarRows1198';panel.append(label,input,button,status,body);
const basis=()=>JSON.stringify([data.settings,data.running1174,data.sport1177,data.work,date(),input.value]);let loaded=null,flight=false;
function invalidate(){loaded=null;body.replaceChildren();status.textContent='Actualizá la agenda para consultar los datos vigentes.';}
function render(model){body.replaceChildren();status.textContent=model.proKnown?'Agenda PRO local consultada'+(model.proActive?' · sesión PRO activa':'')+'.':'No se pudo verificar Gym PRO. No se puede confirmar una agenda libre.';
 for(const r of model.rows){const box=n('div');box.className='history';box.append(n('strong',r.day));
  for(const x of r.planned)box.append(n('p','Previsto · '+x.kind+' · '+x.label+(x.minutes===null?'':' · '+x.minutes+' min')));
  for(const x of r.events)box.append(n('p','Evento declarado · '+x.label+' · '+x.minutes+' min'));
  for(const x of r.actual)box.append(n('p','Registros · '+x.kind+' · '+x.count));
  if(r.empty)box.append(n('p',model.proKnown?'Sin actividad visible en esta agenda; no confirma descanso.':'Sin actividad visible en las fuentes verificadas.'));
  for(const w of r.warnings)box.append(n('p',w));body.append(box);
 }
}
async function update(){if(flight)return;flight=true;button.disabled=true;try{invalidate();const before=basis();let gym=null;try{const store=typeof asiaCandidateSession!=='undefined'?asiaCandidateSession.moduleStore:null;if(store)gym=await store.read('gym')}catch{}if(before!==basis()||blocked600||localStorage.getItem(key)!==disk600)throw Error('Cambió el diario; actualizá nuevamente');const model=C.project(data,gym,input.value,date(),{R:window.asiaRunning1174,S:window.asiaSchedule829,Sport:window.asiaSport1177,G:window.asiaExtras830.goals101});loaded=before;render(model);}catch(e){body.replaceChildren();status.textContent=e.message}finally{flight=false;button.disabled=false}}
button.onclick=update;input.onchange=invalidate;panel.addEventListener('toggle',()=>{if(panel.open)update();else invalidate()});
const previous=refresh;refresh=function(){const result=previous.apply(this,arguments);if(panel.open&&loaded!==null)invalidate();return result};invalidate();
})();
