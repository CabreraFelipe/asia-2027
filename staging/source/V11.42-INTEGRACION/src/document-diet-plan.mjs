// Pure, proposed dietary plan and adherence book. No writes to diary, calories or historical intake.
// Alternatives are mutually exclusive choices, not additional food to consume.
import {validateExtractedPlan} from './document-plan-import.mjs';
const check=(v,m)=>{if(!v)throw Error(m)},obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),exact=(x,ks)=>obj(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k)),clone=x=>JSON.parse(JSON.stringify(x));
const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&x>='1900-01-01'&&x<='2199-12-31'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const id=x=>typeof x==='string'&&/^dietplan-[a-f0-9]{32}$/.test(x),int=(x,a,b)=>Number.isSafeInteger(x)&&x>=a&&x<=b;
const weekday=x=>new Date(x+'T00:00:00Z').getUTCDay(),add=x=>new Date(Date.parse(x)+86400000).toISOString().slice(0,10);
const statuses=['followed','partial','skipped'],empty=()=>({version:1,plans:[],logs:[]});
const choices=s=>s.alternatives??[{label:'Plan indicado',items:s.items}];
function schedule(p,date){
 if(date<p.start||date>p.end)return null;
 const i=p.dayMap[weekday(date)];return i===null?null:p.document.days[i];
}
function validatePlan(p){
 check(exact(p,['id','created','start','end','dayMap','document'])&&id(p.id)&&day(p.created)&&day(p.start)&&day(p.end)&&p.start>=p.created&&p.end>=p.start&&Date.parse(p.end)-Date.parse(p.start)<=365*86400000,'Fechas de dieta inválidas');
 const d=validateExtractedPlan(p.document);
 check(d.kind==='diet'&&d.uncertainties.length===0&&Array.isArray(p.dayMap)&&p.dayMap.length===7&&p.dayMap.every(i=>i===null||int(i,0,d.days.length-1))&&new Set(p.dayMap.filter(i=>i!==null)).size===d.days.length,'Revisá todos los días y las incertidumbres');
 for(const [w,i] of p.dayMap.entries())if(i!==null&&d.days[i].weekday!==null)check(d.days[i].weekday===w,'El día del documento no coincide con el calendario');
 return p;
}
export function validateDietPlanBook(raw){
 const b=raw===undefined?empty():raw;
 check(exact(b,['version','plans','logs'])&&b.version===1&&Array.isArray(b.plans)&&b.plans.length<=24&&Array.isArray(b.logs)&&b.logs.length<=5000,'Libro de dietas inválido');
 const plans=new Map();
 for(const p of b.plans){
  validatePlan(p);check(!plans.has(p.id),'Plan duplicado');
  for(const other of plans.values())check(p.end<other.start||p.start>other.end,'Planes solapados');
  plans.set(p.id,p);
 }
 const seen=new Set();
 for(const l of b.logs){
  check(exact(l,['planId','day','meal','choice','status'])&&day(l.day)&&plans.has(l.planId)&&statuses.includes(l.status),'Registro de adherencia inválido');
  const p=plans.get(l.planId),d=schedule(p,l.day);check(d&&int(l.meal,0,d.sections.length-1),'Comida no prevista');
  check(l.status==='skipped'?l.choice===null:int(l.choice,0,choices(d.sections[l.meal]).length-1),'Alternativa inválida');
  const k=JSON.stringify([l.planId,l.day,l.meal]);check(!seen.has(k),'Registro repetido');seen.add(k);
 }
 check(new TextEncoder().encode(JSON.stringify(b)).length<=768*1024,'Libro de dietas demasiado grande');
 return clone(b);
}
export function reviewDietPlan(raw,document,config,today){
 const b=validateDietPlanBook(raw);
 check(day(today)&&exact(config,['id','start','end','dayMap']),'Configuración inválida');
 const p=validatePlan({id:config.id,created:today,start:config.start,end:config.end,dayMap:clone(config.dayMap),document:validateExtractedPlan(document)});
 validateDietPlanBook({...b,plans:[...b.plans,p]});
 return {basis:JSON.stringify(b),plan:clone(p),view:{name:p.document.name,start:p.start,end:p.end,days:p.dayMap.map(i=>i===null?null:p.document.days[i]),notes:p.document.notes}};
}
export function applyDietPlan(raw,review,today,{confirmed=false}={}){
 const b=validateDietPlanBook(raw);
 check(confirmed===true&&review?.basis===JSON.stringify(b)&&review.plan?.created===today,'Confirmá una revisión vigente');
 const p=review.plan,fresh=reviewDietPlan(b,p.document,{id:p.id,start:p.start,end:p.end,dayMap:p.dayMap},today);
 check(JSON.stringify(fresh.view)===JSON.stringify(review.view)&&JSON.stringify(fresh.plan)===JSON.stringify(p),'Cambió la revisión');
 return validateDietPlanBook({...b,plans:[...b.plans,p]});
}
export function dietDay(raw,date){
 check(day(date),'Fecha inválida');const b=validateDietPlanBook(raw),p=b.plans.find(p=>schedule(p,date)!==null);
 if(!p)return null;const d=schedule(p,date);
 return {planId:p.id,name:p.document.name,day:date,label:d.label,notes:p.document.notes,meals:d.sections.map((s,i)=>({index:i,label:s.label,alternatives:choices(s),log:b.logs.find(l=>l.planId===p.id&&l.day===date&&l.meal===i)??null}))};
}
export function recordDietMeal(raw,entry,today,{confirmed=false}={}){
 check(confirmed===true&&day(today)&&day(entry?.day)&&entry.day<=today,'Confirmá una comida de hoy o pasada');
 const b=validateDietPlanBook(raw),next=clone(entry);
 const logs=b.logs.filter(l=>!(l.planId===next.planId&&l.day===next.day&&l.meal===next.meal));
 return validateDietPlanBook({...b,logs:[...logs,next]});
}
export function dietAdherence(raw,from,to,today){
 const b=validateDietPlanBook(raw);
 check(day(from)&&day(to)&&day(today)&&from<=to&&to<=today&&Date.parse(to)-Date.parse(from)<=365*86400000,'Período inválido');
 const logs=new Map(b.logs.map(l=>[JSON.stringify([l.planId,l.day,l.meal]),l.status]));
 const result={scheduled:0,followed:0,partial:0,skipped:0,unrecorded:0};
 for(const p of b.plans)for(let d=from;d<=to;d=add(d)){
  const row=schedule(p,d);if(!row)continue;
  for(let i=0;i<row.sections.length;i++){result.scheduled++;result[logs.get(JSON.stringify([p.id,d,i]))??'unrecorded']++}
 }
 const recorded=result.followed+result.partial+result.skipped;
 return {...result,recorded,completionRate:result.scheduled?recorded/result.scheduled:null,followedRate:recorded?result.followed/recorded:null};
}
