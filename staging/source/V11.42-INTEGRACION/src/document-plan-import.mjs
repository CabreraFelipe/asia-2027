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
