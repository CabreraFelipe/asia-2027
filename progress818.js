/* R18: read-only reports from original V6 records. No persistence or network. */
(function(root){'use strict';
const day=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const shift=(s,n)=>new Date(Date.parse(s)+86400000*n).toISOString().slice(0,10);
const days=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/86400000)+1;
const val=(x,min=0,max=Infinity)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max?x:null;
const manual=x=>typeof x==='string'&&/^\d+(?:\.\d+)?$/.test(x.trim())?Number(x):x;
const savedApple=r=>{const a=r?.stepsApple881;return a&&Number.isInteger(a.count)&&Number.isSafeInteger(a.updatedAt)&&a.updatedAt>0?val(a.count,0,100000):null;};
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const metric=(a,total=false)=>({value:a.length?(total?a.reduce((x,y)=>x+y,0):avg(a)):null,count:a.length});
function windowReport(data,start,end){
 const body=[],fat=[],waist=[],muscle=[],kcal=[],protein=[],sleep=[],steps=[],sets=[],sessions=[];let complete=0;
 for(let i=0;i<days(start,end);i++){const d=shift(start,i),b=data.body?.[d]||{},r=data.diet?.[d]||{};for(const [a,x,lo,hi] of [[body,b.weight,20,300],[fat,b.fat,0,70],[waist,b.waist,30,250],[muscle,b.muscle,0,200],[sleep,manual(r.sleep),0,24],[steps,savedApple(r)??manual(r.steps),0,100000]]){const v=val(x,lo,hi);if(v!==null)a.push(v)}
 if(r.intakeComplete===true){const k=val(r.intakeKcal,0,15000),p=val(r.proteinG,0,1000);if(k!==null&&p!==null){complete++;kcal.push(k);protein.push(p)}}}
 const byDay=new Map();for(const [key,w] of Object.entries(data.work||{})){const d=key.slice(0,10);if(!day(d)||d<start||d>end||!/^\d{4}-\d{2}-\d{2}_\d+$/.test(key))continue;
 const n=Object.values(w?.ex||{}).reduce((acc,a)=>acc+(Array.isArray(a)?a.filter(s=>s?.done===true&&val(s.kg,0,1000)!==null&&Number.isInteger(s.reps)&&val(s.reps,1,1000)!==null).length:0),0);if(n){const old=byDay.get(d)||[0,0];byDay.set(d,[old[0]+1,old[1]+n]);}}
 for(const [s,n] of byDay.values()){sessions.push(s);sets.push(n)}
 return {start,end,days:days(start,end),complete,weight:metric(body),fat:metric(fat),waist:metric(waist),muscle:metric(muscle),kcal:metric(kcal),protein:metric(protein),sleep:metric(sleep),steps:metric(steps),sessions:metric(sessions,true),sets:metric(sets,true)};
}
function build(data,start,end,today,group='week',all=false){
 if(![start,end,today].every(day)||start>end||days(start,end)>3660||!['week','month'].includes(group))throw Error('Período inválido');
 const closed=end<today?end:shift(today,-1);if(closed<start)return {current:null,prior:null,groups:[],excludedToday:end>=today};
 const current=windowReport(data,start,closed),prior=all?null:windowReport(data,shift(start,-current.days),shift(start,-1));
 const groups=[];let a=start;while(a<=closed){const dt=new Date(a+'T00:00:00Z'),last=group==='week'?shift(a,(7-dt.getUTCDay())%7):new Date(Date.UTC(dt.getUTCFullYear(),dt.getUTCMonth()+1,0)).toISOString().slice(0,10),b=last<closed?last:closed;groups.push(windowReport(data,a,b));a=shift(b,1);}return {current,prior,groups,excludedToday:end>=today};
}
const labels=[['weight','Peso medio','kg'],['fat','Grasa corporal media','%'],['muscle','Masa muscular media','kg'],['waist','Cintura media','cm'],['kcal','Calorías medias (días completos)','kcal'],['protein','Proteína media (días completos)','g'],['sessions','Sesiones con series','sesiones'],['sets','Series completadas','series'],['sleep','Sueño manual medio','h'],['steps','Pasos registrados medios','pasos']];
function csv(report){const head=['desde','hasta','dias','dias_nutricion_completos',...labels.flatMap(([k])=>[k,k+'_dias_con_datos'])];return [head,...report.groups.map(r=>[r.start,r.end,r.days,r.complete,...labels.flatMap(([k])=>[r[k].value===null?'':Number(r[k].value.toFixed(2)),r[k].count])])].map(r=>r.join(',')).join('\r\n')+'\r\n';}
// Apple steps saved per day, legacy session fallback only for comparison. Never add sources.
function steps828(data,start,end,health){if(!day(start)||!day(end)||start>end||days(start,end)>3660)throw Error('Período inválido');const manualValues=[],appleValues=[],chosen=[];let overlap=0,conflicts=0;for(let i=0;i<days(start,end);i++){const d=shift(start,i),m=val(manual(data.diet?.[d]?.steps),0,100000),a=savedApple(data.diet?.[d])??val(health?.(d)?.steps,0,100000);if(m!==null)manualValues.push(m);if(a!==null)appleValues.push(a);if(a!==null&&m!==null){overlap++;if(a!==m)conflicts++;}if(a!==null||m!==null)chosen.push(a??m);}return {manual:metric(manualValues),apple:metric(appleValues),preferred:metric(chosen),overlap,conflicts};}
// Coach uses the closed-day nutrition, weight and training metrics; no Apple steps are exported here.
function coach28(data,end,today){
 if(!day(end)||!day(today)||end>=today)throw Error('Período de Coach inválido');
 const compact=m=>({n:m.count,mean:m.value===null?null:Number(m.value.toFixed(2))});
 const weeks=Array.from({length:4},(_,i)=>{const w=windowReport(data,shift(end,-27+i*7),shift(end,-21+i*7));return {start:w.start,end:w.end,weight_kg:compact(w.weight),intake_kcal:compact(w.kcal),protein_g:compact(w.protein),manual_sessions:w.sessions.value,completed_sets:w.sets.value,training_days:w.sessions.count};});
 const first=windowReport(data,shift(end,-27),shift(end,-14)),last=windowReport(data,shift(end,-13),end);
 // Require at least one weigh-in in each of the four blocks; never infer missing weeks.
 const comparable=weeks.every(w=>w.weight_kg.n>0);
 return {start:weeks[0].start,end,weeks,weight_change_14d_kg:comparable?Number((last.weight.value-first.weight.value).toFixed(2)):null,weight_coverage:{previous_14:first.weight.count,recent_14:last.weight.count}};
}
const api={build,csv,labels,windowReport,steps828,coach28};if(typeof module==='object'&&module.exports)module.exports=api;else root.asiaProgress818=api;
})(typeof window==='object'?window:globalThis);
