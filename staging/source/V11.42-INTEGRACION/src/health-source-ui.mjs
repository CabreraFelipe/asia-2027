// Keep the original Health page and its Apple/manual metrics. Extra sources only via a verified shell grant.
const host=document.getElementById('healthSources828'),dateInput=document.getElementById('healthDay'),grant=typeof asiaCandidateSession!=='undefined'?asiaCandidateSession.healthSources:null;
if(host&&dateInput&&grant&&typeof grant.read==='function'&&typeof grant.discard==='function'&&typeof grant.available==='function'){
 const n=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x};
 const labels={step_count:'Pasos',walking_running_distance:'Distancia',active_energy:'Energía activa',basal_energy_burned:'Energía en reposo',apple_exercise_time:'Tiempo de ejercicio',resting_heart_rate:'FC en reposo',heart_rate_variability:'VFC',vo2_max:'VO₂ máximo',sleep:'Sueño'};
 const providers={'apple-export':'Apple Salud (exportación)','healthkit':'Apple Salud (HealthKit)','health-connect':'Android Health Connect',file:'Archivo revisado'};
 const panel=n('div'),status=n('p'),out=n('div'),selects=n('div'),button=n('button','Consultar fuentes autorizadas');button.type='button';button.id='healthSourcesReadV12';status.setAttribute('role','status');panel.append(n('h3','Otras fuentes de actividad'),n('p','Lectura separada por origen. No se suma con Apple Salud ni se modifica el registro diario. Las preferencias de esta consulta no se guardan.'),button,selects,out,status);host.append(panel);
 let preferred={},generation=0,busy=false;
 function clear(){generation++;grant.discard();out.replaceChildren();selects.replaceChildren();preferred={};status.textContent='Consultá nuevamente para ver datos de esta fecha.'}
 async function read(){
  if(busy)return;busy=true;button.disabled=true;const mark=++generation,d=dateInput.value;out.replaceChildren();status.textContent='Consultando fuentes autorizadas…';
  try{if(!grant.available())throw Error('Fuentes no disponibles');const result=await grant.read({from:d,to:d,today:date(),preferred});if(mark!==generation||d!==dateInput.value||!host.open)return;
   selects.replaceChildren();for(const [metric,label] of Object.entries(labels)){const choices=result.sources.filter(s=>s.metrics.includes(metric));if(!choices.length)continue;const select=n('select'),l=n('label',label+' · fuente');select.id='healthSourceChoice-'+metric;l.htmlFor=select.id;select.add(new Option('Sin preferencia explícita',''));for(const s of choices)select.add(new Option(s.label+' · '+providers[s.provider],s.id));select.value=preferred[metric]??'';select.onchange=()=>{if(select.value)preferred[metric]=select.value;else delete preferred[metric];out.replaceChildren();status.textContent='Volvé a consultar para aplicar esta selección.'};selects.append(l,select)}
   for(const row of result.rows){const box=n('div');box.className='metric';box.append(n('small',labels[row.metric]),n('b',row.status==='available'?String(row.qty)+' '+row.units:'—'),n('small',row.status==='available'?row.label+' · '+providers[row.provider]+' · recibido '+new Date(row.updatedAt).toLocaleString('es-UY'):row.status==='choice-required'?'Hay varias fuentes: elegí una.':'Fuente preferida sin dato.'));out.append(box)}
   status.textContent=result.rows.length?'Datos de la fecha seleccionada. No se guardaron ni compartieron con IA.':'Sin datos autorizados para esta fecha.';
  }catch(e){if(mark===generation){out.replaceChildren();selects.replaceChildren();preferred={};status.textContent='No se pudo verificar la consulta. Revisá la conexión.'}}finally{busy=false;button.disabled=!grant.available()}
 }
 button.onclick=read;dateInput.addEventListener('change',clear);host.addEventListener('toggle',()=>{if(!host.open)clear()});window.addEventListener('pagehide',clear);
}
