/* Asia 2027 V4.1 — Apple Health; authenticated, read-only, session memory only. */
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
 case 'step_count':if(u!=='count')return null;q=Math.round(q);break;
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
function render(){
 const d=$h('healthDay').value||date(),k=$h('healthMetric').value,n=+$h('healthRange').value;
 const grid=$h('healthCards');grid.replaceChildren();
 for(const [key,[label,unit,digits]] of Object.entries(defs)){
  const el=document.createElement('div');el.className='metric healthTile';
  const title=document.createElement('small');title.textContent=label;
  const b=document.createElement('b'),v=get(d,key);b.textContent=v===null?'—':tf(v,digits);
  const caption=document.createElement('small');caption.textContent=v===null?'Sin datos':unit;
  el.append(title,b,caption);grid.append(el);
 }
 const active=get(d,'active_energy'),basal=get(d,'basal_energy_burned');
 $h('healthTotal').textContent=active!==null&&basal!==null?tf(active+basal)+' kcal':'—';
 const seq=Array.from({length:n},(_,i)=>{let day=shift(d,i-n+1);return {day,v:get(day,k)}}),known=seq.filter(x=>x.v!==null),max=Math.max(1,...known.map(x=>x.v));
 $h('healthAverage').textContent=known.length?tf(known.reduce((a,x)=>a+x.v,0)/known.length,defs[k][2])+' '+defs[k][1]:'—';
 $h('healthCoverage').textContent=known.length+' de '+n+' días con datos · incluye la fecha seleccionada';
 const graph=$h('healthGraph');graph.replaceChildren();
 for(const point of seq){let column=document.createElement('div');column.className='healthColumn';let bar=document.createElement('div');bar.className='healthBarTrack';let fill=document.createElement('div');fill.className=point.v===null?'healthMissing':'healthBarFill';fill.style.height=point.v===null?'100%':Math.max(point.v===0?2:4,point.v/max*100)+'%';bar.append(fill);let label=document.createElement('small');label.textContent=n===7||(+point.day.slice(-2)%5===0)||point===seq.at(-1)?labelDate(point.day):'·';column.title=point.day+': '+(point.v===null?'Sin datos':tf(point.v,defs[k][2])+' '+defs[k][1]);column.append(bar,label);graph.append(column)}
 const body=$h('healthHistory');body.replaceChildren();for(const point of seq.slice().reverse()){let tr=body.insertRow();tr.insertCell().textContent=point.day;tr.insertCell().textContent=point.v===null?'—':tf(point.v,defs[k][2])+' '+defs[k][1]}
 const last=Array.from(rows.keys()).filter(x=>get(x,'vo2_max')!==null).sort().at(-1);$h('healthVo2').textContent=last?'Último VO₂ máx.: '+tf(get(last,'vo2_max'),1)+' ml/kg/min · '+last:'VO₂ máx.: todavía no hay mediciones recibidas.';
 $h('healthReadAt').textContent=lastRead?'Consulta a Cloudflare: '+new Date(lastRead).toLocaleString('es-UY')+'. Último guardado informado: '+(lastSync?new Date(lastSync).toLocaleString('es-UY'):'—')+'.':'Todavía no se consultó Cloudflare.';
}
function reset(){generation++;flight=null;rows.clear();lastRead=lastSync=0;loaded=false;$h('healthShare').checked=false;$h('healthAnalysis').replaceChildren();$h('healthRefresh').disabled=false;status('Conectá con tu clave personal para consultar Salud.');render()}
async function refreshHealth(force=false){
 if(!force&&loaded&&Date.now()-lastRead<120000)return true;
 if(flight)return flight;
 if(!window.asiaHealthHasAccess?.()){status('Configurá primero tu clave personal en Conexión con IA.');return false}
 const generationAtStart=generation;$h('healthRefresh').disabled=true;status('Consultando Cloudflare…');
 flight=(async()=>{try{const records=await window.asiaHealthGet();if(generationAtStart!==generation)return false;let next=new Map(),skipped=0,sync=0;for(const raw of records){const r=normalize(raw);if(!r){skipped++;continue}if(!next.has(r.day))next.set(r.day,{});next.get(r.day)[r.metric]=r.qty;let t=Date.parse(r.updated_at);if(Number.isFinite(t))sync=Math.max(sync,t)}rows=next;lastRead=Date.now();lastSync=sync;loaded=true;status(rows.size?`${rows.size} ${rows.size===1?'día':'días'} con datos de Salud.${skipped?' '+skipped+' registros omitidos por formato o unidad no admitida.':''}`:'No hay métricas compatibles guardadas todavía.');render();return true}catch(e){if(generationAtStart===generation)status('No se pudo consultar: '+e.message+(loaded?' · Se muestran los últimos datos consultados en esta sesión.':''));return false}finally{if(generationAtStart===generation){flight=null;$h('healthRefresh').disabled=false}}})();return flight;
}
function summaryHealth(){
 if(!loaded||!$h('healthShare').checked)return null;
 const end=date(),start=shift(end,-28),days=Array.from(rows.keys()).filter(d=>d>=start&&d<=end).sort();
 const metrics=Object.keys(defs);return {source:'Apple Health via Health Auto Export',read_at:new Date(lastRead).toISOString(),units:Object.fromEntries(metrics.map(k=>[k,defs[k][1]])),daily:days.map(d=>({date:d,...Object.fromEntries(metrics.filter(k=>get(d,k)!==null).map(k=>[k,Math.round(get(d,k)*100)/100]))})),note:'Ausencia de métrica = sin datos; hoy puede estar incompleto. Los valores de energía son estimaciones, no calorías ingeridas; no sumar ejercicio o pasos manuales a los de Salud.'};
}
window.asiaHealthRefresh=refreshHealth;window.asiaHealthReset=reset;window.asiaHealthSummary=summaryHealth;
$h('healthDay').value=date();for(const [k,[name]] of Object.entries(defs)){$h('healthMetric').add(new Option(name,k))}
for(const id of ['healthDay','healthMetric','healthRange'])$h(id).onchange=render;
$h('healthRefresh').onclick=()=>refreshHealth(true);
$h('healthSetup').onclick=()=>window.asiaOpenSettings?.();
$h('healthToday').onclick=()=>{$h('healthDay').value=date();render()};
$h('healthStepsCopy').onclick=()=>{const d=$h('day').value,v=get(d,'step_count');if(v===null)return notify('No hay pasos de Salud para la fecha del registro diario.');if($h('steps').value!==''&&!confirm('¿Reemplazar los pasos del formulario por '+tf(v)+' de Salud?'))return;$h('steps').value=String(v);notify('Pasos copiados. Guardá el día para confirmarlos.')};
$h('healthAnalyze').onclick=async()=>{if(!await refreshHealth())return;if(!rows.size)return notify('No hay datos de Salud para analizar.');if(!confirm('¿Enviar a Cloudflare y OpenAI los indicadores de Salud de los últimos 28 días y hoy? Tu proyecto tiene activado el uso compartido para mejora de modelos.'))return;const prior=$h('healthShare').checked;$h('healthShare').checked=true;const payload=summaryHealth();$h('healthShare').checked=prior;if(payload?.daily.length)window.asiaHealthAnalyze?.(payload);else notify('No hay datos recientes para analizar.')};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!$h('health').classList.contains('hide'))refreshHealth()});
render();
})();
