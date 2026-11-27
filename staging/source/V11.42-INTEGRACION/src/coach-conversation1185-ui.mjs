import {createConversation1185} from './coach-conversation1185.mjs';
import {coachUiPolicy} from './coach-client-policy.mjs';
const el=id=>document.getElementById(id),n=(tag,t)=>{const x=document.createElement(tag);if(t!==undefined)x.textContent=t;return x},anchor=el('coachActions1179');
if(anchor&&window.asiaCoachContext1181&&window.asiaCoachPersist1184){
 const api={A:window.asiaCoachActions1179,Gym:window.asiaGym826,S:window.asiaSchedule829,T:window.asiaTraining102,R:window.asiaRunning1174,Sport:window.asiaSport1177},uid=()=> 'coachchange-'+Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
 const mode=coachUiPolicy(typeof asiaCandidateSession!=='undefined'?asiaCandidateSession.coachInference:null,'strength',typeof asiaCandidateSession!=='undefined'&&asiaCandidateSession.coachSyntheticOnly===true),transport=mode.transport;
 const c=createConversation1185({context:window.asiaCoachContext1181,api,persist:window.asiaCoachPersist1184,newId:uid,transport,allowSynthetic:mode.synthetic,getState:()=>({data,disk:disk600,today:date(),busy:blocked600||localStorage.getItem(key)!==disk600||JSON.stringify(data)!==disk600||window.asiaGym84Ready!==true||window.asiaGym84Active===true||!!window.asiaGymHasSession532?.()||!!window.asiaClassicRunning532?.()||el('routine').disabled})});
 const panel=n('details');panel.id='coachConversation1185';panel.className='gymMini571';anchor.before(panel);panel.append(n('summary','Conversación con el Coach'),n('p',mode.synthetic?'Candidato sintético: proveedor real no habilitado. Podés revisar el contexto y probar el recorrido con una respuesta fija local. No es asesoramiento ni una respuesta de IA. No ingreses información personal. Los ajustes manuales siguen disponibles.':'Revisá qué datos compartís antes de consultar. Los ajustes manuales siguen disponibles; ninguna propuesta se aplica sin confirmación.'));
 const field=(id,label,tag,type)=>{const l=n('label',label),x=n(tag);x.id='cc1185-'+id;l.htmlFor=x.id;if(type)x.type=type;panel.append(l,x);return x};
 const question=field('question','¿Qué querés cambiar de tu próxima rutina?','textarea');question.maxLength=1200;
 const goal=field('goal','Objetivo opcional (texto que se compartiría)','input','text');goal.maxLength=300;
 const day=field('day','Fecha futura','input','date'),scope=field('scope','Alcance','select');scope.add(new Option('Solo esa sesión','once'));scope.add(new Option('Ese día semanal hasta terminar el programa','future'));
 const choices=field('choices','Ejercicios cuya disponibilidad y técnica confirmás (opcional)','select');choices.multiple=true;choices.size=5;
 const status=n('p');status.id='coachConversationStatus1185';status.setAttribute('role','status');const output=n('div');output.id='coachConversationOutput1185';
 const prep=n('button','Revisar datos de la consulta');prep.type='button';prep.id='coachConversationPrepare1185';panel.append(prep,output,status);
 let displayed=null,operationFields=[],locked=false;panel.setAttribute('aria-busy','false');
 const button=(parent,id,label,fn)=>{const x=n('button',label);x.type='button';x.id=id;parent.append(x);x.onclick=()=>run(fn);return x};
 function refreshChoices(){const selected=new Set([...choices.selectedOptions].map(x=>x.value));choices.replaceChildren(...api.Gym.names104(data.settings).map(name=>{const o=new Option(name,name);o.selected=selected.has(name);return o}));}
 function input(parent,k,value,index){const l=n('label',({at:'Posición (1 = primer ejercicio)',to:'Destino (1 = primer ejercicio)',sets:'Series',min:'Repeticiones mínimas',max:'Repeticiones máximas',rest:'Descanso (s)'})[k]),x=n('input');x.type='number';x.step='1';x.id='cc1185-op-'+index+'-'+k;l.htmlFor=x.id;x.value=String(k==='at'||k==='to'?value+1:value);parent.append(l,x);return x}
 function draw(v){if(!panel.open&&!['saved','idle','unconfirmed'].includes(v.phase)){try{c.discard()}catch{}v=c.view()}displayed=v;output.replaceChildren();operationFields=[];
  if(v.phase==='consent'){
   output.append(n('h3','Revisá el contexto exacto'),n('p','El texto libre puede contener información privada. Modificalo antes de autorizar. No se incluyen historial, fotos ni identificadores de cuenta en este contexto.'));
   const pre=n('pre',JSON.stringify(v.payload,null,2));pre.style.whiteSpace='pre-wrap';pre.style.overflowWrap='anywhere';output.append(pre);
   const consent=n('input');consent.type='checkbox';consent.id='cc1185-consent';const l=n('label','Confirmo haber revisado estos datos.');l.htmlFor=consent.id;output.append(consent,l);
   const send=button(output,'coachConversationSend1185','Enviar al proveedor de IA',async()=>draw(await c.send(displayed,consent.checked,'provider')));send.disabled=!v.providerAvailable;
   if(v.syntheticAvailable)button(output,'coachConversationSample1185','Probar respuesta fija local (sin IA)',async()=>draw(await c.send(displayed,consent.checked,'synthetic')));
  }else if(['answer','review'].includes(v.phase)){
   output.append(n('h3',v.source==='synthetic'?'Respuesta de prueba local':'Respuesta del Coach'),n('p',v.reply.answer),...v.reply.questions.map(q=>n('p',q)));
   if(v.reply.kind==='proposal'){
    const editor=n('div');editor.id='cc1185-editor';for(const [i,op] of v.edited.entries()){const box=n('fieldset'),legend=n('legend',(i+1)+'. '+({add:'Agregar',replace:'Sustituir',remove:'Quitar',move:'Reordenar',dose:'Cambiar dosis'})[op.type]);box.append(legend);const fields={};for(const k of ['at','to','sets','min','max','rest'])if(op[k]!==null)fields[k]=input(box,k,op[k],i);if(op.choice!==null){const x=n('select'),l=n('label','Ejercicio confirmado');x.id='cc1185-op-'+i+'-choice';l.htmlFor=x.id;for(const choice of v.choices)x.add(new Option(choice.name,choice.alias));x.value=op.choice;fields.choice=x;box.append(l,x);}operationFields.push({op,fields});editor.append(box);}
    const confirmMaterial=n('input');confirmMaterial.type='checkbox';confirmMaterial.id='cc1185-material';const l=n('label','Confirmo la disponibilidad, técnica y cambios que reviso.');l.htmlFor=confirmMaterial.id;editor.append(confirmMaterial,l);
    const read=()=>operationFields.map(({op,fields})=>({...op,...Object.fromEntries(Object.entries(fields).map(([k,x])=>[k,k==='choice'?x.value:Number(x.value)-(k==='at'||k==='to'?1:0)]))}));
    button(editor,'coachConversationReview1185','Revisar efecto en la rutina',async()=>draw(await c.review(read(),confirmMaterial.checked)));output.append(editor);
    if(v.phase==='review'){const p=v.proposal;output.append(n('h3','Antes y después · sin guardar'),n('p',p.programme+' · '+p.dates.join(', ')),n('p',p.beforeMinutes+' → '+p.afterMinutes+' min estimados'));
     for(const [label,r] of [['Antes',p.before],['Después',p.after]])output.append(n('h4',label+' · '+r.name),...r.entries.map(e=>n('p',e.exercise+' · '+e.sets+' × '+e.min+'–'+e.max+' · '+e.rest+' s')));
     const apply=button(output,'coachConversationApply1185','Aceptar y guardar localmente',async()=>{if(JSON.stringify(read())!==JSON.stringify(displayed.edited))throw Error('Revisá nuevamente los cambios editados');if(!confirm('¿Guardar esta nueva versión en las fechas revisadas?'))return;draw(await c.apply(displayed,true));refresh();status.textContent=v.source==='synthetic'?'Propuesta de prueba guardada localmente. Sincronización independiente.':'Propuesta guardada localmente. Sincronización independiente.'});
     editor.addEventListener('input',()=>{apply.disabled=true});
    }
   }
  }
  if(['consent','answer','review'].includes(v.phase))button(output,'coachConversationReject1185','Descartar y continuar manualmente',()=>{c.discard();draw(c.view());status.textContent='Descartado. Sin cambios.'});
 }
 function run(fn){
  if(locked)return;locked=true;panel.setAttribute('aria-busy','true');status.textContent='';
  const saved=new Map();
  const disable=()=>{for(const x of panel.querySelectorAll('button,input,textarea,select'))if(!saved.has(x)){saved.set(x,x.disabled);x.disabled=true}};
  const finish=()=>{for(const [x,was] of saved)if(x.isConnected)x.disabled=was;locked=false;panel.setAttribute('aria-busy','false');if(c.view().phase==='unconfirmed')prep.disabled=true};
  const fail=e=>{status.textContent=e.message||'No se completó la operación.';if(c.view().phase==='unconfirmed')output.replaceChildren(n('p','Guardado no confirmado. Cerrá y verificá la rama antes de volver a editar.'))};
  try{const result=fn();if(result&&typeof result.then==='function'){disable();return Promise.resolve(result).catch(fail).finally(finish)}finish()}
  catch(e){fail(e);finish()}
 }
 prep.onclick=()=>run(()=>{const selection={day:day.value,scope:scope.value,question:question.value,goal:goal.value,availableExercises:[...choices.selectedOptions].map(x=>x.value)};draw(c.prepare(selection));status.textContent='Contexto revisable. No se enviaron datos.'});
 for(const x of [question,goal,day,scope,choices])x.addEventListener('input',()=>{try{c.discard();draw(c.view());status.textContent='Consulta modificada; revisá nuevamente.'}catch{}});
 panel.ontoggle=()=>{if(panel.open)refreshChoices();else{try{c.discard();draw(c.view())}catch{}}};refreshChoices();
}
