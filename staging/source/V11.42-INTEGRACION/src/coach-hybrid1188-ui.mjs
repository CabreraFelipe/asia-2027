import {createHybrid1187} from './coach-hybrid1187.mjs';
import {createHybridSample1188} from './coach-hybrid-sample1188.mjs';
import {generateCalendar1189} from './coach-calendar1189.mjs';
const el=id=>document.getElementById(id),n=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x},anchor=el('coachBundle1180'),form=window.asiaBundleDraft1188;
if(anchor&&form&&window.asiaCoachPersist1184){
 const api={A:window.asiaCoachActions1179,Gym:window.asiaGym826,S:window.asiaSchedule829,T:window.asiaTraining102,R:window.asiaRunning1174,Sport:window.asiaSport1177,N:window.asiaNutrition103,G:window.asiaExtras830.goals101},bundle=window.asiaCoachBundle1180,uid=p=>p+'-'+Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
 const state=()=>({data,disk:disk600,today:date(),current:window.asiaGoals50(),busy:blocked600||localStorage.getItem(key)!==disk600||JSON.stringify(data)!==disk600||window.asiaGym84Ready!==true||window.asiaGym84Active===true||!!window.asiaGymHasSession532?.()||!!window.asiaClassicRunning532?.()||el('routine').disabled});
 const c=createHybrid1187({bundle,api,state,persist:window.asiaCoachPersist1184,newId:uid,transport:createHybridSample1188({syntheticOnly:true})});
 const panel=n('details');panel.id='coachHybrid1188';panel.className='card sectionfold';panel.setAttribute('aria-busy','false');anchor.after(panel);
 panel.append(n('summary','Coach multidisciplinario · recorrido de prueba'),n('p','Configurá las disciplinas en el formulario anterior y añadí alternativas antes de aceptar nada. Conversación fija local, sin IA ni red. No ingreses información personal. La planificación manual sigue disponible.'));
 const field=(id,label,tag)=>{const x=n(tag),l=n('label',label);x.id='ch1188-'+id;l.htmlFor=x.id;panel.append(l,x);return x};
 const question=field('question','¿Qué querés comparar?','textarea'),goal=field('goal','Objetivo opcional','input');question.maxLength=1200;goal.maxLength=300;
 const list=n('div'),out=n('div'),status=n('p');list.id='coachHybridAlternatives1188';out.id='coachHybridOutput1188';status.id='coachHybridStatus1188';status.setAttribute('role','status');
 let alternatives=[],stamp=null,displayed=null,locked=false;
 const btn=(parent,id,label,fn)=>{const x=n('button',label);x.id='coachHybrid'+id+'1188';x.type='button';parent.append(x);x.onclick=()=>run(fn);return x};
 function run(fn){if(locked)return;locked=true;panel.setAttribute('aria-busy','true');status.textContent='';const disabled=new Map();
  const finish=()=>{for(const [x,was] of disabled)if(x.isConnected)x.disabled=was;locked=false;panel.setAttribute('aria-busy','false');if(c.view().phase==='unconfirmed')for(const x of panel.querySelectorAll('button,input,textarea,select'))x.disabled=true};
  const fail=e=>{status.textContent=e.message||'No se completó';if(c.view().phase==='unconfirmed')out.replaceChildren(n('p','Guardado no confirmado. Cerrá y verificá la rama antes de reintentar.'))};
  try{const r=fn();if(r&&typeof r.then==='function'){for(const x of panel.querySelectorAll('button,input,textarea,select')){disabled.set(x,x.disabled);x.disabled=true}return Promise.resolve(r).catch(fail).finally(finish)}finish()}catch(e){fail(e);finish()}
 }
 function clearReview(){c.discard();displayed=c.view();out.replaceChildren()}
 function same(){const s=state();if(s.busy||!stamp||s.disk!==stamp.disk||s.today!==stamp.today||JSON.stringify(s.current)!==stamp.current)throw Error('Cambió el diario. Eliminá las alternativas y volvé a capturarlas');return s}
 function showList(){list.replaceChildren(n('h3','Alternativas locales · '+alternatives.length));alternatives.forEach((a,i)=>{const card=n('details');card.append(n('summary','Alternativa '+(i+1)+' · '+['strength','running','sport','nutrition'].filter(k=>a.raw[k]!==null).map(k=>({strength:'Fuerza',running:'Running',sport:'Deporte',nutrition:'Nutrición'})[k]).join(' + ')));const detail=n('div');form.render(a.view,detail);card.append(detail);btn(card,'Remove'+i,'Quitar alternativa',()=>{clearReview();alternatives.splice(i,1);if(!alternatives.length)stamp=null;showList()});list.append(card)})}
 btn(panel,'Capture','Añadir configuración del formulario anterior',()=>{clearReview();const s=state();if(s.busy)throw Error('Guardá el diario primero');if(stamp)same();if(alternatives.length>=8)throw Error('Máximo ocho alternativas');const raw=form.capture(),ids=Object.fromEntries(Object.entries({strength:'coachchange',running:'runplan',sport:'sportplan',nutrition:'nut'}).map(([k,p])=>[k,raw[k]===null?null:uid(p)]));if(alternatives.some(x=>JSON.stringify(x.raw)===JSON.stringify(raw)))throw Error('Esta alternativa ya está incluida');const p=bundle.review(s.data,raw,ids,s.today,api,s.current);bundle.apply(s.data,p,s.today,api,s.current);stamp={disk:s.disk,today:s.today,current:JSON.stringify(s.current)};alternatives.push({raw:JSON.parse(JSON.stringify(raw)),view:p.view});showList();status.textContent='Alternativa local añadida. Sin cambios guardados.'});
 btn(panel,'Clear','Eliminar alternativas locales',()=>{clearReview();alternatives=[];stamp=null;showList();status.textContent='Alternativas eliminadas. Sin cambios guardados.'});
 const runCount=field('runFrequency','Running: sesiones por semana (si se incluyó)','select'),sportCount=field('sportFrequency','Deporte: sesiones por semana (si se incluyó)','select');for(const x of [runCount,sportCount])x.add(new Option('Elegí frecuencia',''));for(const i of [2,3,4])runCount.add(new Option(String(i),String(i)));for(const i of [1,2,3])sportCount.add(new Option(String(i),String(i)));
 panel.append(n('p','Para generar alternativas, marcá todos tus días disponibles en el formulario anterior y elegí cuántas sesiones por semana querés. Conserva tus metas, volumen, perfil y nutrición confirmados. No cambia el calendario hasta aceptar.'));
 btn(panel,'Generate','Generar alternativas de calendario',async()=>{clearReview();const s=state();if(s.busy)throw Error('Guardá el diario primero');if(stamp)same();if(alternatives.length>=8)throw Error('Máximo ocho alternativas');const raw=form.capture(),frequency={running:raw.running===null?null:Number(runCount.value),sport:raw.sport===null?null:Number(sportCount.value)},store=typeof asiaCandidateSession!=='undefined'?asiaCandidateSession.moduleStore:null;if(!store)throw Error('Agenda PRO no disponible');const gym=await store.read('gym');if(!Number.isSafeInteger(gym?.revision)||gym.revision<0||gym.revision&&(!Array.isArray(gym.payload?.planned)||!Array.isArray(gym.payload?.sessions)||gym.payload.active))throw Error('Agenda PRO no disponible o sesión activa');const after=state();if(after.busy||after.disk!==s.disk||after.today!==s.today||JSON.stringify(after.current)!==JSON.stringify(s.current)||JSON.stringify(raw)!==JSON.stringify(form.capture()))throw Error('Cambió el diario o el formulario');if(!panel.open)throw Error('Generación descartada');const result=generateCalendar1189({data:s.data,draft:raw,frequency,proDates:gym.revision?[...gym.payload.planned,...gym.payload.sessions].map(x=>x.date):[],today:s.today,api,current:s.current,bundle,newId:uid});const seen=new Set(alternatives.map(x=>JSON.stringify(x.raw)));const added=result.alternatives.filter(a=>!seen.has(JSON.stringify(a.raw))).slice(0,8-alternatives.length);if(added.length){stamp={disk:s.disk,today:s.today,current:JSON.stringify(s.current)};alternatives.push(...added);showList()}status.textContent=added.length+' alternativas nuevas · '+result.attempted+' combinaciones verificadas'+(result.searchLimited?' (búsqueda limitada)':'')+'. Sin cambios guardados.'+(added.length?'':' Revisá disponibilidad o alternativas existentes.');});
 panel.append(list);
 btn(panel,'Prepare','Revisar contexto de conversación',()=>{same();draw(c.prepare({question:question.value,goal:goal.value,alternatives:alternatives.map(x=>x.raw)}));status.textContent='Contexto revisable. No se enviaron datos.'});
 panel.append(out,status);
 function draw(v){if(!panel.open&&!['idle','saved','unconfirmed'].includes(v.phase)){clearReview();return}displayed=v;out.replaceChildren();
  if(v.phase==='consent'){
   out.append(n('h3','Contexto exacto · prueba local'),n('p','Solo resúmenes de alternativas, texto y aclaraciones. No incluye automáticamente fechas exactas, notas, fotos ni identificadores internos.'));const pre=n('pre',JSON.stringify(v.payload,null,2));pre.style.whiteSpace='pre-wrap';pre.style.overflowWrap='anywhere';out.append(pre);
   const consent=n('input'),l=n('label','Confirmo el contexto exacto');consent.type='checkbox';consent.id='ch1188-consent';l.htmlFor=consent.id;out.append(consent,l);
   const provider=n('button','Proveedor de IA no habilitado');provider.type='button';provider.id='coachHybridSend1188';provider.disabled=true;out.append(provider);
   btn(out,'Sample','Probar respuesta fija local (sin IA)',async()=>draw(await c.send(displayed,consent.checked)));
  }else if(['answer','review'].includes(v.phase)){
   out.append(n('h3','Respuesta fija local · sin IA'),n('p',v.reply.answer));
   if(v.reply.kind==='clarify'){
    const answers=v.reply.questions.map((q,i)=>{const l=n('label',q),x=n('textarea');x.id='ch1188-answer'+i;x.maxLength=500;l.htmlFor=x.id;out.append(l,x);return x});
    btn(out,'Follow','Revisar respuestas antes de continuar',()=>draw(c.followUp(displayed,answers.map(x=>x.value))));
   }else if(v.reply.kind==='proposal'){
    out.append(n('p','Alternativa de prueba: '+v.reply.choice+'. Podés elegir otra.'));
    const choice=n('select'),l=n('label','Alternativa a revisar');choice.id='ch1188-choice';l.htmlFor=choice.id;for(const o of v.options)choice.add(new Option('Alternativa '+o.alias.slice(1),o.alias));choice.value=v.choice??v.reply.choice;out.append(l,choice);
    const confirmed=n('input'),cl=n('label','Confirmo la alternativa y los datos indicados');confirmed.type='checkbox';confirmed.id='ch1188-confirm';cl.htmlFor=confirmed.id;out.append(confirmed,cl);
    btn(out,'Review','Revisar conjunto seleccionado',async()=>draw(await c.review(displayed,choice.value,confirmed.checked)));
    if(v.phase==='review'){
     const review=n('div');review.id='coachHybridReviewView1188';form.render(v.proposal,review);out.append(review);
     const apply=btn(out,'Apply','Aceptar y guardar conjunto localmente',async()=>{if(choice.value!==displayed.choice)throw Error('Revisá la alternativa seleccionada');if(!confirm('¿Guardar este conjunto revisado sin modificar el historial?'))return;draw(await c.apply(displayed,true));alternatives=[];stamp=null;showList();refresh();status.textContent='Conjunto de prueba guardado localmente.'});choice.onchange=()=>{apply.disabled=true};
    }
   }
  }
  if(['consent','answer','review'].includes(v.phase))btn(out,'Reject','Descartar conversación (conservar alternativas)',()=>{clearReview();status.textContent='Conversación descartada. Sin cambios guardados.'});
 }
 question.addEventListener('input',()=>{if(!locked)clearReview()});goal.addEventListener('input',()=>{if(!locked)clearReview()});
 panel.ontoggle=()=>{if(!panel.open){try{clearReview()}catch{}}};showList();
}
