/* Asia 2027 V8.4.3 — optional, read-only Coach context. No network, no storage. */
(function(root){'use strict';
const validDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const shift=(d,n)=>new Date(Date.parse(d)+86400000*n).toISOString().slice(0,10);
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const mean=a=>a.length?Math.round(a.reduce((s,x)=>s+x,0)/a.length*100)/100:null;
const GROUPS=['Pecho','Espalda','Hombros','Bíceps','Tríceps','Abdomen','Glúteos','Cuádriceps','Isquiotibiales','Gemelos'];
function build(data,ctx,map={},catalog=[],validSlot=()=>false){
 const end=ctx?.last_7?.end,today=ctx?.today;
 if(!validDay(end)||!validDay(today)||end>=today)throw Error('Período de Coach inválido');
 const start=shift(end,-13), groups=Object.fromEntries(GROUPS.map(g=>[g,{recent:0,previous:0}])), known=new Set(catalog), rows=[], periods=[{days:new Set(),sets:0,rir:[],custom:0,unmapped:0,invalid:0},{days:new Set(),sets:0,rir:[],custom:0,unmapped:0,invalid:0}];
 for(const [key,w] of Object.entries(data?.work||{})){
  const d=key.slice(0,10),m=/^\d{4}-\d{2}-\d{2}_(0|[1-9]\d?)$/.exec(key);if(!m||!validDay(d)||d<start||d>end)continue;
  const slot=Number(m[1]);if(slot>3&&!validSlot(key,data.settings))continue;
  const p=d>=shift(end,-6)?0:1,period=periods[p];let sessionSets=0;
  for(const [name,sets] of Object.entries(w?.ex||{})){
   if(!Array.isArray(sets))continue;
   const done=sets.filter(s=>s?.done===true),valid=done.filter(s=>finite(s.kg,0,1000)&&Number.isInteger(s.reps)&&finite(s.reps,1,100));period.invalid+=done.length-valid.length;if(!valid.length)continue;
   const muscle=Object.hasOwn(map,name)&&Array.isArray(map[name])?[...new Set(map[name].filter(g=>GROUPS.includes(g)))]:[];
   if(!muscle.length)period.unmapped+=valid.length;for(const g of muscle)groups[g][p===0?'recent':'previous']+=valid.length;
   sessionSets+=valid.length;period.sets+=valid.length;
   const rir=valid.map(s=>Number.isInteger(s.rir828)&&finite(s.rir828,0,10)?s.rir828:null);period.rir.push(...rir.filter(x=>x!==null));
   // Only fixed catalog names; no custom routine titles, notes, photos, or raw records.
   if(known.has(name)||Object.hasOwn(map,name))rows.push({day:d,slot,exercise:name,sets:valid.slice(0,12).map((s,i)=>[s.kg,s.reps,rir[i]]),sets_total:valid.length});
  }
  if(sessionSets){period.days.add(d);if(slot>3)period.custom++;}
 }
 rows.sort((a,b)=>b.day.localeCompare(a.day)||a.slot-b.slot||a.exercise.localeCompare(b.exercise));
 // Reserve space for the existing Coach conversation and reviewed memory.
 const recent=[];let size=0;const keys=new Map();for(const r of rows){const k=JSON.stringify([r.slot,r.exercise]),count=keys.get(k)||0;if(count>=2)continue;const n=JSON.stringify(r).length;if(size+n>3800||recent.length>=24)break;recent.push(r);size+=n;keys.set(k,count+1);}
 const summary=p=>({recorded_days:p.days.size,effective_sets:p.sets,rir_recorded_sets:p.rir.length,mean_rir:mean(p.rir),custom_sessions:p.custom,unmapped_sets:p.unmapped,invalid_completed_sets:p.invalid});
 return {start,end,recent_7:summary(periods[0]),previous_7:summary(periods[1]),muscle_sets:groups,exercise_examples:recent,examples_total:rows.length,examples_sent:recent.length,description:'Solo diario manual original, 14 días cerrados. Cada ejemplo incluye kg, repeticiones, RIR por serie (null = sin dato). Slot 0–3 original; >=4 personalizado. Los ejemplos son una selección acotada, no todas las sesiones. Series válidas completadas; sin aproximaciones, fotos, nombres de rutinas personalizados, notas ni Apple Salud. Cada serie puede contar en varios grupos. Ausencia de registros no prueba descanso o recuperación. Contexto de consulta orientativa, no orden para modificar metas.'};
}
const api=Object.freeze({build});if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.asiaCoachElite843=api;
})(globalThis);
