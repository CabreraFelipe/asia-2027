// Read-only integrated calendar. Counts records, never infers completion or physiological recovery.
(function(root){'use strict';
const check=(v,m)=>{if(!v)throw Error(m)},day=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&d>='1900-01-01'&&d<='2199-12-31'&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d,add=(d,n)=>new Date(Date.parse(d)+n*86400000).toISOString().slice(0,10),obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function project(data,gym,start,today,api,count=14){
 check(day(start)&&day(today)&&Number.isInteger(count)&&count>=1&&count<=42&&day(add(start,count)),'Período de agenda inválido');
 const {R,S,Sport,G}=api,g=G(data.settings?.goals101),run=R.validate(data.running1174,g),sport=Sport.validate(data.sport1177,g);
 const running=R.effectiveRows(run),sports=Sport.effective(sport),plans=[],records=[];
 let proKnown=false,proActive=false;
 if(gym&&Number.isSafeInteger(gym.revision)&&gym.revision>=0){
  if(gym.revision===0){proKnown=true;}
  else if(obj(gym.payload)&&Array.isArray(gym.payload.planned)&&Array.isArray(gym.payload.sessions)&&Object.hasOwn(gym.payload,'active')&&[...gym.payload.planned,...gym.payload.sessions].every(r=>obj(r)&&day(r.date))){
   proKnown=true;proActive=!!gym.payload.active;
   plans.push(...gym.payload.planned);records.push(...gym.payload.sessions);
  }
 }
 const out=[];
 for(let d=add(start,-1);d<=add(start,count);d=add(d,1)){
  const planned=[],actual=[],events=[];
  const classic=S.planned(d,data.settings);if(classic!==null)planned.push({kind:'Gym clásico',label:'Rutina prevista',minutes:null,quality:false});
  for(const r of running.filter(x=>x.day===d))planned.push({kind:'Running',label:r.type,minutes:r.minutes,quality:R.isQuality(r)});
  for(const r of sports.filter(x=>x.day===d))planned.push({kind:'Deporte',label:'Sesión deportiva',minutes:r.minutes,quality:r.drills.some(x=>Sport.find(x.exerciseId).impact==='moderada')});
  for(const r of plans.filter(x=>x.date===d))planned.push({kind:'Gym PRO',label:'Rutina prevista',minutes:null,quality:false});
  for(const e of Sport.eventsOn(sport,d))events.push({kind:'Evento deportivo',label:e.type,minutes:e.minutes});
  const classicCount=Object.keys(data.work??{}).filter(k=>k.slice(0,10)===d).length;
  if(classicCount)actual.push({kind:'Gym clásico',count:classicCount});
  for(const [kind,rows] of [['Running',Object.values(run.sessions)],['Deporte',Object.values(sport.sessions)],['Gym PRO',records.map(x=>({day:x.date}))]]){
   const n=rows.filter(x=>x.day===d).length;if(n)actual.push({kind,count:n});
  }
  out.push({day:d,planned,events,actual});
 }
 return {start,today,proKnown,proActive,rows:out.slice(1,-1).map((r,i)=>{
  const neighbors=[out[i],out[i+2]],warnings=[];
  if(new Set([...r.planned,...r.events].map(x=>x.kind)).size>1)warnings.push('Coincidencia de actividades previstas o declaradas');
  if(r.planned.some(x=>x.quality)&&neighbors.some(x=>x.planned.length||x.events.length||x.actual.length))warnings.push('Revisar recuperación alrededor de trabajo de calidad o impacto moderado');
  if(!proKnown)warnings.push('Agenda PRO no verificada');
  return {...r,warnings,empty:r.planned.length===0&&r.events.length===0&&r.actual.length===0};
 })};
}
root.asiaCalendar1198=Object.freeze({project,add});
})(globalThis);
