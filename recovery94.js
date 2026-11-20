/* V9.4 — descriptive personal recovery. Read-only, closed-day references; no clinical score. */
(function(root){'use strict';
const day=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const shift=(d,n)=>new Date(Date.parse(d)+86400000*n).toISOString().slice(0,10);
const number=(x,min,max)=>{if(typeof x==='string'&&/^\d+(?:\.\d+)?$/.test(x.trim()))x=Number(x);return typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max?x:null;};
const rating=x=>{const n=number(x,1,5);return Number.isInteger(n)?n:null;};
const median=a=>{const b=[...a].sort((x,y)=>x-y);return b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2;};
const fmt=x=>x.toLocaleString('es-UY',{maximumFractionDigits:1});
const lifts=['Press banca con barra','Press inclinado con barra','Sentadilla con barra','Peso muerto rumano'];
function build({reference,today,diary={},work={},settings={},health,includeHealth=false,gym=null,slotOK=null}){
 if(!day(reference)||!day(today)||reference>today)return null;
 const rec=diary[reference]||{},c=rec.checkin89||{},parts=[],missing=[];
 const add=(name,value,detail,flag=false)=>parts.push({name,value,detail,flag});
 const history=(reader)=>Array.from({length:28},(_,i)=>reader(shift(reference,-i-1))).filter(v=>v!==null);
 const compare=(name,value,unit,reader,threshold,shortFlag=false)=>{const h=history(reader),base=h.length>=7?median(h):null;if(value===null){missing.push(name+': sin registro');return;}const flagged=shortFlag||(base!==null&&threshold(value,base));const detail=fmt(value)+' '+unit+(base===null?' · referencia insuficiente ('+h.length+'/28 días; mínimo 7)':' · mediana personal '+fmt(base)+' '+unit+' ('+h.length+'/28 días)')+(flagged?' · señal para revisar':'');add(name,value,detail,flagged);};
 const sleep=number(rec.sleep,0,24);compare('Sueño manual',sleep,'h',d=>number(diary[d]?.sleep,0,24),(v,b)=>v<=b-1,sleep!==null&&sleep<6);
 for(const [name,v,bad] of [['Recuperación percibida',rec.recovery,x=>x<=2],['Fatiga muscular',rec.fatigue43,x=>x>=4],['Energía',c.energy,x=>x<=2],['Descanso percibido',c.rest,x=>x<=2],['Estrés',c.stress,x=>x>=4],['Molestias musculares',c.soreness,x=>x>=4]]){const n=rating(v);if(n===null)missing.push(name+': sin registro');else add(name,n,n+'/5'+(bad(n)?' · señal para revisar':''),bad(n));}
 const manualCount=parts.length;
 let comparedCardio=0;
 if(includeHealth&&typeof health==='function'){
  const current=health(reference)||{};
  for(const [key,name,unit,min,max,threshold] of [['hrv','VFC','ms',1,500,(v,b)=>v<=b*.8],['restingHR','FC en reposo','lpm',25,220,(v,b)=>v>=b*1.1]]){
   const reader=d=>number(health(d)?.[key],min,max),v=number(current[key],min,max);const count=history(reader).length;compare(name,v,unit,reader,threshold);if(v!==null&&count>=7)comparedCardio++;
  }
 }
 const recent=new Map(),prior=new Map();let previous=0;
 for(const [k,w] of Object.entries(work)){const d=k.slice(0,10);if(!day(d)||d>=reference||d<shift(reference,-14)||!(/^\d{4}-\d{2}-\d{2}_[0-3]$/.test(k)||slotOK?.(k,settings)))continue;let n=0;for(const a of Object.values(w?.ex||{}))if(Array.isArray(a))n+=gym?.metrics?gym.metrics(a).valid:a.filter(s=>s?.done===true&&typeof s.kg==='number'&&number(s.kg,0,1000)!==null&&Number.isInteger(s.reps)&&s.reps>=1&&s.reps<=100).length;if(!n)continue;const target=d>=shift(reference,-7)?recent:prior;target.set(d,(target.get(d)||0)+n);if(d>=shift(reference,-3))previous+=n;}
 const load={recent:[...recent.values()].reduce((a,b)=>a+b,0),previous:[...prior.values()].reduce((a,b)=>a+b,0),recentDays:recent.size,previousDays:prior.size};
 const performance=[];if(gym?.performance93&&gym?.fatigue93){const bounded=Object.fromEntries(Object.entries(work).filter(([k])=>k.slice(0,10)>=shift(reference,-42)&&k.slice(0,10)<reference));for(const name of lifts){const rows=gym.performance93(bounded,name,shift(reference,-1),settings);if(rows.length&&rows.at(-1).key.slice(0,10)>=shift(reference,-14)){const f=gym.fatigue93(rows);if(f)performance.push({name,change:f.change,review:f.review});}}}
 const flags=parts.filter(p=>p.flag).map(p=>p.name);for(const p of performance)if(p.review)flags.push('Descenso repetido: '+p.name);
 const subjective=parts.filter(p=>['Recuperación percibida','Fatiga muscular','Energía','Descanso percibido','Estrés','Molestias musculares'].includes(p.name)).length;
 // Absence of flags is not evidence of readiness. Require sleep, two subjective observations and (when shared) a personal cardiovascular comparison.
 const sufficient=sleep!==null&&subjective>=2&&(!includeHealth||comparedCardio>=1);
 const label=flags.length?'Priorizá recuperación':!sufficient?'Datos insuficientes':'Sin señales destacadas';
 const vacation=reference>='2026-12-26'&&reference<='2027-01-07';
 const advice=(flags.length?'Revisá las señales identificadas, cómo te sentís y la técnica. Considerá reducir esfuerzo o descansar; no hace falta compensar.':!sufficient?'Faltan registros para una orientación completa. No interpretes la ausencia de señales como recuperación confirmada.':'No se identificaron señales con estas reglas y los datos disponibles. No confirma aptitud para entrenar; decidí según sensaciones.')+(vacation?' Vacaciones: actividad opcional.':'');
 return {reference,label,parts,missing,flags,manualCount,comparedCardio,coverage:parts.length,total:includeHealth?9:7,previous,load,performance,advice,vacation,includeHealth};
}
const api={build};if(typeof module==='object'&&module.exports){module.exports=api;return;}root.asiaRecovery94=api;
})(typeof globalThis!=='undefined'?globalThis:window);
