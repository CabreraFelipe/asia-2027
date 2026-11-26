// Candidate-only changes. Preserve every legacy routine slot, recorded session
// and the original calendar before the explicitly chosen personal start.
import {readFileSync,writeFileSync} from 'node:fs';
export function patchPlanning1173(web){
 const path=n=>web+'/diary/'+n;
 function edit(n,changes){
  let text=readFileSync(path(n),'utf8');
  for(const [a,b] of changes){if(text.split(a).length!==2)throw Error('Marcador planificación '+n+': '+a.slice(0,100));text=text.replace(a,b)}
  writeFileSync(path(n),text);return text;
 }
 const schedule=edit('schedule829.js',[
 ["function programmes(settings){","function personalStart(settings){const d=settings?.personalCalendar1173;if(d===undefined)return null;check(settings?.goals101?.version===2&&day(d)&&d>='1900-01-01'&&d<='2199-12-31','Calendario personal inválido');return d;}\nconst earliest=settings=>{const p=personalStart(settings);return p&&p<programmeStart?p:programmeStart};\nconst personalAt=(d,settings)=>{const p=personalStart(settings);return !!p&&day(d)&&d>=p};\nfunction programmes(settings){const minimum=earliest(settings);"],
 ["p.start>=programmeStart","p.start>=minimum"],
 ["if(!day(d)||d<programmeStart)return null;","if(!day(d)||d<earliest(settings))return null;"],
 ["if(d>=programmeStart){const p=programmeAt(d,settings);","if(d>=programmeStart||personalAt(d,settings)){const p=programmeAt(d,settings);"],
 ["check(active(from)&&active(to)&&day(today)","check(!root.asiaRunning1174?.planned(data.running1174,to),'Running previsto en el destino. Revisá el calendario híbrido.');check(!personalAt(from,data.settings)&&!personalAt(to,data.settings)&&active(from)&&active(to)&&day(today)"],
 ["const api={base,clean,planned,move,rolling,programmes,programmeAt,programmeStart,","const api={base,clean,planned,move,rolling,programmes,programmeAt,programmeStart,personalStart,personalAt,earliest,"]
 ]);
 edit('training102.js',[
 ["function config(c){","function config(c,settings){"],
 ["c.start>=schedule.programmeStart","c.start>=schedule.earliest(settings)"],
 ["function generate(raw){const c=config(raw),","function generate(raw,settings){const c=config(raw,settings),"],
 ["const c=config(preview.config);","const c=config(preview.config,settings);"],
 ["const first=date()>schedule.programmeStart?date():schedule.programmeStart;","const minimum=schedule.earliest(data.settings),first=date()>minimum?date():minimum;"],
 ["draft=generate(readConfig());","draft=generate(readConfig(),data.settings);"],
 ["const old=data.settings;data.settings=next;try{syncRoutineCatalog826();","root.asiaRunning1174?.assertStrengthChange(data.running1174,data.settings,next,date(),schedule);const old=data.settings;data.settings=next;try{syncRoutineCatalog826();"],
 ["JSON.stringify(config(readConfig()))","JSON.stringify(config(readConfig(),data.settings))"],
 ["El calendario original de Asia 2027 se conserva hasta el 7/03/2027 inclusive. Los programas posteriores no cambian tus metas diarias ni prescriben cargas.","El calendario original se conserva. Las cuentas con metas propias pueden elegir un calendario independiente desde una fecha futura o actual. Los programas no prescriben cargas ni cambian las metas diarias."],
 ["const preview=n('div');preview.id='programPreview102';", "const personal=n('div');personal.id='personalPlanning1173';panel.insertBefore(personal,form);const personalNote=n('p');personal.append(personalNote);const personalDate=field(personal,'Fecha desde la que usar tu propio calendario','personalStart1173','date',date());personalDate.min=date();const usePersonal=btn(personal,'Activar calendario personal',()=>{try{if(busy())throw Error('Finalizá la sesión activa o revisá los cambios pendientes.');if(data.settings?.goals101?.version!==2||schedule.personalStart(data.settings))throw Error('Calendario personal no disponible.');const d=personalDate.value;if(!day(d)||d<date()||d>'2199-12-31'||Object.keys(data.work||{}).some(k=>k.slice(0,10)>=d))throw Error('Elegí una fecha no pasada y sin entrenamientos guardados desde esa fecha.');if(!confirm('¿Usar tu propio calendario desde '+d+'? Las rutinas y los registros anteriores se conservan. Las sesiones de referencia futuras dejarán de estar previstas desde esa fecha.'))return;const next={...data.settings,personalCalendar1173:d};schedule.programmes(next);save(next);draft=null;start.min=end.min=d;start.value=d;end.value=add(d,55);renderDraft();renderPersonal();message('Calendario personal activo. Generá un programa adaptado a tus días y equipo.');}catch(e){message(e.message)}});usePersonal.id='activatePersonal1173';function renderPersonal(){const d=schedule.personalStart(data.settings);personal.hidden=data.settings?.goals101?.version!==2;personalNote.textContent=d?'Calendario personal desde '+d+'. Tus registros y rutinas anteriores siguen disponibles.':'Elegí cuándo dejar de utilizar las sesiones de referencia. No se activa un programa sin tu confirmación.';personalDate.hidden=usePersonal.hidden=!!d;personalDate.previousElementSibling.hidden=!!d;}const preview=n('div');preview.id='programPreview102';"],
 ["if(panel.open)renderList();});renderList();","if(panel.open){renderPersonal();renderList();}});renderPersonal();renderList();"]
 ]);
 edit('planner820.js',[
 ["p=schedule.programmeAt(date,data?.settings)?'active':phase(date)","p=schedule.programmeAt(date,data?.settings)?'active':schedule.personalAt(date,data?.settings)?'outside':phase(date)"],
 ["control:i===0&&date>START&&date<=END","control:!schedule.personalAt(date,data?.settings)&&i===0&&date>START&&date<=END"]
 ]);
 edit('v42.js',[
 ["window.asiaSchedule829.programmeAt(d,data.settings)?.name|| (d<","window.asiaSchedule829.programmeAt(d,data.settings)?.name|| (window.asiaSchedule829.personalAt(d,data.settings)?'Calendario personal · sin programa activo':d<"]
 ]);
 edit('goals101.js',[
 ["if(b.version===2)reference.textContent='Calendario del piloto: programa de referencia aún no personalizado';","if(b.version===2)reference.textContent=window.asiaSchedule829.personalStart(data.settings)?'Calendario personal · consultá tu planificación':'Calendario de referencia · podés activar tu calendario personal';"],
 ["const old=data.settings;data.settings={...old,goals101:validate(next)};","globalThis.asiaRunning1174?.validate(data.running1174,validate(next));const old=data.settings;data.settings={...old,goals101:validate(next)};"],
 ["panel.append(newBtn);const active=make('div');","panel.append(newBtn);const planning=make('button','Configurar mi calendario y entrenamiento','secondary');planning.type='button';planning.id='goalPlanning1173';planning.onclick=()=>{tab('training');const target=el('training102');if(target){for(let p=target;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;target.scrollIntoView({block:'start'});}};panel.append(planning);const active=make('div');"]
 ]);
 // One exact implementation for local validation, cloud validation and import.
 return schedule;
}
