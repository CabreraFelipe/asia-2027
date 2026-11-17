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
 const n=Object.values(w?.ex||{}).reduce((acc,a)=>acc+(Array.isArray(a)?a.filter(s=>s?.done===true&&val(s.kg,0,1000)!==null&&Number.isInteger(s.reps)&&val(s.reps,1,100)!==null).length:0),0);if(n){const old=byDay.get(d)||[0,0];byDay.set(d,[old[0]+1,old[1]+n]);}}
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
// V8.8.7: shared closed-day control; no storage, no network, no goal changes.
const prep887='2026-11-16',trip887='2027-03-08',vac887=d=>d>='2026-12-26'&&d<='2027-01-07';
const monday887=d=>shift(d,-((new Date(d+'T00:00:00Z').getUTCDay()+6)%7));
const set887=s=>s?.done===true&&val(s.kg,0,1000)!==null&&Number.isInteger(s.reps)&&val(s.reps,1,100)!==null;
function nutritionStatus887(d,r){if(!day(d)||d<prep887||d>=trip887||vac887(d)||!['yes','partial','no'].includes(r?.ad)||r.intakeComplete!==true||val(r.intakeKcal,0,15000)===null||val(r.proteinG,0,1000)===null)return null;return r.ad;}
function control887(data,start,end,today,planned){
 if(![start,end,today].every(day)||start>end||end>=today||days(start,end)>3660)throw Error('Control: período no cerrado');
 const report=windowReport(data,start,end),adherence={yes:0,partial:0,no:0},legacy={yes:0,partial:0,no:0};let eligible=0,vacation=0,outside=0,historicalGoals=0,plannedCount=0,matched=0,optional=0,cardio=[],recovery=[],fatigue=[],sessions=[];
 for(let d=start;d<=end;d=shift(d,1)){
  const r=data.diet?.[d]||{},v=vac887(d),inPlan=d>=prep887&&d<trip887;
  if(v)vacation++;else if(!inPlan)outside++;else{eligible++;if(Object.hasOwn(adherence,r.ad)){
   if(nutritionStatus887(d,r)){adherence[r.ad]++;const g=r.nutritionGoal880;if(g&&val(g.calories,1900,2300)!==null&&val(g.protein,130,170)!==null&&g.kcal===r.intakeKcal&&g.proteinG===r.proteinG&&g.ad===r.ad)historicalGoals++;}
   else legacy[r.ad]++;
  }}
  const rec=val(manual(r.recovery),1,5),fat=val(manual(r.fatigue43),1,5);if(rec!==null)recovery.push(rec);if(fat!==null)fatigue.push(fat);
  const slot=planned(d,data.settings),expected=slot!=null;if(expected)plannedCount++;
  let hit=false;
  for(const [key,w] of Object.entries(data.work||{})){if(!key.startsWith(d+'_')||!/^\d{4}-\d{2}-\d{2}_\d+$/.test(key))continue;const count=Object.values(w?.ex||{}).reduce((a,ss)=>a+(Array.isArray(ss)?ss.filter(set887).length:0),0);if(!count)continue;
   const routine=Number(key.split('_')[1]),match=expected&&routine===slot;if(match)hit=true;else optional++;
   sessions.push({day:d,routine,sets:count,matching:match});const c=val(manual(w.cardioMin),0,1440);if(c!==null)cardio.push(c);
  }if(hit)matched++;
 }
 const evaluated=Object.values(adherence).reduce((a,b)=>a+b,0),legacyCount=Object.values(legacy).reduce((a,b)=>a+b,0);
 return {start,end,report,eligible,vacation,outside,adherence,legacy,evaluated,legacyCount,historicalGoals,pending:eligible-evaluated-legacyCount,planned:plannedCount,matched,optional,sessions,cardio:metric(cardio,true),recovery:metric(recovery),fatigue:metric(fatigue)};
}
function weekly887(data,control,today,planned){if(!day(control)||!day(today)||monday887(control)!==control||control>today) return null;const current=control887(data,shift(control,-7),shift(control,-1),today,planned),prior=windowReport(data,shift(control,-14),shift(control,-8));return {control,current,prior,weightChange:current.report.weight.count>=3&&prior.weight.count>=3?current.report.weight.value-prior.weight.value:null};}
function trajectory887(body,asOf,end=shift(asOf,-1)){
 if(!day(asOf)||!day(end)||end>=asOf)throw Error('Fecha de trayectoria inválida');
 const pts=Object.entries(body||{}).filter(([d,b])=>day(d)&&d<=end&&d>=shift(end,-41)&&val(b?.weight,20,300)!==null).sort(([a],[b])=>a.localeCompare(b));
 const recent=pts.filter(([d])=>d>=shift(end,-6)),previous=pts.filter(([d])=>d>=shift(end,-13)&&d<shift(end,-6)),mean7=avg(recent.map(([,b])=>b.weight)),gap=mean7===null?null:mean7-72;
 const baseInfo={pts,mean7,gap,count7:recent.length,previousCount:previous.length};
 if(asOf>=trip887)return {...baseInfo,reason:'La fecha del viaje ya llegó.'};
 if(recent.length<3||previous.length<3||!pts.length||days(pts[0][0],pts.at(-1)[0])-1<14)return {...baseInfo,reason:'Escenario pendiente: al menos 3 pesajes en cada uno de los dos últimos bloques de 7 días cerrados y un intervalo total de 14 días.'};
 const x=pts.map(([d])=>days(asOf,d)-1),y=pts.map(([,b])=>b.weight),xm=avg(x),ym=avg(y),ss=x.reduce((a,v)=>a+(v-xm)**2,0),slope=x.reduce((a,v,i)=>a+(v-xm)*(y[i]-ym),0)/ss,base=ym-slope*xm,remaining=days(asOf,trip887)-1;
 // Model only the remaining calendar days; vacation dates already elapsed are not subtracted twice.
 const vacDays=Array.from({length:remaining},(_,i)=>shift(asOf,i+1)).filter(vac887).length,active=remaining-vacDays,projected=base+slope*remaining,scenario=base+slope*active,unsteady=Math.abs(slope*7)>1||val(projected,20,300)===null||val(scenario,20,300)===null;
 return {...baseInfo,base,slope,projected,scenario,vacDays,active,unsteady};
}
const api={build,csv,labels,windowReport,steps828,coach28,control887,weekly887,trajectory887,nutritionStatus887};if(typeof module==='object'&&module.exports)module.exports=api;else root.asiaProgress818=api;
})(typeof window==='object'?window:globalThis);
