// Pure Running v1 domain, embedded identically in candidate diary/shell/server.
// All dates are civil dates; durations seconds, distances integer metres.
(function(root){'use strict';
const check=(v,m)=>{if(!v)throw Error(m)},obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v),exact=(v,ks)=>obj(v)&&Object.keys(v).sort().join(',')===[...ks].sort().join(','),int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,txt=(v,max)=>typeof v==='string'&&v.length<=max;
const day=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&d>='1900-01-01'&&d<='2199-12-31'&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const add=(d,n)=>new Date(Date.parse(d)+n*86400000).toISOString().slice(0,10),weekday=d=>new Date(d+'T00:00:00Z').getUTCDay(),clone=x=>JSON.parse(JSON.stringify(x));
const id=(s,p)=>typeof s==='string'&&new RegExp('^'+p+'-[a-f0-9]{32}$').test(s);
const modes=Object.freeze(['Exterior','Cinta','Pista']),types=Object.freeze(['Rodaje suave','Fondo suave','Intervalos','Tempo','Carrera','Caminar/correr','Recuperación','Otro']);
const empty=()=>({version:1,targets:{},sessions:{},plans:{}});
function target(t,goalId,goals){
 check(exact(t,['goalId','distanceM','raceDate','targetSeconds'])&&t.goalId===goalId&&id(goalId,'goal')&&goals.items.some(g=>g.id===goalId&&g.kind==='Running')&&int(t.distanceM,0,200000)&&(t.raceDate===''||day(t.raceDate))&&(t.targetSeconds===null||int(t.targetSeconds,60,604800)),'Objetivo running inválido');
}
function session(s,k){
 check(exact(s,['id','day','time','distanceM','seconds','mode','type','rpe','heartRate','elevationM','notes'])&&id(k,'run')&&s.id===k&&day(s.day)&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.time)&&int(s.distanceM,1,200000)&&int(s.seconds,1,604800)&&s.distanceM/s.seconds<=15&&modes.includes(s.mode)&&types.includes(s.type)&&(s.rpe===null||int(s.rpe,1,10))&&(s.heartRate===null||int(s.heartRate,30,250))&&(s.elevationM===null||int(s.elevationM,0,20000))&&txt(s.notes,500),'Sesión running inválida');
}
const levels=Object.freeze(['Inicial','Habitual','Experimentado']);
function validateProfile(p){
 check(exact(p,['level','surface','availableMinutes','progress','symptoms'])&&levels.includes(p.level)&&modes.includes(p.surface)&&int(p.availableMinutes,10,240)&&typeof p.progress==='boolean'&&p.symptoms==='Sin síntomas preocupantes','Completá tu nivel y disponibilidad; si hay dolor o síntomas preocupantes, consultá antes de aumentar la carga');
 return p;
}
function plan(p,k,targets){
 check(exact(p,['id','goalId','start','end','days','weeklyMinutes','longestMinutes','rows',...(Object.hasOwn(p??{},'profile')?['profile']:[]),...(Object.hasOwn(p??{},'replaces')?['replaces']:[])])&&id(k,'runplan')&&p.id===k&&Object.hasOwn(targets,p.goalId)&&day(p.start)&&day(p.end)&&p.end>=p.start&&Date.parse(p.end)-Date.parse(p.start)<=83*86400000&&Array.isArray(p.days)&&p.days.length>=2&&p.days.length<=4&&new Set(p.days).size===p.days.length&&p.days.every(v=>int(v,0,6))&&int(p.weeklyMinutes,0,600)&&int(p.longestMinutes,0,240)&&(p.weeklyMinutes===0?p.longestMinutes===0:p.longestMinutes>0&&p.longestMinutes<=p.weeklyMinutes)&&Array.isArray(p.rows)&&p.rows.length>=1&&p.rows.length<=48,'Plan running inválido');
 if(Object.hasOwn(p,'profile'))validateProfile(p.profile);
 if(Object.hasOwn(p,'replaces'))check(id(p.replaces,'runplan')&&p.replaces!==k,'Replanificación inválida');
 let prev='';for(const r of p.rows){check(exact(r,['day','minutes','type'])&&day(r.day)&&r.day>=p.start&&r.day<=p.end&&r.day>prev&&p.days.includes(weekday(r.day))&&int(r.minutes,5,240)&&['Rodaje suave','Fondo suave','Caminar/correr','Recuperación'].includes(r.type),'Sesión prevista inválida');prev=r.day}
}
function validate(raw,goals){
 if(raw===undefined)return empty();
 check(exact(raw,['version','targets','sessions','plans'])&&raw.version===1&&[raw.targets,raw.sessions,raw.plans].every(obj)&&Object.keys(raw.targets).length<=100&&Object.keys(raw.sessions).length<=10000&&Object.keys(raw.plans).length<=100,'Registro running inválido');
 for(const [k,t] of Object.entries(raw.targets))target(t,k,goals);
 const seen=new Set();for(const [k,s] of Object.entries(raw.sessions)){session(s,k);const key=s.day+'/'+s.time;check(!seen.has(key),'Sesión duplicada en la misma fecha y hora');seen.add(key)}
 for(const [k,p] of Object.entries(raw.plans))plan(p,k,raw.targets);
 const replaced=new Set();for(const p of Object.values(raw.plans)){if(p.replaces){const old=raw.plans[p.replaces];check(old&&old.goalId===p.goalId&&p.start>old.start&&p.start<=old.end&&!replaced.has(p.replaces),'Replanificación incompatible o divergente');replaced.add(p.replaces)}}
 const dates=new Set();for(const r of effectiveRows(raw)){check(!dates.has(r.day),'Planes running superpuestos');dates.add(r.day)}
 return raw;
}
function pace(distanceM,seconds){check(int(distanceM,1,200000)&&int(seconds,1,604800),'Distancia o duración inválida');return Math.round(seconds*1000/distanceM)}
function addTarget(raw,t,goals){const b=clone(validate(raw,goals));check(!Object.hasOwn(b.targets,t.goalId),'Ya existe un objetivo running asociado');b.targets[t.goalId]=clone(t);return validate(b,goals)}
function addSession(raw,s,goals,today){check(day(today)&&s.day<=today,'No se registran carreras futuras');const b=clone(validate(raw,goals));check(!Object.hasOwn(b.sessions,s.id),'Sesión ya registrada');b.sessions[s.id]=clone(s);return validate(b,goals)}
function effectiveRows(raw,extra=null){
 const plans=Object.values(raw?.plans??{}),cutoffs=new Map(plans.filter(p=>p.replaces).map(p=>[p.replaces,p.start]));
 if(extra?.replaces)cutoffs.set(extra.replaces,extra.start);
 return plans.flatMap(p=>p.rows.filter(r=>!cutoffs.has(p.id)||r.day<cutoffs.get(p.id)).map(r=>({...r,planId:p.id}))).sort((a,b)=>a.day.localeCompare(b.day));
}
function planned(raw,date){const row=effectiveRows(raw).find(r=>r.day===date);return row?{day:row.day,minutes:row.minutes,type:row.type}:null}
function assertStrengthChange(raw,before,after,today,schedule){
 for(const r of effectiveRows(raw))if(r.day>=today&&schedule.planned(r.day,before)===null)check(schedule.planned(r.day,after)===null,'Running previsto el '+r.day+'. Revisá el calendario híbrido antes de activar fuerza');
}
function validateHybrid(raw,settings,schedule){
 for(const r of effectiveRows(raw))if(raw.plans[r.planId].profile)check(schedule.planned(r.day,settings)===null,'Plan híbrido incompatible el '+r.day);
}
function draft({goalId,start,end,days,weeklyMinutes,longestMinutes,profile,replaces},raw,goals,settings,today,schedule){
 const b=validate(raw,goals),t=b.targets[goalId];check(t&&goals.items.some(g=>g.id===goalId&&g.status==='Activa')&&day(today)&&day(start)&&day(end)&&start>=today&&end>=start&&Date.parse(end)-Date.parse(start)<=83*86400000&&(!t.raceDate||end<t.raceDate),'Elegí un tramo futuro de hasta 12 semanas, anterior a la carrera');
 check(Array.isArray(days)&&days.length>=2&&days.length<=4&&new Set(days).size===days.length&&days.every(v=>int(v,0,6))&&int(weeklyMinutes,0,600)&&int(longestMinutes,0,240)&&(weeklyMinutes===0?longestMinutes===0:longestMinutes>=10&&longestMinutes<=weeklyMinutes)&&schedule&&typeof schedule.planned==='function','Indicá frecuencia y volumen reciente reales');
 if(profile!==undefined)validateProfile(profile);
 if(replaces!==undefined){const old=b.plans[replaces];check(old&&old.goalId===goalId&&start>today&&start>old.start&&start<=old.end&&!Object.values(b.plans).some(p=>p.replaces===replaces),'Elegí una fecha futura dentro del tramo vigente para replanificar');check(!Object.values(b.sessions).some(s=>s.day>=start&&s.day<=old.end),'Hay carreras registradas en el tramo a reemplazar');}
 const occupied=new Set(effectiveRows(b,{replaces,start}).map(r=>r.day));
 // Legacy drafts remain reproducible; enhanced drafts are optional and conservative.
 // No automatic intensity or volume escalation; walking intervals for new runners.
 const minutes=weeklyMinutes===0?10:Math.min(60,longestMinutes,Math.floor(weeklyMinutes/days.length));
 check(minutes>=5,'Volumen insuficiente para esa frecuencia; reducí los días o revisá el punto de partida');
 const rows=[];let last=null;
 for(let d=start;d<=end;d=add(d,1))if(days.includes(weekday(d))){
  check(!occupied.has(d)&&schedule.planned(d,settings)===null,'Hay una sesión de fuerza o running prevista el '+d+'. Elegí otros días o revisá el calendario');
  check(last===null||Date.parse(d)-Date.parse(last)>=86400000,'Fecha repetida');
  const remaining=t.raceDate?(Date.parse(t.raceDate)-Date.parse(d))/86400000:999;
  let duration=minutes,type=weeklyMinutes===0?'Caminar/correr':'Rodaje suave';
  if(profile){
   const week=Math.floor((Date.parse(d)-Date.parse(start))/604800000),longDay=days[days.length-1],isLong=weekday(d)===longDay;
   // No escalation for beginners, zero-volume starts or race week. Optional modest
   // duration increase only for people already running regularly, never intensity.
   const growth=profile.progress&&profile.level!=='Inicial'&&weeklyMinutes>=60&&remaining>7?Math.min(.10,Math.floor(week/2)*.025):0;
   const budget=Math.floor(weeklyMinutes*(1+growth)),cap=Math.min(profile.availableMinutes,Math.floor(longestMinutes*(1+growth)));
   if(weeklyMinutes===0)duration=Math.min(10,profile.availableMinutes);
   else{
    const longBudget=profile.level==='Inicial'||weeklyMinutes<60?Math.floor(budget/days.length):Math.min(cap,Math.floor(budget*.4));
    const otherBudget=Math.floor((budget-longBudget)/(days.length-1));
    duration=Math.min(cap,isLong?longBudget:otherBudget);
    check(duration>=5,'Disponibilidad o volumen insuficiente para esa frecuencia');
    if(isLong&&longBudget>otherBudget&&duration>=20)type='Fondo suave';
    else if(last&&Date.parse(d)-Date.parse(last)===86400000)type='Recuperación';
   }
   if(remaining<=7&&weeklyMinutes>0)duration=Math.max(5,Math.floor(duration*.8));
  }
  if(remaining<=2)duration=Math.max(5,Math.floor(duration/2));
  rows.push({day:d,minutes:duration,type});last=d;
 }
 check(rows.length>0,'No hay sesiones en esas fechas');
 return {goalId,start,end,days:[...days],weeklyMinutes,longestMinutes,rows,...(profile===undefined?{}:{profile:clone(profile)}),...(replaces===undefined?{}:{replaces})};
}
function activate(raw,proposal,planId,goals,settings,today,schedule){
 const actual=draft(proposal,raw,goals,settings,today,schedule);check(JSON.stringify(actual)===JSON.stringify(proposal),'El borrador o calendario cambió; generá nuevamente');
 const b=clone(validate(raw,goals));check(!Object.hasOwn(b.plans,planId),'Plan ya existe');b.plans[planId]={id:planId,...clone(actual)};return validate(b,goals);
}
function metrics(raw,today){check(day(today),'Fecha inválida');const from=add(today,-6),rows=Object.values(raw?.sessions??{}).filter(r=>r.day>=from&&r.day<=today);
 const byMode={};for(const mode of modes){const list=rows.filter(x=>x.mode===mode),distanceM=list.reduce((s,r)=>s+r.distanceM,0),seconds=list.reduce((s,r)=>s+r.seconds,0);byMode[mode]={sessions:list.length,distanceM,seconds,pace:distanceM?Math.round(seconds*1000/distanceM):null}}
 return {sessions:rows.length,distanceM:rows.reduce((s,r)=>s+r.distanceM,0),seconds:rows.reduce((s,r)=>s+r.seconds,0),longestM:Math.max(0,...rows.map(r=>r.distanceM)),byMode}
}
root.asiaRunning1174=Object.freeze({empty,validate,addTarget,addSession,pace,draft,activate,planned,effectiveRows,assertStrengthChange,validateHybrid,metrics,modes,types,levels});
})(globalThis);
