// Local, explicitly confirmed structured facts; never sends them to a provider.
(function(root){'use strict';
const check=(v,m)=>{if(!v)throw Error(m)},obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),exact=(x,k)=>obj(x)&&Object.keys(x).length===k.length&&k.every(a=>Object.hasOwn(x,a)),int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&x>='1900-01-01'&&x<='2199-12-31'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x,days=(x,min,max)=>Array.isArray(x)&&x.length>=min&&x.length<=max&&new Set(x).size===x.length&&x.every(d=>int(d,0,6)),copy=x=>JSON.parse(JSON.stringify(x));
function validate(g,x,today,api){
 check(exact(g,['title','kind','target'])&&typeof g.title==='string'&&g.title.trim()&&g.title.length<=80&&typeof g.target==='string'&&g.target.length<=120&&api.kinds.includes(g.kind),'Meta inválida');
 check(day(today)&&exact(x,['dates','strength','running','nutrition']),'Datos del borrador inválidos');
 const {dates,strength,running,nutrition}=x;
 if(dates!==null)check(exact(dates,['start','end','deadline'])&&day(dates.start)&&day(dates.end)&&dates.start>=today&&dates.end>=dates.start&&Date.parse(dates.end)-Date.parse(dates.start)<=363*86400000&&(dates.deadline===''||(day(dates.deadline)&&dates.deadline>=dates.start)),'Revisá las fechas confirmadas');
 check(!(strength||running)||dates!==null,'Confirmá fechas de entrenamiento');
 if(strength!==null)check(exact(strength,['objective','equipment','minutes','days'])&&api.objectives.includes(strength.objective)&&api.equipment.includes(strength.equipment)&&int(strength.minutes,30,120)&&days(strength.days,2,6),'Completá objetivo, equipo, duración y días de fuerza');
 if(running!==null){
  check(g.kind==='Running'&&exact(running,['distanceM','targetSeconds','weeklyMinutes','longestMinutes','level','surface','minutes','days','symptoms'])&&int(running.distanceM,0,200000)&&(running.targetSeconds===null||int(running.targetSeconds,60,604800))&&int(running.weeklyMinutes,0,600)&&int(running.longestMinutes,0,240)&&(running.weeklyMinutes===0?running.longestMinutes===0:running.longestMinutes>=10&&running.longestMinutes<=running.weeklyMinutes)&&api.levels.includes(running.level)&&api.surfaces.includes(running.surface)&&int(running.minutes,10,240)&&days(running.days,2,4)&&running.symptoms==='Sin síntomas preocupantes'&&Date.parse(dates.end)-Date.parse(dates.start)<=83*86400000&&(!dates.deadline||dates.end<dates.deadline),'Completá la base de Running, fechas y ausencia de síntomas preocupantes');
 }
 if(strength&&running)check(!strength.days.some(d=>running.days.includes(d)),'Elegí días diferentes para fuerza y Running');
 if(nutrition!==null){check(exact(nutrition,['kind','calories','protein','fat','shares'])&&api.nutritionKinds.includes(nutrition.kind),'Estrategia nutricional inválida');api.previewNutrition({name:'Estrategia revisada',review:'',...nutrition});}
 return copy({goal:g,parameters:x});
}
root.asiaIntakeParams11992=Object.freeze({validate});
})(globalThis);
