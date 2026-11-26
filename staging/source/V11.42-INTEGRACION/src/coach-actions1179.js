// Candidate native strength action engine. No inference, storage or network.
// Only already registered exercises; future personal programmes; no network/provider.
(function(root){'use strict';
const check=(ok,msg)=>{if(!ok)throw Error(msg)},clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,exact=(x,ks)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k)),day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&x>='1900-01-01'&&x<='2199-12-31'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x,add=(d,n)=>new Date(Date.parse(d)+n*86400000).toISOString().slice(0,10),weekday=d=>new Date(d+'T00:00:00Z').getUTCDay(),id=x=>typeof x==='string'&&/^coachchange-[a-f0-9]{32}$/.test(x);
const rows=s=>s?.coachRoutine1179??[];
// Validation intentionally independent of schedule.planned wrapper: base routine stays identifiable.
function validate(settings,gym,programmes){
 const all=rows(settings);if(!Object.hasOwn(settings??{},'coachRoutine1179'))return [];const slots=gym.templates(settings),used=new Set(),newSlots=new Set(),baseSlots=new Set(programmes.flatMap(p=>p.days.map(d=>d.slot)));
 check(Array.isArray(all)&&all.length<=36,'Historial de cambios de Coach inválido');
 for(const r of all){
  check(exact(r,['id','created','programId','scope','from','to','weekday','baseSlot','oldSlot','newSlot','reason'])&&id(r.id)&&!used.has(r.id)&&day(r.created)&&day(r.from)&&day(r.to)&&r.from>=r.created&&r.to>=r.from&&Date.parse(r.to)-Date.parse(r.from)<=363*86400000&&['once','future'].includes(r.scope)&&int(r.weekday,0,6)&&weekday(r.from)===r.weekday&&(r.scope==='future'||r.from===r.to)&&typeof r.programId==='string'&&/^prog-[a-f0-9]{32}$/.test(r.programId)&&[r.baseSlot,r.oldSlot,r.newSlot].every(x=>int(x,4,3+slots.length))&&r.oldSlot!==r.newSlot&&typeof r.reason==='string'&&r.reason.trim()&&r.reason.length<=500,'Cambio de rutina inválido');
  // Each appended override references an immutable prior or new slot; do not rewrite the base programme.
  const programme=programmes.find(p=>p.id===r.programId);check(programme&&programme.days.some(d=>d.weekday===r.weekday&&d.slot===r.baseSlot)&&r.from>=programme.start&&Date.parse(r.to)-Date.parse(programme.start)<=363*86400000&&r.newSlot>r.oldSlot&&r.newSlot>r.baseSlot&&!baseSlots.has(r.newSlot)&&!newSlots.has(r.newSlot),'Referencia de cambio de rutina inválida');
  for(let d=r.from;d<=r.to;d=add(d,7)){const prior=all.slice(0,used.size).filter(x=>x.programId===r.programId&&x.baseSlot===r.baseSlot&&x.weekday===r.weekday&&d>=x.from&&d<=x.to).at(-1);check(r.oldSlot===(prior?.newSlot??r.baseSlot),'Cadena de cambios incompatible');}
  used.add(r.id);newSlots.add(r.newSlot);
 }
 return all;
}
function resolve(base,d,settings,programmeId,gym,programmes){if(base===null||!programmeId||!Object.hasOwn(settings??{},'coachRoutine1179'))return base;const all=validate(settings,gym,programmes);let slot=base;for(const r of all)if(r.programId===programmeId&&r.baseSlot===base&&weekday(d)===r.weekday&&d>=r.from&&d<=r.to)slot=r.newSlot;return slot;}
function entries(r,ops,available,gym,settings){
 check(Array.isArray(ops)&&ops.length>=1&&ops.length<=12,'Elegí de 1 a 12 cambios');
 const result=clone(r.entries);
 function index(x){check(int(x,0,result.length-1),'Posición de ejercicio inválida');return x}
 function validEntry(e){check(exact(e,['exercise','sets','min','max','rest'])&&available.has(e.exercise)&&int(e.sets,1,6)&&int(e.min,1,30)&&int(e.max,e.min,30)&&int(e.rest,30,600),'Ejercicio no disponible o dosis fuera de límites');return clone(e)}
 for(const op of ops){
  check(op&&typeof op.type==='string','Acción inválida');
  if(op.type==='add'){check(exact(op,['type','at','entry'])&&int(op.at,0,result.length),'Posición de alta inválida');result.splice(op.at,0,validEntry(op.entry))}
  else if(op.type==='replace'){check(exact(op,['type','at','entry']),'Reemplazo inválido');result[index(op.at)]=validEntry(op.entry)}
  else if(op.type==='remove'){check(exact(op,['type','at']),'Eliminación inválida');result.splice(index(op.at),1)}
  else if(op.type==='move'){check(exact(op,['type','from','to']),'Orden inválido');const f=index(op.from),t=index(op.to),[e]=result.splice(f,1);result.splice(t,0,e)}
  else if(op.type==='dose'){check(exact(op,['type','at','sets','min','max','rest']),'Dosis inválida');const i=index(op.at);result[i]=validEntry({exercise:result[i].exercise,sets:op.sets,min:op.min,max:op.max,rest:op.rest})}
  else throw Error('Acción no admitida');
  check(result.length>=1&&result.length<=12,'La rutina debe conservar entre 1 y 12 ejercicios');
 }
 check(!eq(r.entries,result),'La propuesta no cambia la rutina');
 // Existing entries remain intact even if they have legacy doses; edited entries are bounded.
 check(result.reduce((n,e)=>n+e.sets,0)<=Math.max(24,r.entries.reduce((n,e)=>n+e.sets,0)),'Revisá el volumen total');
 return result;
}
function prepare(data,raw,changeId,today,api){
 const {S,T,Gym,R,Sport}=api,settings=data.settings??{};
 check(exact(raw,['day','scope','operations','reason','availableExercises'])&&day(today)&&day(raw.day)&&raw.day>today&&['once','future'].includes(raw.scope)&&id(changeId)&&typeof raw.reason==='string'&&raw.reason.trim()&&raw.reason.length<=500&&Array.isArray(raw.availableExercises)&&raw.availableExercises.length<=150&&new Set(raw.availableExercises).size===raw.availableExercises.length,'Fecha futura, motivo y material confirmado obligatorios');
 const programmes=S.programmes(settings),prior=validate(settings,Gym,programmes);check(!prior.some(x=>x.id===changeId),'Propuesta ya aplicada');
 const programme=S.programmeAt(raw.day,settings);check(programme&&!programme.cancelled,'Se requiere un programa clásico personal futuro');
 const base=programme.days.find(x=>x.weekday===weekday(raw.day))?.slot;check(int(base,4,39),'No hay sesión del programa ese día');
 const from=raw.day,to=raw.scope==='once'?from:programme.end,dates=[];
 for(let d=from;d<=to;d=add(d,7))dates.push(d);
 check(dates.every(d=>!Object.keys(data.work??{}).some(k=>k.slice(0,10)===d)),'Hay sesiones registradas en fechas afectadas');
 check(dates.every(d=>!R.planned(data.running1174,d)&&!Sport.planned(data.sport1177,d)&&!Sport.eventsOn(data.sport1177,d).length),'Coincide con Running o rendimiento deportivo');
 const slot=resolve(base,from,settings,programme.id,Gym,programmes);check(dates.every(d=>resolve(base,d,settings,programme.id,Gym,programmes)===slot),'Hay cambios de rutina diferentes en el tramo; revisá por separado');
 const old=Gym.templates(settings)[slot-4],known=new Set(Gym.names104(settings));check(raw.availableExercises.every(x=>known.has(x)),'Hay ejercicios no registrados');const available=new Set(raw.availableExercises);
 let revised;const restore=Array.isArray(raw.operations)&&raw.operations.length===1&&raw.operations[0]?.type==='restore';
 if(restore){const op=raw.operations[0];check(exact(op,['type','changeId']),'Reversión inválida');const earlier=prior.find(x=>x.id===op.changeId);check(earlier&&earlier.programId===programme.id&&earlier.baseSlot===base&&earlier.newSlot===slot&&dates.every(d=>d>=earlier.from&&d<=earlier.to),'Solo se revierte una versión vigente en todo el tramo revisado');revised=clone(Gym.templates(settings)[earlier.oldSlot-4].entries);check(revised.every(e=>available.has(e.exercise)),'Confirmá disponibilidad de los ejercicios restaurados');check(!eq(revised,old.entries),'La reversión no cambia la rutina');}
 else revised=entries(old,raw.operations,available,Gym,settings);
 const minutes=T.estimate(revised);check(Number.isFinite(minutes)&&minutes<=programme.minutes,'La propuesta supera la duración del programa');
 const routine={name:old.name.slice(0,48).trim()+(restore?' · reversión':' · ajuste'),entries:revised},newSlot=4+Gym.templates(settings).length;
 let next=Gym.append(settings,routine);const change={id:changeId,created:today,programId:programme.id,scope:raw.scope,from,to,weekday:weekday(from),baseSlot:base,oldSlot:slot,newSlot,reason:raw.reason};
 next={...next,coachRoutine1179:[...prior,change]};validate(next,Gym,S.programmes(next));Gym.compatibleSettings(settings,next,data.work);R.assertStrengthChange(data.running1174,settings,next,today,S);Sport.assertCalendar(data.sport1177,next,data.running1174,S,R);
 return {next:{...data,settings:next},view:{programme:programme.name,dates,before:clone(old),after:clone(routine),beforeMinutes:T.estimate(old.entries),afterMinutes:minutes,change:clone(change)}};
}
function basis(data,today){return JSON.stringify([today,data.settings??{},data.running1174??null,data.sport1177??null,Object.keys(data.work??{}).sort()])}
function review(data,raw,changeId,today,api){const draft=clone(raw),p=prepare(data,draft,changeId,today,api);return {draft,changeId,basis:basis(data,today),view:p.view};}
function apply(data,proposal,today,api){check(proposal&&proposal.basis===basis(data,today),'La configuración cambió; revisá nuevamente');const p=prepare(data,proposal.draft,proposal.changeId,today,api);check(eq(p.view,proposal.view),'Cambió la propuesta revisada');return p.next;}
root.asiaCoachActions1179=Object.freeze({validate,resolve,review,apply});
})(globalThis);
