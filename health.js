/* Asia 2027 V4.1 — Apple Health; authenticated; only daily steps are persisted, other metrics session-only. */
(() => {
'use strict';
const $h=id=>document.getElementById(id);
const defs={step_count:['Pasos','pasos',0],walking_running_distance:['Distancia','km',2],active_energy:['Energía activa','kcal',0],basal_energy_burned:['Energía en reposo','kcal',0],apple_exercise_time:['Ejercicio','min',0],resting_heart_rate:['FC en reposo','lpm',0],heart_rate_variability:['VFC','ms',1],vo2_max:['VO₂ máximo','ml/kg/min',1]};
let rows=new Map(),lastRead=0,lastSync=0,loaded=false,flight=null,generation=0;
const status=t=>$h('healthStatus').textContent=t;
const tf=(v,d=0)=>Number(v).toLocaleString('es-UY',{maximumFractionDigits:d});
const validDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
function normalize(r){
 if(!r||!Object.hasOwn(defs,r.metric)||!validDay(r.day)||typeof r.qty!=='number'||!Number.isFinite(r.qty)||r.qty<0||typeof r.units!=='string')return null;
 let q=r.qty,u=r.units.toLowerCase().replace(/\s/g,'');
 switch(r.metric){
 case 'step_count':if(u!=='count'||q>100000)return null;q=Math.round(q);break;
 case 'active_energy':case 'basal_energy_burned':if(u==='kj')q/=4.184;else if(u==='j')q/=4184;else if(u!=='kcal'&&u!=='cal')return null;else if(u==='cal')q/=1000;break;
 case 'walking_running_distance':if(u==='m')q/=1000;else if(u==='mi')q*=1.609344;else if(u!=='km')return null;break;
 case 'apple_exercise_time':if(u==='s')q/=60;else if(u==='h'||u==='hr')q*=60;else if(u!=='min')return null;break;
 case 'resting_heart_rate':if(!['count/min','bpm','lpm'].includes(u))return null;break;
 case 'heart_rate_variability':if(u==='s')q*=1000;else if(u!=='ms')return null;break;
 case 'vo2_max':if(!['ml/kg/min','ml/(kg*min)','ml/min/kg','ml/(min*kg)'].includes(u))return null;break;
 }
 return {day:r.day,metric:r.metric,qty:q,updated_at:r.updated_at};
}
function get(d,k){return rows.get(d)?.[k]??null}
// Keep the Apple total and manual fallback separate. No summing, no writes to food or exercise fields.
const stepValue881=v=>typeof v==='string'&&/^\d+(?:\.\d+)?$/.test(v.trim())?stepValue881(Number(v)):Number.isFinite(v)&&v>=0&&v<=100000?v:null;
function savedApple881(r){const a=r?.stepsApple881;return a&&Number.isInteger(a.count)&&stepValue881(a.count)!==null&&Number.isSafeInteger(a.updatedAt)&&a.updatedAt>0?{count:a.count,updatedAt:a.updatedAt}:null;}
window.asiaCleanSteps881=savedApple881;
window.asiaEffectiveSteps881=d=>{const r=data.diet[d]||{},a=savedApple881(r),m=stepValue881(r.steps);return {value:a?.count??m,source:a?'Apple Salud':m!==null?'Registro manual':'Sin datos',updatedAt:a?.updatedAt??null};};
let stepSync881='Todavía no se consultaron los pasos.';
function renderSteps881(){const d=$h('day').value,x=window.asiaEffectiveSteps881(d),e=$h('dailySteps881');if(e)e.textContent='Pasos del día: '+(x.value===null?'—':tf(x.value))+' · '+x.source+(x.updatedAt?' · recibido '+new Date(x.updatedAt).toLocaleString('es-UY'):'')+(d===date()?' · hoy puede ser parcial':'');const s=$h('stepsSync881');if(s)s.textContent=stepSync881;}
window.asiaRenderSteps881=renderSteps881;
function storeSteps881(next){const today=date(),changes=[];
 for(const [d,a] of next){if(!validDay(d)||d>today)continue;const old=data.diet[d],prior=savedApple881(old);if(prior&&prior.updatedAt>=a.updatedAt)continue;changes.push([d,old,a]);}
 if(!changes.length){stepSync881=next.size?'Pasos al día. Se conservan los datos guardados.':'No se recibieron pasos válidos; se conservan los registros.';renderSteps881();return;}
 if(blocked600||localStorage.getItem(key)!==disk600){stepSync881='No se guardaron los pasos: el diario cambió en otra ventana o requiere recuperación. Recargá antes de sincronizar.';renderSteps881();return;}
 for(const [d,old,a] of changes)data.diet[d]={...old,stepsApple881:a};
 if(!persist()){for(const [d,old] of changes){if(old)data.diet[d]=old;else delete data.diet[d];}stepSync881='No se pudieron guardar los pasos. Se conservan los registros anteriores.';}
 else stepSync881=changes.length+' '+(changes.length===1?'día actualizado':'días actualizados')+' automáticamente · '+new Date().toLocaleString('es-UY');
 renderSteps881();
}
// V8.5.5: descriptive comparisons on closed days. Read-only, no new requests.
const descriptors855=[['hrv','VFC','ms',1],['restingHR','FC en reposo','lpm',1],['sleep','Sueño registrado','h',1],['steps','Pasos · Apple Salud','pasos',0],['series','Series efectivas · Gym','series',0]];
const number855=(v,min,max)=>{if(typeof v==='string'&&/^\d+(?:\.\d+)?$/.test(v.trim()))v=Number(v);return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:null;};
function buildRecovery855(reference){
 if(!validDay(reference)||reference>date())return null;
 const from=shift(reference,-14),end=shift(reference,-1),counts=new Map();
 for(const [k,w] of Object.entries(data.work||{})){
  const d=k.slice(0,10);if(!validDay(d)||d<from||d>end||!window.asiaGym826?.slotOK(k,data.settings))continue;
  let n=0;for(const sets of Object.values(w?.ex||{}))if(Array.isArray(sets))for(const a of sets)if(a?.done===true&&typeof a.kg==='number'&&number855(a.kg,0,1000)!==null&&Number.isInteger(a.reps)&&a.reps>=1&&a.reps<=100)n++;
  if(n)counts.set(d,(counts.get(d)||0)+n);
 }
 const days=Array.from({length:14},(_,i)=>{const day=shift(from,i);return {day,hrv:number855(get(day,'heart_rate_variability'),0.000001,Infinity),restingHR:number855(get(day,'resting_heart_rate'),0.000001,Infinity),sleep:number855(data.diet?.[day]?.sleep,0,24),steps:number855(get(day,'step_count'),0,Infinity),series:counts.get(day)??null};});
 const summary=(seq,k)=>{const values=seq.map(x=>x[k]).filter(x=>x!==null);return {n:values.length,value:values.length?values.reduce((a,b)=>a+b,0)/(k==='series'?1:values.length):null};};
 return {days,metrics:descriptors855.map(([key,label,unit,digits])=>({key,label,unit,digits,prior:summary(days.slice(0,7),key),recent:summary(days.slice(7),key)}))};
}
function renderRecovery855(){
 const panel=$h('healthRecovery855');if(!panel)return;
 const cards=$h('healthRecoveryCards855'),tbody=$h('healthRecoveryDays855'),status=$h('healthRecoveryDates855');cards.replaceChildren();tbody.replaceChildren();
 const report=buildRecovery855($h('healthDay').value);if(!report){status.textContent='Elegí una fecha válida hasta hoy.';return;}
 const {days,metrics}=report;status.textContent=`${labelDate(days[7].day)}–${labelDate(days[13].day)} vs. ${labelDate(days[0].day)}–${labelDate(days[6].day)} · 7 días cerrados por período. Excluye la fecha elegida.`;
 const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 for(const {key,label,unit,digits,prior,recent} of metrics){const box=node('div',undefined,'metric healthCompare855');box.dataset.metric=key;const shown=x=>x.value===null?'—':tf(x.value,digits)+' '+unit;box.append(node('small',label),node('b',shown(recent)),node('small',`Anterior: ${shown(prior)}`),node('small',`${recent.n}/7 días · anterior ${prior.n}/7`));cards.append(box);}
 for(const d of days.slice(7).reverse()){const tr=tbody.insertRow();tr.insertCell().textContent=labelDate(d.day);for(const {key,digits} of metrics)tr.insertCell().textContent=d[key]===null?'—':tf(d[key],digits);}
}
const historyCard=$h('healthHistory').closest('.card');
const panel855=document.createElement('details');panel855.id='healthRecovery855';panel855.className='gymMini571';panel855.innerHTML=`<summary>Recuperación · últimas dos semanas</summary><p class="meta" id="healthRecoveryDates855"></p><div class="grid" id="healthRecoveryCards855"></div><details><summary>Ver descanso y carga por día</summary><div class="scroll"><table class="v4table"><thead><tr><th>Fecha</th><th>VFC (ms)</th><th>FC (lpm)</th><th>Sueño (h)</th><th>Pasos</th><th>Series</th></tr></thead><tbody id="healthRecoveryDays855"></tbody></table></div></details><details><summary>Cómo interpretar los datos</summary><p class="tiny">Promedios de los días registrados; series efectivas = suma de series de Gym guardadas y válidas. Los días sin datos no son cero ni descanso confirmado. El sueño proviene del registro manual, no del Apple Watch. Las métricas de Apple Salud corresponden a la última consulta de esta sesión. No se suman pasos manuales ni entrenamientos de Apple Watch a las series de Gym. VFC y frecuencia cardíaca varían por múltiples factores; la coincidencia temporal no demuestra causalidad ni confirma aptitud para entrenar. No se calcula un puntaje clínico.</p></details>`;
historyCard.append(panel855);panel855.addEventListener('toggle',()=>{if(panel855.open)renderRecovery855()});
function render(){
 const d=$h('healthDay').value||date(),k=$h('healthMetric').value,n=+$h('healthRange').value;
 const grid=$h('healthCards');grid.replaceChildren();
 for(const [key,[label,unit,digits]] of Object.entries(defs)){
  const el=document.createElement('div');el.className='metric healthTile';
  const title=document.createElement('small');title.textContent=label;
  const b=document.createElement('b'),v=get(d,key);b.textContent=v===null?'—':tf(v,digits);
  el.classList.toggle('noData573',v===null); const caption=document.createElement('small');caption.textContent=v===null?'Sin datos':unit;
  el.append(title,b,caption);grid.append(el);
 }
 const active=get(d,'active_energy'),basal=get(d,'basal_energy_burned');
 $h('healthTotal').textContent=active!==null&&basal!==null?tf(active+basal)+' kcal':'—';
 const seq=Array.from({length:n},(_,i)=>{let day=shift(d,i-n+1);return {day,v:get(day,k)}}),known=seq.filter(x=>x.v!==null),max=Math.max(1,...known.map(x=>x.v));
 $h('healthAverage').textContent=known.length?tf(known.reduce((a,x)=>a+x.v,0)/known.length,defs[k][2])+' '+defs[k][1]:'—';
 $h('healthCoverage').textContent=known.length+' de '+n+' días con datos';
 const graph=$h('healthGraph');graph.replaceChildren();
 for(const point of seq){let column=document.createElement('div');column.className='healthColumn';let bar=document.createElement('div');bar.className='healthBarTrack';let fill=document.createElement('div');fill.className=point.v===null?'healthMissing':'healthBarFill';fill.style.height=point.v===null?'100%':Math.max(point.v===0?2:4,point.v/max*100)+'%';bar.append(fill);let label=document.createElement('small');label.textContent=n===7||(+point.day.slice(-2)%5===0)||point===seq.at(-1)?labelDate(point.day):'·';column.title=point.day+': '+(point.v===null?'Sin datos':tf(point.v,defs[k][2])+' '+defs[k][1]);column.append(bar,label);graph.append(column)}
 const body=$h('healthHistory');body.replaceChildren();for(const point of seq.slice().reverse()){let tr=body.insertRow();tr.insertCell().textContent=point.day;tr.insertCell().textContent=point.v===null?'—':tf(point.v,defs[k][2])+' '+defs[k][1]}
 const last=Array.from(rows.keys()).filter(x=>get(x,'vo2_max')!==null).sort().at(-1);$h('healthVo2').textContent=last?'Último VO₂ máx.: '+tf(get(last,'vo2_max'),1)+' ml/kg/min · '+last:'VO₂ máx.: todavía no hay mediciones recibidas.';
 $h('healthReadAt').textContent=lastRead?'Consultado: '+new Date(lastRead).toLocaleString('es-UY')+' · Último guardado: '+(lastSync?new Date(lastSync).toLocaleString('es-UY'):'—')+'.':'Todavía no se consultó Cloudflare.';window.asiaRenderHome42?.();renderRecovery855();
}
function reset(){generation++;flight=null;rows.clear();lastRead=lastSync=0;loaded=false;stepSync881='Conexión reiniciada. Se conservan los pasos guardados; no se recibirán nuevos datos hasta reconectar.';renderSteps881();$h('healthShare').checked=false;$h('healthAnalysis').replaceChildren();$h('healthRefresh').disabled=false;status('Conectá con tu clave personal para consultar Salud.');render()}
async function refreshHealth(force=false){
 if(!force&&loaded&&Date.now()-lastRead<120000){renderRecovery855();return true;}
 if(flight)return flight;
 if(!window.asiaHealthHasAccess?.()){status('Configurá primero tu clave personal en Conexión con IA.');return false}
 const generationAtStart=generation;$h('healthRefresh').disabled=true;status('Consultando Cloudflare…');
 flight=(async()=>{try{const records=await window.asiaHealthGet();if(generationAtStart!==generation)return false;let next=new Map(),steps881=new Map(),skipped=0,sync=0;for(const raw of records){const r=normalize(raw);if(!r){skipped++;continue}if(!next.has(r.day))next.set(r.day,{});next.get(r.day)[r.metric]=r.qty;let t=Date.parse(r.updated_at);if(Number.isFinite(t))sync=Math.max(sync,t);if(r.metric==='step_count'&&r.day<=date()&&Number.isSafeInteger(t)&&t>0&&(!steps881.has(r.day)||t>steps881.get(r.day).updatedAt))steps881.set(r.day,{count:r.qty,updatedAt:t})}rows=next;lastRead=Date.now();lastSync=sync;loaded=true;storeSteps881(steps881);status(rows.size?`${rows.size} ${rows.size===1?'día':'días'} con datos de Salud.${skipped?' '+skipped+' registros omitidos por formato o unidad no admitida.':''}`:'No hay métricas compatibles guardadas todavía.');render();return true}catch(e){if(generationAtStart===generation){status('No se pudo consultar: '+e.message+(loaded?' · Se muestran los últimos datos consultados en esta sesión.':''));stepSync881='No se pudo actualizar. Se conservan los pasos guardados.';renderSteps881();}return false}finally{if(generationAtStart===generation){flight=null;$h('healthRefresh').disabled=false}}})();return flight;
}
function summaryHealth(){
 if(!loaded||!$h('healthShare').checked)return null;
 const end=date(),start=shift(end,-28),days=Array.from(rows.keys()).filter(d=>d>=start&&d<=end).sort();
 const metrics=Object.keys(defs);return {source:'Apple Health via Health Auto Export',read_at:new Date(lastRead).toISOString(),units:Object.fromEntries(metrics.map(k=>[k,defs[k][1]])),daily:days.map(d=>({date:d,...Object.fromEntries(metrics.filter(k=>get(d,k)!==null).map(k=>[k,Math.round(get(d,k)*100)/100]))})),note:'Ausencia de métrica = sin datos; hoy puede estar incompleto. Los valores de energía son estimaciones, no calorías ingeridas; no sumar ejercicio o pasos manuales a los de Salud.'};
}
window.asiaHealthDay42=d=>({steps:get(d,'step_count'),active:get(d,'active_energy'),basal:get(d,'basal_energy_burned'),distance:get(d,'walking_running_distance'),exercise:get(d,'apple_exercise_time'),hrv:get(d,'heart_rate_variability'),restingHR:get(d,'resting_heart_rate'),readAt:lastRead,syncAt:lastSync});window.asiaHealthDates54=()=>Array.from(rows.keys());window.asiaHealthRefresh=refreshHealth;window.asiaHealthReset=reset;window.asiaHealthSummary=summaryHealth;
$h('healthDay').value=date();for(const [k,[name]] of Object.entries(defs)){$h('healthMetric').add(new Option(name,k))}
for(const id of ['healthDay','healthMetric','healthRange'])$h(id).onchange=render;
$h('healthRefresh').onclick=()=>refreshHealth(true);
$h('healthSetup').onclick=()=>window.asiaOpenSettings?.();
$h('healthToday').onclick=()=>{$h('healthDay').value=date();render()};
$h('healthStepsCopy').onclick=()=>refreshHealth(true);
$h('healthAnalyze').onclick=async()=>{if(!await refreshHealth())return;if(!rows.size)return notify('No hay datos de Salud para analizar.');if(!confirm('¿Enviar a Cloudflare y OpenAI los indicadores de Salud de los últimos 28 días y hoy? Tu proyecto tiene activado el uso compartido para mejora de modelos.'))return;const prior=$h('healthShare').checked;$h('healthShare').checked=true;const payload=summaryHealth();$h('healthShare').checked=prior;if(payload?.daily.length)window.asiaHealthAnalyze?.(payload);else notify('No hay datos recientes para analizar.')};
// Read on return to any tab and every five minutes only while visible. Reuse the existing flight/cache.
let timer881=null;
function foreground881(){clearTimeout(timer881);timer881=null;if(document.hidden)return;if(window.asiaHealthHasAccess?.())refreshHealth();timer881=setTimeout(foreground881,300000);}
document.addEventListener('visibilitychange',foreground881);window.addEventListener('online',foreground881);window.addEventListener('pageshow',foreground881);timer881=setTimeout(foreground881,300000);
render();
})();
