/* V5.4.1 — Local presentation preferences for each tab. Move existing DOM nodes only. */
(()=>{'use strict';
const el=id=>document.getElementById(id),main=document.querySelector('main'),help=el('help502'),home=el('layout51');
if(!main||!help||!home)return;
const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,fn,cls='secondary')=>{const b=make('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
const specs=[['diet','Dieta',[['overview','lastWeight'],['daily','dailyV4'],['adaptive','adaptiveNutrition823'],['foods','foods44'],['nutrition','nutrition52'],['water','water52'],['measure','measureV4'],['charts','chartsV4'],['history','historyV4'],['compare','compareV4'],['calendar','dietCalendarV4'],['photos','photosV4'],['weekly','weeklyV4']]],['training','Gym',[['work','workV4'],['strength','strengthV4'],['sessions','sessionsV4'],['calendar','trainCalendarV4'],['muscle','muscleV4']]],['health','Salud',[['health','healthRefresh'],['history','healthMetric'],['coach','healthAnalyze'],['daily','healthStepsCopy'],['watch','watch43'],['transfer','healthTransfer828'],['sources','healthSources828']]],['progress54','Progreso',[['overview','range54'],['stats','category54'],['photos','view54'],['report','reportPeriod818'],['simulator','simulator825']]]];
const organizerByTab=new Map([['home',home]]),revealByNode=new Map(),resetByTab=new Map([['home',()=>window.asiaResetHomeFold51?.()]]);
// Shared data/settings remain accessible from every tab. AI panels are consolidated in Asia Coach below.
for(const id of ['settingsV4']){const n=el(id);if(n?.parentElement===main)main.insertBefore(n,help);}
main.insertBefore(home,help);
for(const [id,title,items] of specs){
 const root=el(id);if(!root)continue;
 const cards=new Map();for(const [k,anchor] of items){const node=el(anchor)?.closest('.card');if(!node||node.parentElement!==root||[...cards.values()].some(c=>c.node===node))continue;const heading=node.tagName==='DETAILS'?node.querySelector(':scope > summary'):node.querySelector('h2');if(!heading)continue;cards.set(k,{node,heading,name:heading.textContent.trim()});}
 if(!cards.size)continue;
 const keys=[...cards.keys()],key='asia-layout-v541-'+id;
 const defaults=()=>({order:[...keys],hidden:[],singleOpen:false,folded:[...cards].filter(([,c])=>c.initialFold).map(([k])=>k)});
 for(const [k,c] of cards)c.initialFold=(c.node.tagName==='DETAILS'&&!c.node.open)||['report','simulator'].includes(k);
 function normalize(x){if(!x||typeof x!=='object')return defaults();const valid=a=>Array.isArray(a)?[...new Set(a.filter(k=>cards.has(k)))]:[];const order=valid(x.order);return {order:[...order,...keys.filter(k=>!order.includes(k))],hidden:valid(x.hidden),singleOpen:x.singleOpen===true,folded:Array.isArray(x.folded)?[...new Set([...valid(x.folded),...defaults().folded.filter(k=>!order.includes(k))])]:defaults().folded};}
 let state=defaults();try{state=normalize(JSON.parse(localStorage.getItem(key)||'null'));}catch{}
 const organizer=make('details',null,'card layout51 layout541');organizer.id='layout541-'+id;organizer.append(make('summary','⚙ Personalizar '+title),make('p','Ordená u ocultá apartados. Al entrar se abre el primero visible. No borra registros.','tiny'));
 const list=make('div',null,'layoutList51'),msg=make('p','','tiny');msg.setAttribute('role','status');organizer.append(list,msg);main.insertBefore(organizer,help);organizerByTab.set(id==='progress54'?'progress':id,organizer);resetByTab.set(id==='progress54'?'progress':id,()=>{const first=state.order.find(k=>!state.hidden.includes(k)&&cards.get(k).node.parentElement===root&&!cards.get(k).node.hidden&&!cards.get(k).node.classList.contains('hide'));for(const k of state.order)fold(k,k!==first,false);organizer.open=false;sync();});
const singleLabel=make('label',null,'singleFold8812 layoutLabel51'),single=make('input');single.type='checkbox';single.checked=state.singleOpen;singleLabel.append(single,make('span','Cerrar otros apartados al abrir uno'));const singleHint=make('p','Solo en esta pestaña. No cierra formularios internos ni elimina datos.','tiny');singleHint.id=organizer.id+'-singleHint8812';single.setAttribute('aria-describedby',singleHint.id);list.before(singleLabel,singleHint);single.addEventListener('change',()=>{state.singleOpen=single.checked;if(state.singleOpen){const keep=state.order.find(k=>!state.hidden.includes(k)&&!state.folded.includes(k)&&cards.get(k).node.parentElement===root);if(keep)fold(keep,false);else save();}else save();});
 function save(){try{localStorage.setItem(key,JSON.stringify(state));msg.textContent='';}catch{msg.textContent='No se pudo guardar la vista; los cambios son temporales.';}}
 function member(prop,k,on){state[prop]=state[prop].filter(x=>x!==k);if(on)state[prop].push(k);}
 function fold(k,on,store=true){const c=cards.get(k);member('folded',k,on);if(c.node.tagName==='DETAILS'){if(c.node.open===on)c.node.open=!on;}else{c.node.classList.toggle('folded51',on);c.toggle.setAttribute('aria-expanded',String(!on));}if(store){if(!on&&state.singleOpen)for(const other of state.order)if(other!==k&&cards.get(other).node.parentElement===root)fold(other,true,false);save();sync();}}
 function reveal(k){const c=cards.get(k);if(state.hidden.includes(k)||state.folded.includes(k)||c.node.classList.contains('hiddenPanel51')||(c.node.tagName==='DETAILS'&&!c.node.open)){member('hidden',k,false);c.node.classList.remove('hiddenPanel51');fold(k,false);}}
 for(const [k,c] of cards){c.node.dataset.panel541=k;revealByNode.set(c.node,()=>reveal(k));if(c.node.tagName==='DETAILS'){c.node.addEventListener('toggle',()=>{const on=!c.node.open;if(state.folded.includes(k)!==on){fold(k,on);}});}else{const header=c.heading.parentElement===c.node?c.heading:c.heading.parentElement;header.classList.add('foldHeader51');c.toggle=button(c.name,()=>fold(k,!state.folded.includes(k)),'foldToggle51');c.toggle.setAttribute('aria-label',c.name);c.heading.replaceChildren(c.toggle);const label=make('span',c.toggle.textContent,'foldLabel901');c.toggle.replaceChildren(label);for(const pill of header.querySelectorAll(':scope > .pill'))c.toggle.append(pill);}}
 function sync(){single.checked=state.singleOpen;for(const row of list.children){const k=row.dataset.key51,i=state.order.indexOf(k);row.querySelector('input').checked=!state.hidden.includes(k);const [up,down,f]=row.querySelectorAll('button');up.disabled=i===0;down.disabled=i===keys.length-1;f.textContent=state.folded.includes(k)?'Abrir':'Plegar';f.setAttribute('aria-label',f.textContent+' '+cards.get(k).name);}}
 function apply(){for(const k of state.order){const c=cards.get(k);root.append(c.node);c.node.classList.toggle('hiddenPanel51',state.hidden.includes(k));fold(k,state.folded.includes(k),false);}for(const k of state.order)list.append(list.querySelector(`[data-key51="${k}"]`));sync();}
 function move(k,d){const i=state.order.indexOf(k),j=i+d;if(j<0||j>=keys.length)return;[state.order[i],state.order[j]]=[state.order[j],state.order[i]];apply();save();const row=list.querySelector(`[data-key51="${k}"]`),b=row.querySelectorAll('button')[d<0?0:1];(b.disabled?row.querySelector('input'):b).focus({preventScroll:true});}
 for(const k of keys){const c=cards.get(k),row=make('div',null,'layoutRow51');row.dataset.key51=k;const label=make('label',null,'layoutLabel51'),check=make('input');check.type='checkbox';check.addEventListener('change',()=>{member('hidden',k,!check.checked);c.node.classList.toggle('hiddenPanel51',!check.checked);save();sync();});label.append(check,make('span',c.name));const tools=make('div',null,'layoutTools51');for(const [txt,d] of [['↑',-1],['↓',1]]){const b=button(txt,()=>move(k,d));b.setAttribute('aria-label',(d<0?'Subir ':'Bajar ')+c.name);tools.append(b);}tools.append(button('Plegar',()=>fold(k,!state.folded.includes(k))));row.append(label,tools);list.append(row);}
 organizer.append(button('Restablecer orden original',()=>{state=defaults();apply();save();}));apply();
}
// Normal entry folds every panel except first visible in personalized order. Explicit shortcuts can reveal their target.
window.asiaRevealPanel541=target=>{window.asiaRevealHome51?.(target);for(let n=target;n&&n!==main;n=n.parentElement){const reveal=revealByNode.get(n);if(reveal)reveal();}};
window.asiaScrollTo541=(target,options)=>{if(!target)return;window.asiaRevealPanel541(target);target.scrollIntoView(options);};
function show(t){for(const [name,panel] of organizerByTab)panel.classList.toggle('hide',name!==t);}
window.asiaInitialView85=t=>resetByTab.get(t)?.();
const previousTab=tab;tab=function(t){previousTab(t);show(t);resetByTab.get(t)?.();};
const active=[['home','home42'],['diet','diet'],['training','training'],['health','health'],['progress','progress54']].find(([,id])=>!el(id)?.classList.contains('hide'));
show(active?.[0]||'home');resetByTab.get(active?.[0]||'home')?.();
// V8.8.13 — one AI hub, with legacy history isolated by its original consent and storage.
const hub=el('coach50'),hubInfo=el('coachInfo8810'),classic=el('coachV4'),connection=el('configV4');
if(hub&&hubInfo&&classic&&connection){
 function nest(panel,title){panel.classList.remove('card','sectionfold');panel.classList.add('coachDisclosure8810','aiHubSection8813');panel.querySelector(':scope > summary').textContent=title;panel.open=false;hubInfo.append(panel);}
 hubInfo.querySelector(':scope > summary').textContent='Metas, memoria, historial y configuración';
 nest(connection,'Conexión con IA · clave y privacidad');
 nest(classic,'Chat clásico · historial anterior');
 const intro=el('aiCoach').querySelector('p.meta');
 intro.textContent='Tus conversaciones anteriores se conservan aquí. Si querés retomarlas, el modo clásico mantiene su contexto y permisos originales. No se mezclan con el chat principal.';
 const legacyResult=el('aiChatResult'),legacyQuestion=el('aiQuestion');legacyQuestion.before(legacyResult);legacyResult.setAttribute('role','log');legacyResult.setAttribute('aria-live','polite');legacyQuestion.setAttribute('aria-label','Pregunta para el chat clásico');el('aiClearChat').parentElement.after(el('classicStatus8813'));
 const privacy=make('p','Las consultas clásicas envían un resumen reciente y hasta seis mensajes anteriores compatibles con el permiso de Salud. Los mensajes con permiso desconocido no se reenvían.','tiny');intro.after(privacy);
 const back=button('Ir al chat principal',()=>{hubInfo.open=false;window.asiaOpenCoachHub8813('coachQuestion50');});classic.append(back);
 const healthNote=make('p','El chat principal permite elegir su contexto en cada consulta. La conexión es compartida con el escáner de alimentos, etiquetas, Xiaomi y otras funciones de IA.','tiny');connection.append(healthNote);
 function openHub(targetId='coach50'){
  const target=el(targetId);if(!target||!hub.contains(target)&&target!==hub)return false;
  if(!el('coachDialog51')?.open){if(el('home42').classList.contains('hide'))tab('home');window.asiaRevealPanel541(hub);}
  for(let n=target;n&&n!==hub;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;
  requestAnimationFrame(()=>{if(target.getClientRects().length)target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});return true;
 }
 window.asiaOpenCoachHub8813=openHub;
 window.asiaOpenSettings=()=>openHub('configV4');
 // A dedicated link still permits connection setup from shared settings if the Coach was hidden.
 const settings=el('settingsV4');if(settings){const b=button('Configurar conexión con IA',()=>openHub('configV4'));b.id='aiHubSettings8813';settings.querySelector(':scope > summary').after(b);}
}
// Existing history-edit buttons sometimes navigate without scrolling.
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b?.dataset.workEdit&&!window.asiaGymHasSession532?.()&&!window.asiaClassicRunning532?.()&&window.asiaGym84Active!==true){window.asiaRevealPanel541(el('workV4'));window.asiaOpenGymView901?.(true);}});
})();
