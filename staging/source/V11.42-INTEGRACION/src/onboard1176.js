// Manual review/apply engine for the candidate diary. No network, storage or provider.
(function(root){'use strict';
const check=(ok,msg)=>{if(!ok)throw Error(msg)},clone=x=>JSON.parse(JSON.stringify(x)),exact=(x,ks)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k)),day=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&d>='1900-01-01'&&d<='2199-12-31'&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const add=(d,n)=>new Date(Date.parse(d)+n*86400000).toISOString().slice(0,10),id=(v,p)=>typeof v==='string'&&new RegExp('^'+p+'-[a-f0-9]{32}$').test(v);
function snapshot(data,current,today){return JSON.stringify([today,data.settings??{},data.running1174??null,data.sport1177??null,Object.keys(data.work??{}).sort(),current.calories,current.protein]);}
function prepare(data,raw,ids,today,api,current){
 const {G,S,T,R,N,gym}=api,base=data.settings??{},old=G.validate(base.goals101);
 check(day(today)&&old.version===2,'El asistente manual requiere un libro de metas propio; no convierte el histórico Asia.');
 check(exact(raw,['goal','primary','personalStart','strength','running','nutrition'])&&typeof raw.primary==='boolean'&&exact(raw.goal,['title','kind','target','motivation','start','deadline'])&&day(raw.goal.start)&&raw.goal.start>=today,'Revisá la meta y su fecha de inicio.');
 check(exact(ids,['goal','program','running','nutrition'])&&id(ids.goal,'goal')&&id(ids.program,'prog')&&id(ids.running,'runplan')&&id(ids.nutrition,'nut'),'Identificadores inválidos.');
 check(!old.items.some(g=>g.id===ids.goal),'La propuesta ya se aplicó o su ID está ocupado.');
 let book=G.upsert(old,{...raw.goal,id:ids.goal,status:'Activa',closedOn:'',result:''},today);
 if(raw.primary||old.items.length===0)book=G.select(book,ids.goal);
 let settings={...base,goals101:book},running=data.running1174,training=null,run=null,nutrition=null;
 if(raw.personalStart!==null){const d=raw.personalStart;
  check(day(d)&&d>=today&&!S.personalStart(base)&&!Object.keys(data.work??{}).some(k=>k.slice(0,10)>=d),'No se puede reemplazar un calendario personal ni uno con registros desde esa fecha.');
  settings.personalCalendar1173=d;
 }
 S.programmes(settings);
 if(raw.strength!==null){
  check(exact(raw.strength,['config','templates'])&&raw.strength.config.start>=raw.goal.start,'Revisá el inicio de fuerza.');
  const generated=T.generate(raw.strength.config,settings);
  training=raw.strength.templates===null?generated:{config:generated.config,templates:clone(raw.strength.templates)};
  check(Array.isArray(training.templates)&&training.templates.every(t=>Array.isArray(t.routine?.entries)&&Number.isFinite(T.estimate(t.routine.entries))&&T.estimate(t.routine.entries)<=training.config.minutes),'Revisá ejercicios y duración.');
  check(!Object.keys(data.work??{}).some(k=>k.slice(0,10)>=training.config.start&&k.slice(0,10)<=training.config.end),'Hay entrenamientos registrados en el tramo de fuerza.');
  settings=T.activate(settings,training,today,ids.program);
 }
 R.assertStrengthChange(running,base,settings,today,S);
 if(raw.running!==null){
  check(raw.goal.kind==='Running'&&exact(raw.running,['distanceM','targetSeconds','raceDate','start','end','days','weeklyMinutes','longestMinutes','profile'])&&raw.running.start>=raw.goal.start&&(!raw.running.raceDate||raw.running.raceDate===raw.goal.deadline),'La carrera requiere una meta Running y fechas coherentes.');
  running=R.addTarget(running,{goalId:ids.goal,distanceM:raw.running.distanceM,raceDate:raw.running.raceDate,targetSeconds:raw.running.targetSeconds},book);
  const {start,end,days,weeklyMinutes,longestMinutes,profile}=raw.running;
  run=R.draft({goalId:ids.goal,start,end,days,weeklyMinutes,longestMinutes,profile},running,book,settings,today,S);
  running=R.activate(running,run,ids.running,book,settings,today,S);
 }
 if(raw.nutrition!==null){
  check(exact(raw.nutrition,['plan','apply'])&&typeof raw.nutrition.apply==='boolean','Acción nutricional inválida.');
  nutrition=N.preview(raw.nutrition.plan);
  settings=N.savePlan(settings,raw.nutrition.plan,today,ids.nutrition);
  if(raw.nutrition.apply)settings=N.applyPlan(settings,ids.nutrition,today,current);
 }
 gym.compatibleSettings(base,settings,data.work);
 R.validate(running,book);if(running!==undefined)R.validateHybrid(running,settings,S);
 S.programmes(settings);
 root.asiaSport1177?.assertCalendar(data.sport1177,settings,running,S,R);
 const next={...data,settings,...(running===undefined?{}:{running1174:running})};
 return {next,training,run,nutrition,goal:book.items.find(g=>g.id===ids.goal)};
}
function review(data,raw,ids,today,api,current){
 const draft=clone(raw),keys=clone(ids),result=prepare(data,draft,keys,today,api,current);
 // In-memory proposal; contains only the requested input and local comparison state.
 return {draft,ids:keys,basis:snapshot(data,current,today),view:clone({goal:result.goal,training:result.training,run:result.run,nutrition:result.nutrition})};
}
function apply(data,proposal,today,api,current){
 check(proposal&&proposal.basis===snapshot(data,current,today),'Cambió la configuración o la fecha. Revisá otra vez.');
 const result=prepare(data,proposal.draft,proposal.ids,today,api,current);
 check(JSON.stringify(proposal.view)===JSON.stringify({goal:result.goal,training:result.training,run:result.run,nutrition:result.nutrition}),'Cambió la propuesta revisada.');
 return result.next;
}
root.asiaOnboard1176=Object.freeze({review,apply,add});
})(globalThis);
