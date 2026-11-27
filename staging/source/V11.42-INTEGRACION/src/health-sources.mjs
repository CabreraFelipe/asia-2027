// Daily health aggregates only. Read-only projection of authorized, already normalized source records.
// No provider access, no persistence, no inferred zeros, no conversion of Android into Apple history.
const check=(v,m)=>{if(!v)throw Error(m)},exact=(x,ks)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k));
const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const sourceId=x=>typeof x==='string'&&/^health_[a-f0-9]{32}$/.test(x);
const providers=Object.freeze(['apple-export','healthkit','health-connect','file']);
const spec=Object.freeze({step_count:['count',100000],walking_running_distance:['km',300],active_energy:['kcal',15000],basal_energy_burned:['kcal',10000],apple_exercise_time:['min',1440],resting_heart_rate:['bpm',250],heart_rate_variability:['ms',1000],vo2_max:['ml/kg/min',150],sleep:['h',24]});
const metric=x=>typeof x==='string'&&Object.hasOwn(spec,x),integer=x=>Number.isSafeInteger(x)&&x>0;
export function projectHealthSources({sources,records,preferred={},from,to,today}){
 check(day(from)&&day(to)&&day(today)&&from<=to&&to<=today&&(Date.parse(to)-Date.parse(from))/86400000<=366,'Período inválido');
 check(Array.isArray(sources)&&sources.length<=20&&Array.isArray(records)&&records.length<=30000,'Fuentes fuera de límites');
 const map=new Map();
 for(const s of sources){check(exact(s,['id','provider','status','metrics','label'])&&sourceId(s.id)&&!map.has(s.id)&&providers.includes(s.provider)&&['active','revoked'].includes(s.status)&&typeof s.label==='string'&&s.label.trim()===s.label&&s.label.length>=1&&s.label.length<=80&&Array.isArray(s.metrics)&&s.metrics.length<=Object.keys(spec).length&&s.metrics.every(metric)&&new Set(s.metrics).size===s.metrics.length,'Fuente inválida');map.set(s.id,s)}
 check(preferred&&typeof preferred==='object'&&!Array.isArray(preferred)&&Object.entries(preferred).every(([k,v])=>metric(k)&&map.has(v)),'Preferencias inválidas');
 const latest=new Map();
 for(const r of records){
  check(exact(r,['sourceId','day','metric','qty','units','revision','updatedAt'])&&map.has(r.sourceId)&&day(r.day)&&r.day<=today&&metric(r.metric)&&r.units===spec[r.metric][0]&&typeof r.qty==='number'&&Number.isFinite(r.qty)&&r.qty>=0&&r.qty<=spec[r.metric][1]&&integer(r.revision)&&integer(r.updatedAt),'Registro de salud inválido');
  if(r.metric==='step_count')check(Number.isInteger(r.qty),'Pasos no enteros');
  const s=map.get(r.sourceId);if(s.status!=='active'||!s.metrics.includes(r.metric)||r.day<from||r.day>to)continue;
  const k=JSON.stringify([r.sourceId,r.day,r.metric]),old=latest.get(k);
  if(old&&old.revision===r.revision)check(old.qty===r.qty&&old.updatedAt===r.updatedAt,'Revisión de salud contradictoria');
  if(!old||old.revision<r.revision)latest.set(k,r);
 }
 const groups=new Map();
 for(const r of latest.values()){const k=r.day+'|'+r.metric;const l=groups.get(k)??[];l.push(r);groups.set(k,l)}
 const rows=[];
 for(const [k,l] of [...groups].sort(([a],[b])=>a.localeCompare(b))){
  const m=l[0].metric,p=preferred[m],selected=p?l.find(x=>x.sourceId===p):l.length===1?l[0]:null;
  if(!selected){rows.push({day:l[0].day,metric:m,status:p?'preferred-missing':'choice-required',qty:null,units:spec[m][0],sources:l.map(x=>x.sourceId).sort()});continue}
  const s=map.get(selected.sourceId);
  rows.push({day:selected.day,metric:m,status:'available',qty:selected.qty,units:selected.units,sourceId:s.id,provider:s.provider,label:s.label,updatedAt:selected.updatedAt,revision:selected.revision});
 }
 return rows;
}
// Existing Apple adapter may only consume rows proven to originate from Apple.
// Other sources stay explicitly labeled and must use the generic rendering path.
export function appleLegacyRows(rows){
 check(Array.isArray(rows),'Filas inválidas');
 return rows.filter(r=>r.status==='available'&&['apple-export','healthkit'].includes(r.provider)&&r.metric!=='sleep').map(r=>({day:r.day,metric:r.metric,qty:r.qty,units:r.units,updated_at:new Date(r.updatedAt).toISOString()}));
}
