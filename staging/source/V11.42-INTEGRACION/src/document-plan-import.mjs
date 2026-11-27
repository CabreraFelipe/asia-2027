// Document import boundary. No provider mounted, no automatic writes or historical intake.
// The provider must treat file contents as untrusted data, not instructions.
const check=(ok,msg)=>{if(!ok)throw Error(msg)},obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),exact=(x,keys)=>obj(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k)),clone=x=>JSON.parse(JSON.stringify(x));
const txt=(s,n)=>typeof s==='string'&&s.trim()===s&&s.length>0&&s.length<=n&&!/[\u0000-\u001f\u007f]/.test(s),nullable=(x,f)=>x===null||f(x),int=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const array=(x,min,max)=>Array.isArray(x)&&x.length>=min&&x.length<=max;
const validSession=s=>s?.ok===true&&s.syntheticOnly===false&&typeof s.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>=16;
const types=['application/pdf','image/jpeg','image/png'],maxBytes=10*1024*1024;
const prefix=(bytes,values)=>values.every((v,i)=>bytes[i]===v);
export function validatePlanFile({mime,bytes}={}){
 check(types.includes(mime)&&bytes instanceof Uint8Array&&bytes.length>=8&&bytes.length<=maxBytes,'Archivo inválido o demasiado grande');
 const signatures={'application/pdf':[37,80,68,70,45],'image/jpeg':[255,216,255],'image/png':[137,80,78,71,13,10,26,10]};
 check(prefix(bytes,signatures[mime]),'El contenido no coincide con el formato indicado');
 return {mime,bytes:new Uint8Array(bytes)};
}
// Unknown quantities/doses remain null. Each extracted item retains a short source excerpt.
export function validateExtractedPlan(x){
 check(exact(x,['version','kind','name','days','notes','uncertainties'])&&x.version===1&&['diet','routine'].includes(x.kind)&&txt(x.name,80)&&array(x.days,1,31)&&nullable(x.notes,s=>txt(s,1000))&&array(x.uncertainties,0,40)&&x.uncertainties.every(s=>txt(s,300)),'Plan extraído inválido');
 for(const day of x.days){
  check(exact(day,['label','weekday','sections'])&&txt(day.label,80)&&nullable(day.weekday,n=>int(n,0,6))&&array(day.sections,1,12),'Día inválido');
  for(const section of day.sections){
   const simple=exact(section,['label','items'])&&array(section.items,1,30);
   const choices=x.kind==='diet'&&exact(section,['label','alternatives'])&&array(section.alternatives,1,8)&&section.alternatives.every(a=>exact(a,['label','items'])&&txt(a.label,80)&&array(a.items,1,30));
   check(txt(section.label,80)&&(simple||choices),'Sección inválida');
   const items=simple?section.items:section.alternatives.flatMap(a=>a.items);
   for(const item of items){
    if(x.kind==='diet')check(exact(item,['name','quantity','source'])&&txt(item.name,120)&&nullable(item.quantity,s=>txt(s,100))&&txt(item.source,300),'Alimento inválido');
    else check(exact(item,['name','sets','min','max','rest','source'])&&txt(item.name,120)&&nullable(item.sets,n=>int(n,1,100))&&nullable(item.min,n=>int(n,1,1000))&&nullable(item.max,n=>int(n,1,1000))&&(item.min===null||item.max===null||item.min<=item.max)&&nullable(item.rest,n=>int(n,0,3600))&&txt(item.source,300),'Ejercicio inválido');
   }
  }
 }
 check(new TextEncoder().encode(JSON.stringify(x)).length<=120000,'Plan demasiado grande');
 return clone(x);
}
export async function extractDocumentPlan({enabled=false,consent=false,file,readSession,extract}={}){
 check(enabled===true&&consent===true&&typeof readSession==='function'&&typeof extract==='function','Importación no habilitada o sin consentimiento');
 const s=await readSession();check(validSession(s),'Sesión inválida');
 const account=s.accountId,csrf=s.csrf,verified=async()=>{const f=await readSession();check(validSession(f)&&f.accountId===account&&f.csrf===csrf,'Cambió la sesión')};
 const safe=validatePlanFile(file);try{
  await verified();
  // Adapter receives only the file, not account identity, diary or credentials.
  const response=await extract(safe);
  await verified();
  return validateExtractedPlan(response);
 }finally{safe.bytes.fill(0)}
}
// Convert reviewed, fully specified strength rows into existing native routine templates.
// Exact catalog mapping only: unknown or ambiguous names require explicit user correction.
export function reviewNativeRoutines(data,plan,Gym){
 const p=validateExtractedPlan(plan);check(p.kind==='routine'&&p.uncertainties.length===0&&p.notes===null,'Revisá las incertidumbres o instrucciones no representables');
 check(typeof Gym?.names104==='function'&&typeof Gym?.append==='function'&&typeof Gym?.templates==='function'&&typeof Gym?.compatibleSettings==='function','Gym no disponible');
 const settings=data.settings??{},known=new Set(Gym.names104(settings));let next=settings;const slots=[];
 for(const day of p.days){
  check(day.sections.length===1,'Separá o revisá las secciones del entrenamiento');
  const entries=day.sections[0].items.map(item=>{
   check(known.has(item.name)&&[item.sets,item.min,item.max,item.rest].every(v=>v!==null),'Confirmá el ejercicio, series, repeticiones y descanso');
   return {exercise:item.name,sets:item.sets,min:item.min,max:item.max,rest:item.rest};
  });
  const name=day.label;check(name.length<=64,'Nombre de rutina demasiado largo');
  const slot=4+Gym.templates(next).length;next=Gym.append(next,{name,entries});
  slots.push({slot,name,weekday:day.weekday,entries});
 }
 Gym.compatibleSettings(settings,next,data.work);
 return {basis:JSON.stringify([settings,data.work??{}]),draft:p,view:slots};
}
export function applyNativeRoutines(data,review,Gym,{confirmed=false}={}){
 check(confirmed===true&&review?.basis===JSON.stringify([data.settings??{},data.work??{}]),'Confirmá el plan con los datos actuales');
 const fresh=reviewNativeRoutines(data,review.draft,Gym);
 check(JSON.stringify(fresh.view)===JSON.stringify(review.view),'Cambió la revisión');
 let settings=data.settings??{};
 for(const {name,entries} of fresh.view)settings=Gym.append(settings,{name,entries});
 Gym.compatibleSettings(data.settings??{},settings,data.work);
 return {...data,settings};
}

// Schedule the exact imported templates; never regenerate a routine from objective or equipment.
// Require the already activated personal calendar (or the original post-programme boundary).
const calendarDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&d>='1900-01-01'&&d<='2199-12-31'&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const nextDay=d=>new Date(Date.parse(d)+86400000).toISOString().slice(0,10);
const calendarBasis=(data,today)=>JSON.stringify([today,data.settings??{},data.work??{},data.running1174??null,data.sport1177??null]);
function prepareRoutineProgramme(data,document,config,today,{Gym,S,T,R,Sport}){
 check(calendarDay(today)&&exact(config,['id','name','start','end','objective','equipment','minutes','equipmentConfirmed'])&&typeof config.id==='string'&&/^prog-[a-f0-9]{32}$/.test(config.id)&&config.equipmentConfirmed===true,'Confirmá fechas y equipamiento disponible');
 const p=validateExtractedPlan(document),before=data.settings??{};
 check(p.kind==='routine'&&p.days.length>=2&&p.days.length<=6&&p.days.every(d=>int(d.weekday,0,6))&&new Set(p.days.map(d=>d.weekday)).size===p.days.length,'Asigná entre dos y seis días distintos de la semana');
 const c=T.config({name:config.name,start:config.start,end:config.end,objective:config.objective,equipment:config.equipment,minutes:config.minutes,days:p.days.map(d=>d.weekday)},before);
 check(c.start>=today,'No se modifica el calendario pasado');
 const previous=S.programmes(before);
 check(!previous.some(p=>p.id===config.id||!p.cancelled&&c.start<=p.end&&c.end>=p.start),'Ya existe un programa en esas fechas');
 const review=reviewNativeRoutines(data,p,Gym);
 check(review.view.every(r=>T.estimate(r.entries)<=c.minutes),'La duración orientativa de la rutina supera el tiempo confirmado');
 const next=applyNativeRoutines(data,review,Gym,{confirmed:true}),days=review.view.map(r=>({weekday:r.weekday,slot:r.slot})).sort((a,b)=>(a.weekday+6)%7-(b.weekday+6)%7);
 const programme={id:config.id,name:c.name,start:c.start,end:c.end,objective:c.objective,equipment:c.equipment,minutes:c.minutes,days,cancelled:false};
 const settings={...next.settings,programmes102:[...previous,programme].sort((a,b)=>a.start.localeCompare(b.start))};
 S.programmes(settings);Gym.compatibleSettings(before,settings,data.work);
 const dates=[];
 for(let d=c.start;d<=c.end;d=nextDay(d)){
  const slot=days.find(x=>x.weekday===new Date(d+'T00:00:00Z').getUTCDay())?.slot;
  if(slot===undefined)continue;
  check(S.planned(d,before)===null&&S.planned(d,settings)===slot,'Hay una sesión prevista el '+d);
  check(!Object.keys(data.work??{}).some(k=>k.slice(0,10)===d)&&!Object.values(data.running1174?.sessions??{}).some(s=>s.day===d)&&!Object.values(data.sport1177?.sessions??{}).some(s=>s.day===d)&&!Sport.eventsOn(data.sport1177,d).length,'Hay actividad registrada o eventos el '+d);
  dates.push(d);
 }
 check(dates.length>0&&days.every(x=>dates.some(d=>new Date(d+'T00:00:00Z').getUTCDay()===x.weekday)),'El período debe incluir todos los días seleccionados');
 R.assertStrengthChange(data.running1174,before,settings,today,S);
 if(data.running1174)R.validateHybrid(data.running1174,settings,S);
 Sport.assertCalendar(data.sport1177,settings,data.running1174,S,R);
 return {next:{...next,settings},view:{programme,dates,routines:review.view}};
}
export function reviewRoutineProgramme(data,document,config,today,api){
 const draft=validateExtractedPlan(document),c=clone(config),result=prepareRoutineProgramme(data,draft,c,today,api);
 return {basis:calendarBasis(data,today),draft,config:c,view:result.view};
}
export function applyRoutineProgramme(data,review,today,api,{confirmed=false}={}){
 check(confirmed===true&&review?.basis===calendarBasis(data,today),'Revisá y confirmá el calendario vigente');
 const result=prepareRoutineProgramme(data,review.draft,review.config,today,api);
 check(JSON.stringify(result.view)===JSON.stringify(review.view),'Cambió el calendario revisado');
 return result.next;
}
