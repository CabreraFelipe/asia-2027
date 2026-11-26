// Bounded local calendar search. No network, persistence, auto dose or goal creation.
const check=(v,m)=>{if(!v)throw Error(m)},obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),exact=(x,k)=>obj(x)&&Object.keys(x).length===k.length&&k.every(a=>Object.hasOwn(x,a)),int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,clone=x=>JSON.parse(JSON.stringify(x)),keys=['strength','running','sport','nutrition'],prefix={strength:'coachchange',running:'runplan',sport:'sportplan',nutrition:'nut'},day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
function combinations(allowed,n){const out=[];function visit(i,chosen){if(chosen.length===n){out.push(chosen);return}for(let j=i;j<=allowed.length-(n-chosen.length);j++)visit(j+1,[...chosen,allowed[j]])}visit(0,[]);return out}
function options(block,count,min,max){
 if(block===null){check(count===null,'Frecuencia sin disciplina');return [null]}
 check(obj(block)&&Array.isArray(block.days)&&block.days.length<=7&&new Set(block.days).size===block.days.length&&block.days.every(d=>int(d,0,6))&&int(count,min,max)&&count<=block.days.length,'Confirmá disponibilidad y frecuencia de cada disciplina');
 return combinations([...block.days].sort((a,b)=>a-b),count);
}
const overlap=(a,b)=>a&&b&&a.start<=b.end&&b.start<=a.end;
function adjacent(dates){let n=0;for(let i=1;i<dates.length;i++)if(Date.parse(dates[i])-Date.parse(dates[i-1])===86400000)n++;return n}
export function generateCalendar1189({data,draft,frequency,proDates,today,api,current,bundle,newId,maxAttempts=160,limit=8}){
 check(exact(draft,['version',...keys])&&draft.version===1&&keys.some(k=>draft[k]!==null)&&exact(frequency,['running','sport'])&&day(today)&&typeof newId==='function'&&typeof bundle?.review==='function'&&typeof bundle?.apply==='function'&&int(maxAttempts,1,240)&&int(limit,1,8),'Generación inválida');
 check(Array.isArray(proDates)&&proDates.length<=2000&&proDates.every(day),'Agenda PRO inválida');const occupied=new Set(proDates),run=options(draft.running,frequency.running,2,4),sport=options(draft.sport,frequency.sport,1,3);
 check(draft.running!==null||draft.sport!==null,'Seleccioná Running o rendimiento deportivo para distribuir días');
 // Reject missing or unsafe profiles up front, even when other modules are valid.
 if(draft.running!==null)check(draft.running.profile?.symptoms==='Sin síntomas preocupantes','Confirmá el perfil Running sin síntomas preocupantes antes de aumentar carga');
 if(draft.sport!==null){const book=api.G(data.settings?.goals101),p=api.Sport.validate(data.sport1177,book).profiles[draft.sport.profileId];check(p&&p.safeSpace&&p.symptoms==='Sin síntomas preocupantes'&&p.inventory!==null,'Confirmá espacio, síntomas y material deportivo (lista vacía si no hay material)')}
 const candidates=[];for(const r of run)for(const s of sport){if(r&&s&&overlap(draft.running,draft.sport)&&r.some(d=>s.includes(d)))continue;candidates.push({r,s})}
 // Prefer a spaced week without changing requested session counts; native engine
 // still decides actual dates, recovery, race taper and compatible exercise doses.
 const spacing=x=>{const ds=[...new Set([...(x.r??[]),...(x.s??[])])];return ds.filter(d=>ds.includes((d+1)%7)).length};
 candidates.sort((a,b)=>spacing(a)-spacing(b)||JSON.stringify(a).localeCompare(JSON.stringify(b)));
 const results=[];let attempted=0,rejected=0;for(const {r,s} of candidates){
  if(attempted>=maxAttempts)break;attempted++;
  const raw={...draft,running:r?{...draft.running,days:r}:null,sport:s?{...draft.sport,days:s}:null},ids=Object.fromEntries(keys.map(k=>[k,raw[k]===null?null:newId(prefix[k])]));
  try{const p=bundle.review(data,raw,ids,today,api,current);if(p.view.affectedDates.some(d=>occupied.has(d))){rejected++;continue}bundle.apply(data,p,today,api,current);const actual=[...new Set([...(p.view.running?.after??[]).map(x=>x.day),...(p.view.sport?.after??[]).map(x=>x.day),...(p.view.strength?.dates??[])])].sort();results.push({raw:clone(p.draft),view:clone(p.view),adjacent:adjacent(actual)});}
  catch{rejected++}
 }
 results.sort((a,b)=>a.adjacent-b.adjacent||JSON.stringify(a.raw).localeCompare(JSON.stringify(b.raw)));
 return {alternatives:results.slice(0,limit).map(({raw,view})=>({raw,view})),attempted,rejected,searchLimited:attempted<candidates.length,compatible:results.length};
}
