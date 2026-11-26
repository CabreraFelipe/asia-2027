// Optional sports record book; same validation in diary, shell and server.
// Original technique text, no third-party media, no inferred equipment or loading.
(function(root){'use strict';
const check=(v,m)=>{if(!v)throw Error(m)},obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),exact=(x,k)=>obj(x)&&Object.keys(x).length===k.length&&k.every(a=>Object.hasOwn(x,a)),int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,txt=(x,n)=>typeof x==='string'&&x.length<=n,day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&x>='1900-01-01'&&x<='2199-12-31'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x,id=(x,p)=>typeof x==='string'&&new RegExp('^'+p+'-[a-f0-9]{32}$').test(x),clone=x=>JSON.parse(JSON.stringify(x)),add=(d,n)=>new Date(Date.parse(d)+n*86400000).toISOString().slice(0,10),weekday=d=>new Date(d+'T00:00:00Z').getUTCDay(),unique=x=>new Set(x).size===x.length;
const sports=Object.freeze(['Fútbol','Fútbol sala','Rugby','Básquetbol','Tenis','Pádel','Hockey','Vóleibol','Atletismo','Otro']),capacities=Object.freeze(['Aceleración','Velocidad máxima','Desaceleración','Cambios de dirección','Agilidad reactiva','Potencia','Fuerza máxima','Fuerza unilateral','Resistencia aeróbica','Resistencia intermitente','Equilibrio','Estabilidad','Movilidad','Coordinación','Prevención']),equipment=Object.freeze(['Conos','Tapas o discos','Bandas','Mancuernas','Barra y discos','Kettlebell','Cajón estable','Vallas bajas','Escalera','Balón medicinal','Pelota','Cuerda','Máquinas']),locations=Object.freeze(['Casa','Cancha','Gimnasio','Otro']),levels=Object.freeze(['Inicial','Habitual','Experimentado']),surfaces=Object.freeze(['Césped','Sintético','Pista','Piso firme','Otra']),eventTypes=Object.freeze(['Entrenamiento de equipo','Partido','Competición']),symptoms=Object.freeze(['Sin síntomas preocupantes','Sí / no estoy seguro']);
const list=(x,values,min=0,max=values.length)=>Array.isArray(x)&&x.length>=min&&x.length<=max&&unique(x)&&x.every(v=>values.includes(v));
const C=[
 ['sport-march','Marcha técnica',['Coordinación','Aceleración'],[],'seconds',20,2,45,'baja','Elevá la rodilla con control; mantené el tronco estable.'],
 ['sport-wall-march','Marcha de aceleración sin apoyo',['Aceleración','Coordinación'],[],'reps',6,2,60,'baja','Paso corto y firme, sin correr ni forzar la inclinación.'],
 ['sport-start','Aceleración técnica submáxima',['Aceleración','Velocidad máxima'],[],'metres',10,3,90,'moderada','Acelerá de forma progresiva, sin buscar velocidad máxima; dejá espacio para frenar.'],
 ['sport-mark-start','Salidas hacia una marca',['Aceleración','Coordinación'],['Conos'],'metres',10,3,90,'moderada','Usá una marca visible y una zona libre de frenado.'],
 ['sport-disc-start','Salidas hacia un disco',['Aceleración','Coordinación'],['Tapas o discos'],'metres',10,3,90,'moderada','Usá un disco plano como referencia, sin pisarlo.'],
 ['sport-decel','Frenado progresivo',['Desaceleración','Cambios de dirección'],[],'metres',10,3,90,'moderada','Entrá a ritmo controlado y desacelerá en varios pasos.'],
 ['sport-cone-cut','Cambio de dirección con conos',['Cambios de dirección','Desaceleración'],['Conos'],'metres',10,3,90,'moderada','Giro amplio y controlado, reducí velocidad antes de cambiar de dirección.'],
 ['sport-disc-cut','Cambio de dirección con discos',['Cambios de dirección','Desaceleración'],['Tapas o discos'],'metres',10,3,90,'moderada','Colocá marcas separadas y practicá frenado antes del giro.'],
 ['sport-lateral','Desplazamiento lateral controlado',['Cambios de dirección','Coordinación','Agilidad reactiva'],[],'seconds',15,2,60,'baja','Pasos cortos, sin cruzar los pies; no es prueba reactiva máxima.'],
 ['sport-land','Recepción y aterrizaje sin salto',['Potencia','Prevención','Estabilidad'],[],'reps',5,2,60,'baja','Flexioná cadera y rodillas de forma suave y mantené el equilibrio.'],
 ['sport-hop','Salto vertical bajo con pausa',['Potencia'],[],'contacts',3,2,90,'moderada','Saltá bajo y aterrizá suave; reiniciá cada repetición.'],
 ['sport-broad','Salto horizontal corto',['Potencia'],[],'contacts',3,2,90,'moderada','Distancia moderada, frená con control; suspendé si se pierde técnica.'],
 ['sport-medball','Lanzamiento de balón medicinal ligero',['Potencia'],['Balón medicinal'],'reps',4,2,90,'moderada','Solo con espacio despejado y técnica conocida, carga elegida por vos.'],
 ['sport-db-squat','Sentadilla con mancuernas: subida ágil',['Potencia','Fuerza máxima'],['Mancuernas'],'reps',5,2,90,'moderada','Carga conocida y cómoda; descenso controlado y subida con intención rápida, sin salto.'],
 ['sport-split','Sentadilla dividida sin carga',['Fuerza unilateral','Estabilidad'],[],'reps-per-side',6,2,60,'baja','Mantené el apoyo estable y el movimiento dentro de un rango cómodo.'],
 ['sport-band-lateral','Pasos laterales con banda',['Estabilidad','Prevención'],['Bandas'],'reps-per-side',6,2,60,'baja','Tensión moderada, pelvis estable; no fuerces la rodilla.'],
 ['sport-single','Equilibrio a una pierna',['Equilibrio','Estabilidad'],[],'seconds-per-side',20,2,45,'baja','Cerca de un apoyo seguro; mirá un punto fijo.'],
 ['sport-heel','Elevación de talones controlada',['Prevención','Fuerza unilateral'],[],'reps',8,2,45,'baja','Subí y bajá con control, con apoyo si hace falta.'],
 ['sport-bridge','Puente de glúteos',['Prevención','Estabilidad'],[],'reps',8,2,45,'baja','Elevá la pelvis sin arquear la espalda.'],
 ['sport-mobility','Movilidad de tobillo sin carga',['Movilidad','Prevención'],[],'reps-per-side',6,2,30,'baja','Avanzá la rodilla suavemente sin dolor, mantené talón apoyado.'],
 ['sport-walk','Caminata a ritmo conversacional',['Resistencia aeróbica'],[],'seconds',120,2,60,'baja','Ritmo cómodo, sin buscar agotamiento.'],
 ['sport-interval','Intervalos técnicos caminar/trotar',['Resistencia intermitente','Resistencia aeróbica'],[],'seconds',30,3,60,'baja','Trote cómodo alternado con pausa caminando; no es HIIT.'],
 ['sport-ball','Conducción suave de pelota',['Coordinación','Cambios de dirección'],['Pelota'],'seconds',30,2,60,'baja','Toques suaves, espacio despejado y cambios amplios.'],
 ['sport-step','Paso y estabilidad unilateral',['Equilibrio','Fuerza unilateral'],[],'reps-per-side',5,2,45,'baja','Paso lento, estabilizá antes de volver.']
];
const catalog=Object.freeze(C.map(([id,name,capacities,equipment,unit,value,sets,rest,impact,technique])=>Object.freeze({id,name,capacities:Object.freeze(capacities),equipment:Object.freeze(equipment),unit,value,sets,rest,impact,technique})));
const find=id=>catalog.find(x=>x.id===id),empty=()=>({version:1,profiles:{},events:{},plans:{},sessions:{},metrics:{}}),maps=['profiles','events','plans','sessions','metrics'];
function profile(p,k,g){check(exact(p,['id','goalId','created','sport','other','position','level','strength','plyometrics','context','priorities','location','surface','inventory','minutes','symptoms','safeSpace'])&&id(k,'sportprofile')&&p.id===k&&g.items.some(x=>x.id===p.goalId&&x.kind==='Rendimiento deportivo')&&day(p.created)&&sports.includes(p.sport)&&txt(p.other,60)&&(p.sport==='Otro'?p.other.trim().length>0:p.other==='')&&txt(p.position,60)&&levels.includes(p.level)&&levels.includes(p.strength)&&levels.includes(p.plyometrics)&&['Recreativo','Competitivo'].includes(p.context)&&list(p.priorities,capacities,1)&&locations.includes(p.location)&&surfaces.includes(p.surface)&&(p.inventory===null||list(p.inventory,equipment))&&int(p.minutes,20,90)&&symptoms.includes(p.symptoms)&&typeof p.safeSpace==='boolean','Perfil deportivo inválido');}
function event(e,k,b){check(exact(e,['id','profileId','day','type','minutes','notes'])&&id(k,'sportevent')&&e.id===k&&Object.hasOwn(b.profiles,e.profileId)&&day(e.day)&&eventTypes.includes(e.type)&&int(e.minutes,5,360)&&txt(e.notes,300),'Evento deportivo inválido');}
function eligible(p){return catalog.filter(e=>e.capacities.some(c=>p.priorities.includes(c))&&e.equipment.every(x=>p.inventory?.includes(x))&&(e.impact==='baja'||p.level!=='Inicial'&&p.plyometrics!=='Inicial'&&p.strength!=='Inicial'&&p.safeSpace&&p.location!=='Casa'&&p.surface!=='Otra'&&p.inventory!==null));}
function doseSeconds(e){return e.sets*((e.unit.startsWith('seconds')?e.value*(e.unit.endsWith('side')?2:1):e.unit==='metres'?15:e.value*(e.unit.endsWith('side')?6:3))+e.rest)+45;}
function choose(p,index,moderate){const pool=eligible(p).filter(e=>moderate||e.impact==='baja');const selected=[];let budget=(p.minutes-12)*60;
 const order=[...p.priorities.slice(index%p.priorities.length),...p.priorities.slice(0,index%p.priorities.length)];
 for(const cap of order){const options=pool.filter(e=>e.capacities.includes(cap)&&!selected.some(s=>s.exerciseId===e.id)).sort((a,b)=>Number(b.equipment.length>0)-Number(a.equipment.length>0));const e=options.find(x=>doseSeconds(x)<=budget);if(e){selected.push({exerciseId:e.id,sets:e.sets,value:e.value,unit:e.unit,rest:e.rest});budget-=doseSeconds(e);}if(selected.length>=5)break;}
 check(selected.length>0,'No hay ejercicios compatibles con las capacidades, el material y el nivel seleccionados. Elegí alternativas de base.');return selected;
}
function plan(p,k,b){check(exact(p,['id','profileId','start','end','days','rows','replaces'])&&id(k,'sportplan')&&p.id===k&&Object.hasOwn(b.profiles,p.profileId)&&day(p.start)&&day(p.end)&&p.end>=p.start&&Date.parse(p.end)-Date.parse(p.start)<=27*86400000&&list(p.days,[0,1,2,3,4,5,6],1,3)&&Array.isArray(p.rows)&&p.rows.length>=1&&p.rows.length<=12&&(p.replaces===null||id(p.replaces,'sportplan')),'Bloque deportivo inválido');const prof=b.profiles[p.profileId];check(prof.safeSpace&&prof.symptoms==='Sin síntomas preocupantes','Perfil sin autorización de carga deportiva');let prev='';for(const r of p.rows){check(exact(r,['day','minutes','drills'])&&day(r.day)&&r.day>prev&&r.day>=p.start&&r.day<=p.end&&p.days.includes(weekday(r.day))&&r.minutes===prof.minutes&&Array.isArray(r.drills)&&r.drills.length>=1&&r.drills.length<=5&&unique(r.drills.map(e=>e.exerciseId)),'Sesión deportiva inválida');let total=12*60;for(const d of r.drills){const e=find(d.exerciseId);check(e&&exact(d,['exerciseId','sets','value','unit','rest'])&&eligible(prof).includes(e)&&d.sets===e.sets&&d.value===e.value&&d.unit===e.unit&&d.rest===e.rest,'Ejercicio o dosis fuera del perfil');total+=doseSeconds(e)}check(total<=r.minutes*60,'Duración insuficiente');prev=r.day;}}
function effective(b,extra=null){const all=Object.values(b?.plans??{}),cuts=new Map(all.filter(p=>p.replaces).map(p=>[p.replaces,p.start]));if(extra?.replaces)cuts.set(extra.replaces,extra.start);return all.flatMap(p=>p.rows.filter(r=>!cuts.has(p.id)||r.day<cuts.get(p.id)).map(r=>({...r,planId:p.id,profileId:p.profileId}))).sort((a,b)=>a.day.localeCompare(b.day));}
const planned=(b,d)=>effective(b).find(r=>r.day===d)||null,eventsOn=(b,d)=>Object.values(b?.events??{}).filter(e=>e.day===d);
const metricKinds=Object.freeze({'Sprint 10 m':'s','Sprint 20 m':'s','Sprint 30 m':'s','Salto horizontal':'cm','Salto vertical':'cm','Cambio de dirección 505':'s','Equilibrio unilateral':'s','Resistencia intermitente':'m'});
function session(s,k,b){check(exact(s,['id','profileId','planId','day','minutes','rpe','notes','completed'])&&id(k,'sportsession')&&s.id===k&&Object.hasOwn(b.profiles,s.profileId)&&day(s.day)&&int(s.minutes,1,360)&&(s.rpe===null||int(s.rpe,1,10))&&txt(s.notes,500)&&Array.isArray(s.completed)&&unique(s.completed)&&s.completed.length<=5,'Registro deportivo inválido');if(s.planId===null)check(s.completed.length===0,'Sin plan asociado');else{const p=b.plans[s.planId],r=p?.rows.find(x=>x.day===s.day);check(p&&p.profileId===s.profileId&&r&&s.completed.every(x=>r.drills.some(d=>d.exerciseId===x)),'Referencia deportiva inválida');}}
function metric(m,k,b){check(exact(m,['id','profileId','day','kind','unit','value','protocol','surface','side'])&&id(k,'sportmetric')&&m.id===k&&Object.hasOwn(b.profiles,m.profileId)&&day(m.day)&&Object.hasOwn(metricKinds,m.kind)&&m.unit===metricKinds[m.kind]&&typeof m.value==='number'&&Number.isFinite(m.value)&&m.value>0&&m.value<=(m.unit==='s'?3600:m.unit==='cm'?500:50000)&&txt(m.protocol,150)&&m.protocol.trim().length>0&&surfaces.includes(m.surface)&&['No aplica','Izquierda','Derecha'].includes(m.side)&&(!['Cambio de dirección 505','Equilibrio unilateral'].includes(m.kind)||m.side!=='No aplica'),'Medición deportiva inválida');}
function validate(raw,g){if(raw===undefined)return empty();check(exact(raw,['version',...maps])&&raw.version===1&&maps.every(k=>obj(raw[k])&&Object.keys(raw[k]).length<=(k==='profiles'||k==='plans'?100:2000)),'Libro deportivo inválido');for(const [k,v] of Object.entries(raw.profiles))profile(v,k,g);for(const [k,v] of Object.entries(raw.events))event(v,k,raw);for(const [k,v] of Object.entries(raw.plans))plan(v,k,raw);const replaces=new Set();for(const p of Object.values(raw.plans))if(p.replaces){const old=raw.plans[p.replaces];check(old&&raw.profiles[old.profileId].goalId===raw.profiles[p.profileId].goalId&&p.start>old.start&&p.start<=old.end&&!replaces.has(p.replaces),'Replanificación deportiva divergente');replaces.add(p.replaces)}const rows=effective(raw);check(unique(rows.map(r=>r.day))&&rows.every(r=>eventsOn(raw,r.day).length===0),'Agenda deportiva superpuesta');for(const r of rows)if(r.drills.some(d=>find(d.exerciseId).impact==='moderada'))check(![-1,1].some(n=>eventsOn(raw,add(r.day,n)).length),'Cargas deportivas demasiado próximas a evento');const recorded=new Set();for(const [k,s] of Object.entries(raw.sessions)){session(s,k,raw);const key=s.profileId+'/'+s.day;check(!recorded.has(key),'Registro deportivo duplicado');recorded.add(key)}for(const [k,m] of Object.entries(raw.metrics))metric(m,k,raw);return raw;}
function put(raw,name,row,g,today){check(maps.includes(name)&&name!=='plans'&&day(today),'Acción deportiva inválida');const b=clone(validate(raw,g));check(!Object.hasOwn(b[name],row.id),'ID deportivo ocupado');if(name==='profiles')check(row.created===today&&g.items.some(x=>x.id===row.goalId&&x.status==='Activa'),'Elegí una meta activa');if(name==='sessions'||name==='metrics')check(row.day<=today,'No se registran resultados futuros');b[name][row.id]=clone(row);return validate(b,g);}
function assertCalendar(raw,settings,running,S,R){if(!raw)return;for(const r of effective(raw)){check(S.planned(r.day,settings)===null&&!R.planned(running,r.day),'Sesión deportiva prevista el '+r.day+'. Revisá fuerza y Running.');if(r.drills.some(d=>find(d.exerciseId).impact==='moderada'))check(![-1,1].some(n=>S.planned(add(r.day,n),settings)!==null||R.planned(running,add(r.day,n))),'Carga de fuerza o Running próxima a sesión deportiva el '+r.day+'. Revisá el calendario.');}}
function draft(input,raw,g,settings,running,today,S,R,work={}){const b=validate(raw,g),p=b.profiles[input.profileId];check(exact(input,['profileId','start','end','days','replaces'])&&p&&g.items.some(x=>x.id===p.goalId&&x.status==='Activa')&&p.symptoms==='Sin síntomas preocupantes'&&p.safeSpace&&day(today)&&day(input.start)&&day(input.end)&&input.start>=today&&input.end>=input.start&&Date.parse(input.end)-Date.parse(input.start)<=27*86400000&&list(input.days,[0,1,2,3,4,5,6],1,3),'Completá el perfil, espacio seguro y fechas. Si hay síntomas preocupantes, no aumentes carga sin valoración.');if(input.replaces!==null){const old=b.plans[input.replaces];check(old&&b.profiles[old.profileId].goalId===p.goalId&&input.start>today&&input.start>old.start&&input.start<=old.end&&!Object.values(b.plans).some(x=>x.replaces===old.id)&&!Object.values(b.sessions).some(x=>x.day>=input.start&&x.day<=old.end),'No se puede reemplazar ese tramo deportivo.');}
 const occupied=new Set(effective(b,input).map(r=>r.day)),rows=[];for(let d=input.start;d<=input.end;d=add(d,1))if(input.days.includes(weekday(d))){check(!occupied.has(d)&&!eventsOn(b,d).length&&!R.planned(running,d)&&S.planned(d,settings)===null&&!Object.keys(work).some(k=>k.slice(0,10)===d),'Hay una sesión o evento previsto/registrado el '+d);const nearby=[-1,1].some(n=>eventsOn(b,add(d,n)).length||R.planned(running,add(d,n))||S.planned(add(d,n),settings)!==null||occupied.has(add(d,n))||rows.some(r=>r.day===add(d,n)));const moderate=!nearby&&!input.days.includes((weekday(d)+1)%7)&&!input.days.includes((weekday(d)+6)%7);rows.push({day:d,minutes:p.minutes,drills:choose(p,rows.length,moderate)});}check(rows.length,'No hay días en ese tramo');return {...clone(input),rows};}
function activate(raw,proposal,key,g,settings,running,today,S,R,work){const {rows,...input}=proposal,actual=draft(input,raw,g,settings,running,today,S,R,work);check(JSON.stringify(actual)===JSON.stringify(proposal),'Cambió el borrador o el calendario');const b=clone(validate(raw,g));check(!Object.hasOwn(b.plans,key),'Plan deportivo ya existe');b.plans[key]={id:key,...actual};validate(b,g);assertCalendar(b,settings,running,S,R);return b;}
// Local read-only PRO calendar guard for candidate sports rows, not a distributed transaction.
function proCalendarGuard(gym,rows){
 check(gym&&Number.isSafeInteger(gym.revision)&&gym.revision>=0&&Array.isArray(rows),'Gym PRO no disponible');
 if(!gym.revision)return JSON.stringify([0,[]]);
 const p=gym.payload;check(obj(p)&&Array.isArray(p.planned)&&Array.isArray(p.sessions)&&Object.hasOwn(p,'active'),'Agenda PRO inválida');
 check(!p.active,'Finalizá la sesión PRO activa');
 const dates=[...new Set([...p.planned,...p.sessions].map(r=>r?.date))].sort();
 check(dates.every(day),'Fecha PRO inválida');
 const occupied=new Set(dates);
 for(const r of rows){
  check(day(r.day)&&Array.isArray(r.drills)&&r.drills.every(d=>find(d.exerciseId)),'Sesión deportiva inválida');
  check(!occupied.has(r.day),'Coincidencia con Gym PRO el '+r.day);
  if(r.drills.some(d=>find(d.exerciseId).impact==='moderada'))check(![-1,1].some(n=>occupied.has(add(r.day,n))),'Gym PRO próximo a carga deportiva moderada el '+r.day);
 }
 return JSON.stringify([gym.revision,dates]);
}
// Only remove future prescribed work. Never generate new drills, doses or dates.
function draftReduction(input,raw,g,settings,running,today,S,R,work={}){
 const b=validate(raw,g);
 check(exact(input,['planId','start','days','lowOnly'])&&day(today)&&day(input.start)&&input.start>today&&list(input.days,[0,1,2,3,4,5,6],1,3)&&typeof input.lowOnly==='boolean','Elegí fechas futuras y días a conservar');
 const old=b.plans[input.planId],p=old&&b.profiles[old.profileId];
 check(old&&p&&input.start>old.start&&input.start<=old.end&&!Object.values(b.plans).some(x=>x.replaces===old.id)&&g.items.some(x=>x.id===p.goalId&&x.status==='Activa'),'Bloque no disponible para reducir');
 check(p.safeSpace&&p.symptoms==='Sin síntomas preocupantes','Revisá el perfil y los síntomas antes de planificar');
 check(!Object.values(b.sessions).some(x=>x.day>=input.start&&x.day<=old.end),'Hay sesiones registradas en el tramo');
 const before=old.rows.filter(r=>r.day>=input.start);
 check(before.length&&input.days.every(d=>old.days.includes(d)),'Elegí únicamente días del bloque original');
 check(!before.some(r=>Object.keys(work).some(k=>k.slice(0,10)===r.day)),'Hay trabajo registrado en el tramo');
 const rows=before.filter(r=>input.days.includes(weekday(r.day))).map(r=>({...r,drills:r.drills.filter(d=>!input.lowOnly||find(d.exerciseId).impact==='baja')})).filter(r=>r.drills.length);
 check(rows.length,'La reducción deja el bloque vacío; no se aplicó ningún cambio');
 check(rows.length<before.length||rows.some(r=>r.drills.length<before.find(x=>x.day===r.day).drills.length),'No hay reducción efectiva');
 const plan={profileId:old.profileId,start:input.start,end:old.end,days:clone(input.days),rows:clone(rows),replaces:old.id};
 // Validate the real candidate using the same shared schema and calendar, without a write.
 const probe=clone(b);let i=0,key;
 do{key='sportplan-'+(i++).toString(16).padStart(32,'0')}while(Object.hasOwn(probe.plans,key));
 probe.plans[key]={id:key,...plan};validate(probe,g);assertCalendar(probe,settings,running,S,R);
 return {input:clone(input),before:clone(before),plan};
}
function activateReduction(raw,proposal,key,g,settings,running,today,S,R,work){
 const actual=draftReduction(proposal.input,raw,g,settings,running,today,S,R,work);
 check(JSON.stringify(actual)===JSON.stringify(proposal),'Cambió la reducción revisada');
 const b=clone(validate(raw,g));check(!Object.hasOwn(b.plans,key),'Plan deportivo ya existe');
 b.plans[key]={id:key,...actual.plan};validate(b,g);assertCalendar(b,settings,running,S,R);return b;
}
// Derived read-only comparisons; never infer equivalence or mutate training prescriptions.
function metricComparisons(raw,g,profileId,asOf){
 const b=validate(raw,g);check(day(asOf),'Fecha de comparación inválida');if(!Object.hasOwn(b.profiles,profileId))return [];
 const groups=new Map();
 for(const m of Object.values(b.metrics)){
  if(m.profileId!==profileId||m.day>asOf)continue;
  const key=JSON.stringify([m.kind,m.unit,m.protocol,m.surface,m.side]);
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);
 }
 return [...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,rows])=>{
  const {kind,unit,protocol,surface,side}=rows[0];
  const lower=['Sprint 10 m','Sprint 20 m','Sprint 30 m','Cambio de dirección 505'].includes(kind);
  const bestOf=values=>lower?Math.min(...values):Math.max(...values);
  const daily=new Map();
  for(const m of rows){if(!daily.has(m.day))daily.set(m.day,[]);daily.get(m.day).push(m.value);}
  const days=[...daily.keys()].sort(),firstDay=days[0],lastDay=days.at(-1),first=bestOf(daily.get(firstDay)),latest=bestOf(daily.get(lastDay));
  const improvement=days.length>1?(lower?first-latest:latest-first):null;
  return {kind,unit,protocol,surface,side,lower,count:rows.length,days:days.length,firstDay,lastDay,first,latest,best:bestOf(rows.map(m=>m.value)),improvement};
 });
}
root.asiaSport1177=Object.freeze({sports,capacities,equipment,locations,levels,surfaces,eventTypes,symptoms,catalog,metricKinds,metricComparisons,proCalendarGuard,empty,validate,put,eligible,draft,activate,draftReduction,activateReduction,effective,planned,eventsOn,assertCalendar,add,find});
})(globalThis);
