// Typed proposal composition. No provider, writes, account keys, or network.
// User-confirmed inputs only. Caller must bind review to current account,
// verify PRO state and persist the resulting diary through the guarded CAS path.
(function(root){'use strict';
const check=(ok,m)=>{if(!ok)throw Error(m)},obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),exact=(x,ks)=>obj(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k)),clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),id=(v,p)=>typeof v==='string'&&new RegExp('^'+p+'-[a-f0-9]{32}$').test(v),day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&x>='1900-01-01'&&x<='2199-12-31'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const keys=['strength','running','sport','nutrition'],prefix={strength:'coachchange',running:'runplan',sport:'sportplan',nutrition:'nut'};
function basis(data,current,today){return JSON.stringify([today,data.settings??{},data.running1174??null,data.sport1177??null,Object.keys(data.work??{}).sort(),current.calories,current.protein]);}
const subset=(rows,start,end)=>rows.filter(r=>r.day>=start&&r.day<=end),sorted=x=>[...new Set(x)].sort();
function prepare(data,raw,ids,today,api,current){
 const {A,Gym,S,T,R,Sport,N,G}=api;
 check(day(today)&&exact(raw,['version',...keys])&&raw.version===1&&exact(ids,keys)&&keys.some(k=>raw[k]!==null)&&keys.every(k=>raw[k]===null?ids[k]===null:id(ids[k],prefix[k])),'Propuesta combinada inválida');
 const book=G(data.settings?.goals101);check(book.version===2,'Se requiere un libro de metas propio');
 check(Number.isInteger(current.calories)&&Number.isInteger(current.protein),'Metas nutricionales actuales inválidas');
 let next={...data},settings=data.settings??{},running=data.running1174,sport=data.sport1177,view={strength:null,running:null,sport:null,nutrition:null};const affected=[],workDays=new Set(Object.keys(data.work??{}).map(k=>k.slice(0,10)));
 // Ordered native operations, each side-effect free; final compatibility is checked again.
 // Conservative: we do not provisionally erase an existing block to exchange occupied days.
 if(raw.strength!==null){
  const p=A.review(next,raw.strength,ids.strength,today,{Gym,S,T,R,Sport});next=A.apply(next,p,today,{Gym,S,T,R,Sport});settings=next.settings;view.strength=p.view;affected.push(...p.view.dates);
 }
 if(raw.running!==null){
  const x=raw.running;check(exact(x,['goalId','start','end','days','weeklyMinutes','longestMinutes','profile','replaces'])&&day(x.start)&&x.start>today&&obj(x.profile)&&(x.replaces===null||id(x.replaces,'runplan')),'Running requiere fecha futura y perfil reciente confirmado');
  const b=R.validate(running,book),old=x.replaces===null?null:b.plans[x.replaces];
  if(x.replaces!==null)check(old,'Bloque Running no disponible');
  const before=old?subset(R.effectiveRows(b).filter(r=>r.planId===old.id),x.start,old.end):[];
  const {replaces,...input}=x,p=R.draft({...input,...(replaces===null?{}:{replaces})},running,book,settings,today,S);
  const dates=sorted([...before,...p.rows].map(r=>r.day));
  check(dates.every(d=>!workDays.has(d)&&!Object.values(b.sessions).some(s=>s.day===d)&&!Sport.eventsOn(sport,d).length),'Hay un registro o evento en fechas afectadas de Running');
  running=R.activate(running,p,ids.running,book,settings,today,S);
  Sport.assertCalendar(sport,settings,running,S,R);
  next={...next,running1174:running};view.running={before,after:p.rows,planId:ids.running,replaces,profile:clone(p.profile),dates};affected.push(...dates);
 }
 if(raw.sport!==null){
  const x=raw.sport;check(exact(x,['profileId','start','end','days','replaces'])&&day(x.start)&&x.start>today&&(x.replaces===null||id(x.replaces,'sportplan')),'Deporte requiere fechas futuras y perfil existente');
  const b=Sport.validate(sport,book),old=x.replaces===null?null:b.plans[x.replaces];
  if(x.replaces!==null)check(old,'Bloque deportivo no disponible');
  const before=old?subset(Sport.effective(b).filter(r=>r.planId===old.id),x.start,old.end):[];
  const p=Sport.draft(x,sport,book,settings,running,today,S,R,data.work);
  const dates=sorted([...before,...p.rows].map(r=>r.day));
  check(dates.every(d=>!workDays.has(d)&&!Object.values(b.sessions).some(s=>s.day===d)),'Hay registros en fechas afectadas de rendimiento deportivo');
  sport=Sport.activate(sport,p,ids.sport,book,settings,running,today,S,R,data.work);
  next={...next,sport1177:sport};view.sport={before,after:p.rows,planId:ids.sport,replaces:x.replaces,profileId:x.profileId,dates};affected.push(...dates);
 }
 if(raw.nutrition!==null){
  const x=raw.nutrition;check(exact(x,['plan','apply','confirmedValues'])&&x.confirmedValues===true&&typeof x.apply==='boolean'&&exact(x.plan,['name','kind','review','calories','protein','fat','shares']),'Revisá y confirmá valores nutricionales explícitos; no se estiman automáticamente');
  const prev=N.validate(settings.nutrition103);check(!prev.plans.some(p=>p.id===ids.nutrition),'Estrategia ya guardada');
  const v=N.preview(x.plan);settings=N.savePlan(settings,x.plan,today,ids.nutrition);if(x.apply)settings=N.applyPlan(settings,ids.nutrition,today,current);
  next={...next,settings};view.nutrition={planId:ids.nutrition,apply:x.apply,before:{calories:current.calories,protein:current.protein},after:clone(x.plan),carbs:v.carbs,meals:v.meals};
 }
 Gym.compatibleSettings(data.settings,settings,data.work);S.programmes(settings);
 if(running!==undefined){R.validate(running,book);R.validateHybrid(running,settings,S);}
 if(sport!==undefined){Sport.validate(sport,book);Sport.assertCalendar(sport,settings,running,S,R);}
 A.validate(settings,Gym,S.programmes(settings));N.validate(settings.nutrition103);
 return {next,view:{...view,affectedDates:sorted(affected)}};
}
function review(data,raw,ids,today,api,current){const draft=clone(raw),keys=clone(ids),p=prepare(data,draft,keys,today,api,current);return {draft,ids:keys,basis:basis(data,current,today),view:clone(p.view)};}
function apply(data,p,today,api,current){check(p&&p.basis===basis(data,current,today),'La configuración cambió; revisá nuevamente');const actual=prepare(data,p.draft,p.ids,today,api,current);check(eq(actual.view,p.view),'La propuesta revisada cambió');return actual.next;}
root.asiaCoachBundle1180=Object.freeze({review,apply});
})(globalThis);
