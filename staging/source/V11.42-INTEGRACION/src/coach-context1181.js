// Local-only preview and native bridge. No network or writes.
(function(root){'use strict';
const check=(x,m)=>{if(!x)throw Error(m)},clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),exact=(x,k)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===k.length&&k.every(v=>Object.hasOwn(x,v)),day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
function preview(data,selection,today,api){
 check(exact(selection,['day','scope','question','goal','availableExercises'])&&day(today)&&day(selection.day)&&selection.day>today&&['once','future'].includes(selection.scope)&&typeof selection.question==='string'&&selection.question.trim().length>0&&selection.question.length<=1200&&typeof selection.goal==='string'&&selection.goal.length<=300&&Array.isArray(selection.availableExercises)&&selection.availableExercises.length<=40&&new Set(selection.availableExercises).size===selection.availableExercises.length,'Revisá fecha, texto y equipamiento');
 const p=api.S.programmeAt(selection.day,data.settings),slot=api.S.planned(selection.day,data.settings),known=new Set(api.Gym.names104(data.settings));check(p&&slot>=4&&selection.availableExercises.every(x=>known.has(x)),'Elegí una rutina personal futura y ejercicios registrados');
 const routine=api.Gym.templates(data.settings)[slot-4];
 const input={version:1,question:selection.question.trim(),goal:selection.goal.trim(),routine:clone(routine.entries.map(e=>({name:e.exercise,sets:e.sets,min:e.min,max:e.max,rest:e.rest}))),availableMinutes:p.minutes,scope:selection.scope,choices:selection.availableExercises.map((name,i)=>({alias:'e'+(i+1),name}))};
 return {selection:clone(selection),input,slot,programId:p.id,basis:JSON.stringify([today,data.settings,data.running1174??null,data.sport1177??null,Object.keys(data.work??{}).sort()])};
}
function toNative(data,review,reply,confirmed,changeId,today,api){
 check(confirmed===true,'Confirmá el material y las acciones sugeridas antes de revisar su efecto local');check(eq(preview(data,review.selection,today,api),review),'Cambió la configuración; prepará una consulta nueva');
 check(exact(reply,['kind','answer','questions','operations'])&&reply.kind==='proposal'&&Array.isArray(reply.operations)&&reply.operations.length>=1&&reply.operations.length<=12&&Array.isArray(reply.questions)&&!reply.questions.length,'No existe una propuesta ejecutable');
 const ops=reply.operations.map(o=>{check(exact(o,['type','at','to','choice','sets','min','max','rest']),'Acción no admitida');const dose={sets:o.sets,min:o.min,max:o.max,rest:o.rest};
 if(o.type==='add'||o.type==='replace'){const choice=review.input.choices.find(x=>x.alias===o.choice);check(choice,'Ejercicio no confirmado');return {type:o.type,at:o.at,entry:{exercise:choice.name,...dose}}}
 if(o.type==='remove')return {type:'remove',at:o.at};if(o.type==='move')return {type:'move',from:o.at,to:o.to};if(o.type==='dose')return {type:'dose',at:o.at,...dose};throw Error('Acción no admitida');});
 return api.A.review(data,{day:review.selection.day,scope:review.selection.scope,reason:'Propuesta de Coach revisada por el usuario',availableExercises:review.selection.availableExercises,operations:ops},changeId,today,api);
}
root.asiaCoachContext1181=Object.freeze({preview,toNative});
})(globalThis);
