/* R19: descriptive muscle recovery in the original app. No writes, AI or network. */
(function(){'use strict';
const GROUPS=['Pecho','Espalda','Hombros','Bíceps','Tríceps','Abdomen','Glúteos','Cuádriceps','Isquiotibiales','Gemelos'];
const day=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const diff=(a,b)=>(Date.parse(a)-Date.parse(b))/86400000;
const num=(x,min,max)=>{if(typeof x==='string'&&/^\d+(?:\.\d+)?$/.test(x.trim()))x=Number(x);return typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max?x:null;};
const validSet=s=>s?.done===true&&typeof s.kg==='number'&&num(s.kg,0,1000)!==null&&Number.isInteger(s.reps)&&s.reps>=1&&s.reps<=100;
function mapped(name,map){return Object.hasOwn(map||{},name)&&Array.isArray(map[name])?[...new Set(map[name].filter(x=>GROUPS.includes(x)))]:[];}
function build(data,reference,today,map,planned=[]){
 if(!day(reference)||!day(today)||reference>today)throw Error('Seleccioná una fecha válida, no futura.');
 const groups=GROUPS.map(name=>({name,recent:0,previous:0,current:0,last:null,daysSince:null,planned:planned.some(n=>mapped(n,map).includes(name))})),byName=new Map(groups.map(g=>[g.name,g]));
 const recorded=new Set(),priorRecorded=new Set();let unmapped=0,invalid=0,valid=0;
 for(const [key,w] of Object.entries(data?.work||{})){const d=key.slice(0,10);if(!(/^\d{4}-\d{2}-\d{2}_[0-3]$/.test(key)||!!globalThis.asiaGym826?.slotOK(key,data.settings))||!day(d)||d>reference)continue;const age=diff(reference,d);
  for(const [name,sets] of Object.entries(w?.ex||{})){if(!Array.isArray(sets))continue;const completed=sets.filter(s=>s?.done===true),n=completed.filter(validSet).length;const targets=mapped(name,map);
   if(age<=14){invalid+=completed.length-n;valid+=n;if(!targets.length)unmapped+=n;if(n&&age>=1&&age<=7)recorded.add(d);if(n&&age>=8&&age<=14)priorRecorded.add(d);}
   if(!n)continue;
   for(const target of targets){const g=byName.get(target);if(g.last===null||d>g.last){g.last=d;g.daysSince=age;}if(age===0)g.current+=n;else if(age<=7)g.recent+=n;else if(age<=14)g.previous+=n;}
  }
 }
 const r=data?.diet?.[reference]||{},sleep=num(r.sleep,0,24),recovery=num(r.recovery,1,5),fatigue=num(r.fatigue43,1,5);
 const felt=Number.isInteger(recovery)?recovery:null,tired=Number.isInteger(fatigue)?fatigue:null;
 const flags=[];if(sleep!==null&&sleep<6)flags.push('Sueño registrado inferior a 6 h');if(felt!==null&&felt<=2)flags.push('Recuperación percibida baja');if(tired!==null&&tired>=4)flags.push('Fatiga percibida alta');
 return {reference,groups,coverage:{recent:recorded.size,previous:priorRecorded.size,valid,invalid,unmapped},wellbeing:{sleep,recovery:felt,fatigue:tired,flags,count:[sleep,felt,tired].filter(x=>x!==null).length},vacation:reference>='2026-12-26'&&reference<='2027-01-07'};
}
function advice(r){if(r.wellbeing.flags.length)return 'Señales de recuperación a revisar: '+r.wellbeing.flags.join(' · ')+'. Considerá una sesión más suave o descansar según sensaciones; no hace falta compensar.';if(r.wellbeing.count<3)return 'Faltan datos de bienestar. Registrá sueño, fatiga y recuperación antes de interpretar tu preparación.';return 'No hay señales bajas en estos tres registros según los umbrales orientativos. No confirma recuperación muscular ni aptitud para entrenar; valorá técnica, dolor y sensaciones.';}
const api={build,advice,mapped};if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
const el=id=>document.getElementById(id),make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
function section(parent,id,title){if(!parent)return null;const section=make('details',undefined,'gymMini571');section.id=id;section.append(make('summary',title),make('div',undefined,'recoveryBody819'));parent.append(section);return section;}
const gym=section(el('muscleV4'),'muscleRecovery819','Recuperación por grupo muscular');
const home=section(el('recovery43'),'homeRecovery819','Carga muscular reciente');
function render(target,reference,isGym){if(!target)return;const body=target.querySelector('.recoveryBody819');body.replaceChildren();let r;try{const ri=Number(el('routine').value);const planned=isGym?workExercises53(ri,data.work[workKey()]).map(e=>e[0]):[];r=build(data,reference,date(),window.asiaMuscleGroups819(),planned);}catch{body.append(make('p','Seleccioná una fecha válida hasta hoy.','meta'));return;}
 const w=r.wellbeing;body.append(make('p',`Fecha de referencia: ${r.reference}. Sueño: ${w.sleep===null?'sin registro':w.sleep+' h'} · Recuperación: ${w.recovery===null?'sin registro':w.recovery+'/5'} · Fatiga: ${w.fatigue===null?'sin registro':w.fatigue+'/5'}.`,'meta'),make('p',advice(r)+(r.vacation?' Vacaciones: entrenamiento opcional.':''),'tiny'));
 const table=make('table',undefined,'v4table');table.style.tableLayout='fixed';table.style.width='100%';const head=make('thead'),tr=make('tr');for(const label of ['Grupo','7 d prev.','7 d ant.','Fecha','Último estímulo']){const th=make('th',label);th.scope='col';th.style.overflowWrap='anywhere';tr.append(th);}head.append(tr);table.append(head);const tb=make('tbody');
 for(const g of r.groups){const row=make('tr');row.dataset.group=g.name;const name=make('th',g.name+(g.planned?' *':''));name.scope='row';name.style.textAlign='left';name.style.overflowWrap='anywhere';row.append(name);for(const v of [String(g.recent),String(g.previous),String(g.current),g.daysSince===null?'—':g.daysSince===0?'Fecha elegida':`${g.daysSince} d`]){const td=make('td',v);td.style.overflowWrap='anywhere';row.append(td);}tb.append(row);}
 table.append(tb);body.append(table,make('p',`Días con series válidas: ${r.coverage.recent}/7 previos · ${r.coverage.previous}/7 anteriores. ${r.coverage.invalid} series marcadas sin carga/reps válidas; ${r.coverage.unmapped} series sin grupo asignado en los 14 días previos y la fecha elegida.`,'tiny'),make('p','7 d prev.: días −7 a −1; 7 d ant.: −14 a −8. Fecha: series guardadas el día elegido (puede ser parcial). Último estímulo: días calendario desde la última serie registrada, no horas ni tiempo fisiológico de recuperación. 0 significa sin series válidas registradas, no descanso confirmado. Grupos principales; una serie puede contar para varios grupos. No se suman sesiones Apple Watch ni PRO. '+(isGym?'* Grupo principal de la rutina seleccionada. No incluye series aún no guardadas.':''),'tiny'));
}
// V8.7.2: read-only context in the active session, using the same muscle calculations.
const activeHost=el('gymActive53'),activeContext=make('details',undefined,'gymMini571');activeContext.id='gymRecovery872';
const activeBody=make('div',undefined,'recoveryBody819');activeContext.append(make('summary','Recuperación y carga reciente'),activeBody);el('gymPhase53').after(activeContext);
function activeRecovery872(){
 if(!activeContext.open||activeHost.hidden)return;
 const d=el('trainDay').value;activeBody.replaceChildren();
 if(!day(d)||d>date()){activeBody.append(make('p','Sin contexto de recuperación para una fecha futura o inválida.','meta'));return;}
 const muscle=build(data,d,date(),window.asiaMuscleGroups819(),workExercises53(Number(el('routine').value),data.work[workKey()]).map(e=>e[0])),w=muscle.wellbeing,h=window.asiaHealthDay42(d);
 const fmt=(v,u)=>v===null?'Sin datos':v.toLocaleString('es-UY',{maximumFractionDigits:1})+' '+u;
 const positive=v=>num(v,0.000001,Infinity);
 activeBody.append(make('p','Fecha de sesión: '+d+(d===date()?' · hoy puede estar incompleto.':''),'meta'));
 const grid=make('div',undefined,'grid');
 for(const [label,value,source] of [['Sueño',fmt(w.sleep,'h'),'Manual'],['Fatiga',w.fatigue===null?'Sin datos':w.fatigue+'/5','Manual'],['VFC',fmt(positive(h.hrv),'ms'),'Apple Salud'],['FC en reposo',fmt(positive(h.restingHR),'lpm'),'Apple Salud']]){const tile=make('div',undefined,'metric');tile.append(make('small',label),make('b',value),make('small',source));grid.append(tile);}activeBody.append(grid);
 activeBody.append(make('p',h.readAt?'Última consulta de Salud: '+new Date(h.readAt).toLocaleString('es-UY'):'Salud aún no consultada en esta sesión.','tiny'));
 const groups=muscle.groups.filter(g=>g.planned);activeBody.append(make('p','Grupos principales de esta rutina · series válidas guardadas en los 7 días previos:','meta'));
 if(groups.length)for(const g of groups)activeBody.append(make('p',g.name+' · '+g.recent+' series · '+(g.daysSince===null?'sin estímulo registrado':g.daysSince===0?'último estímulo: fecha elegida':'último estímulo: hace '+g.daysSince+' d calendario'),'tiny'));
 else activeBody.append(make('p','Sin grupos principales identificados.','tiny'));
 const report94=window.asiaRecoveryReport94?.(d,true);activeBody.append(make('p',report94?report94.label+' · '+report94.advice:advice(muscle),'tiny'),make('p','Cobertura de Gym: '+muscle.coverage.recent+'/7 días con series válidas. Sin datos no equivale a reposo; no se suman sesiones del reloj ni se estima aptitud para entrenar. No cambia la rutina.','tiny'));
}
activeContext.addEventListener('toggle',activeRecovery872);
const priorHome872=window.asiaRenderHome42;window.asiaRenderHome42=()=>{priorHome872?.();activeRecovery872()};
window.asiaRenderActiveRecovery872=activeRecovery872;
function update(){render(gym,el('trainDay').value,true);render(home,el('recoveryDay43').value,false);activeRecovery872();}
const oldRefresh=refresh;refresh=function(){oldRefresh();update();};const oldLoad=loadWork;loadWork=function(){oldLoad();render(gym,el('trainDay').value,true);activeRecovery872();};el('routine').onchange=loadWork;el('trainDay').onchange=()=>{el('routine').value=wk(el('trainDay').value);loadWork();};el('recoveryDay43').addEventListener('change',()=>render(home,el('recoveryDay43').value,false));
// Health links to the existing recovery card; no second diary/card or requests.
const health=el('healthRefresh')?.closest('.card');if(health&&home){const b=make('button','Ver recuperación muscular','secondary');b.type='button';b.id='recoveryLink819';b.onclick=()=>{tab('home');const d=el('healthDay')?.value;if(day(d)&&d<=date())el('recoveryDay43').value=d;el('recoveryDay43').dispatchEvent(new Event('change'));for(let p=home;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;(window.asiaScrollTo541||((n,o)=>n.scrollIntoView(o)))(home,{block:'center'});};health.append(b);}
update();
})();
