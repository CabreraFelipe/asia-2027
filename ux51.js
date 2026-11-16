/* V5.1 — local, reversible presentation settings. No fitness data or API changes. */
(()=>{'use strict';
const el=id=>document.getElementById(id), home=el('home42'), coach=el('coach50');
if(!home||!coach)return;
const specs=[['day','Tu día','homeDate42'],['workout','Entrenamiento de hoy','homeWorkout42'],['recovery','Recuperación diaria','recovery43'],['weight','Camino al 8 de marzo','trendRate42'],['energy','Balance energético','balanceDay42'],['advice','Orientación de hoy','homeAdvice42'],['vacation','Modo vacaciones','vacation44'],['badges','Mis logros','badges44'],['coach','Asia Coach AI','coach50'],['backup','Copia de seguridad en Cloudflare','backupNow42']];
const cards=new Map(specs.map(([k,n,id])=>[k,{name:n,node:el(id)?.closest('.card')} ]));
if([...cards.values()].some(x=>!x.node||x.node.parentElement!==home)||new Set([...cards.values()].map(x=>x.node)).size!==specs.length)return;
const keys=specs.map(x=>x[0]), key='asia-layout-v51';
const defaults=()=>({order:[...keys],hidden:[],folded:['badges']});
function normalize(x){if(!x||typeof x!=='object')return defaults();const list=(a)=>Array.isArray(a)?[...new Set(a.filter(k=>cards.has(k)))]:[];const order=list(x.order);return {order:[...order,...keys.filter(k=>!order.includes(k))],hidden:list(x.hidden),folded:Array.isArray(x.folded)?list(x.folded):['badges']};}
let state=defaults();try{state=normalize(JSON.parse(localStorage.getItem(key)||'null'));}catch{}
const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==null)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,fn,cls='secondary')=>{const b=make('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
const organizer=make('details',null,'card layout51');organizer.id='layout51';organizer.append(make('summary','⚙ Personalizar Inicio'));const intro=make('p','Ordená, ocultá o recuperá apartados. Solo cambia la vista de este dispositivo.','tiny');organizer.append(intro);const list=make('div',null,'layoutList51');organizer.append(list);const message=make('p','','tiny');message.setAttribute('role','status');organizer.append(message);home.prepend(organizer);
const controls=new Map();
function save(){try{localStorage.setItem(key,JSON.stringify(state));message.textContent='';}catch{message.textContent='No se pudo guardar la vista; los cambios son solo temporales.';}}
function setMember(prop,k,on){state[prop]=state[prop].filter(x=>x!==k);if(on)state[prop].push(k);}
function fold(k,on,store=true){const {node}=cards.get(k);setMember('folded',k,on);if(node.tagName==='DETAILS'){if(node.open===on)node.open=!on;}else{node.classList.toggle('folded51',on);controls.get(k)?.setAttribute('aria-expanded',String(!on));}if(store){save();syncRows();}}
for(const [k,{node,name}] of cards){node.dataset.panel51=k;if(node.tagName==='DETAILS'){node.addEventListener('toggle',()=>{const on=!node.open;if(state.folded.includes(k)!==on){setMember('folded',k,on);save();syncRows();}});continue;}
 const heading=node.querySelector('h2');if(!heading)continue;const header=heading.parentElement===node?heading:heading.parentElement;header.classList.add('foldHeader51');const b=button(heading.textContent,()=>fold(k,!state.folded.includes(k)),'foldToggle51');b.setAttribute('aria-label',name);heading.replaceChildren(b);controls.set(k,b);
}
function apply(){for(const k of state.order){const {node}=cards.get(k);if(node!==coach||!dialog.open)home.append(node);node.classList.toggle('hiddenPanel51',state.hidden.includes(k));fold(k,state.folded.includes(k),false);}syncRows();}
function syncRows(){for(const row of list.children){const k=row.dataset.key51,i=state.order.indexOf(k);row.querySelector('input').checked=!state.hidden.includes(k);const [up,down,f]=row.querySelectorAll('button');up.disabled=i===0;down.disabled=i===keys.length-1;f.textContent=state.folded.includes(k)?'Abrir':'Plegar';f.setAttribute('aria-label',f.textContent+' '+cards.get(k).name);}}
function move(k,delta){const i=state.order.indexOf(k),j=i+delta;if(j<0||j>=keys.length)return;[state.order[i],state.order[j]]=[state.order[j],state.order[i]];apply();for(const item of state.order)list.append(list.querySelector(`[data-key51="${item}"]`));save();const row=list.querySelector(`[data-key51="${k}"]`),b=row.querySelectorAll('button')[delta<0?0:1];(b.disabled?row.querySelector('input'):b).focus({preventScroll:true});}
for(const k of state.order){const {name}=cards.get(k),row=make('div',null,'layoutRow51');row.dataset.key51=k;const label=make('label',null,'layoutLabel51'),check=make('input',null);check.type='checkbox';check.checked=!state.hidden.includes(k);check.addEventListener('change',()=>{setMember('hidden',k,!check.checked);cards.get(k).node.classList.toggle('hiddenPanel51',!check.checked);save();syncRows();});label.append(check,make('span',name));const tools=make('div',null,'layoutTools51');for(const [txt,d] of [['↑',-1],['↓',1]]){const b=button(txt,()=>move(k,d));b.setAttribute('aria-label',(d<0?'Subir ':'Bajar ')+name);tools.append(b);}tools.append(button('Plegar',()=>fold(k,!state.folded.includes(k))));row.append(label,tools);list.append(row);}
const reset=button('Restablecer orden original',()=>{state=defaults();apply();for(const k of keys)list.append(list.querySelector(`[data-key51="${k}"]`));save();});organizer.append(reset);
// Full screen uses the existing coach node, never clones fields, messages or event handlers.
const dialog=make('dialog',null,'coachDialog51');dialog.id='coachDialog51';dialog.setAttribute('aria-labelledby','coachDialogTitle51');const rail=make('div',null,'coachRail51');const title=make('strong','Asia Coach AI');title.id='coachDialogTitle51';const close=button('✕ Cerrar',()=>dialog.close());rail.append(title,close);dialog.append(rail);document.body.append(dialog);
const expanded=button('⛶ Pantalla completa',()=>openCoach(expanded));expanded.id='coachExpand51';const coachHeader=coach.querySelector('h2').parentElement;coachHeader.after(expanded);organizer.append(button('Abrir Asia Coach AI',e=>openCoach(e.currentTarget)));
let anchor=null,returnTo=null,pageScroll=0,oldFold=false,oldHidden=false,oldChatTop=0,opts=null,moved=[];
const chat=el('coachChat50');
function openCoach(trigger){if(dialog.open)return;returnTo=trigger;pageScroll=window.scrollY;oldFold=state.folded.includes('coach');oldHidden=state.hidden.includes('coach');oldChatTop=chat.scrollTop;anchor=document.createComment('coach51 original position');coach.before(anchor);coach.classList.remove('folded51','hiddenPanel51');dialog.append(coach);opts=make('details',null,'coachOptions51');opts.append(make('summary','Metas, consumo e historial'));coach.prepend(opts);moved=[];
 // Keep the actual question, sharing toggle, warnings, proposal and consultation buttons visible.
 const direct=[...coach.children];const selected=[coachHeader,...direct.filter(n=>n.matches('.grid,details,button#coachClear50')&&n!==opts),...direct.filter(n=>n.matches('p.compact502')&&n.textContent.startsWith('No es diagnóstico'))];
 for(const n of new Set(selected)){const marker=document.createComment('coach51 option');n.before(marker);moved.push([marker,n]);opts.append(n);}
 document.documentElement.classList.add('coachModal51');try{dialog.showModal();}catch{restoreCoach();notify('No se pudo abrir la pantalla completa.');return;}dialog.scrollTop=0;chat.scrollTop=oldChatTop;close.focus({preventScroll:true});}
function restoreCoach(){if(!anchor)return;const top=chat.scrollTop;for(const [m,n] of moved)m.replaceWith(n);opts?.remove();anchor.replaceWith(coach);anchor=null;moved=[];opts=null;coach.classList.toggle('hiddenPanel51',state.hidden.includes('coach'));coach.classList.toggle('folded51',state.folded.includes('coach'));document.documentElement.classList.remove('coachModal51');window.scrollTo(0,pageScroll);chat.scrollTop=top;if(returnTo?.isConnected)returnTo.focus({preventScroll:true});returnTo=null;}
dialog.addEventListener('close',restoreCoach);
// A shortcut should always reveal its target even when a section was hidden by the user.
function reveal(k){setMember('hidden',k,false);cards.get(k).node.classList.remove('hiddenPanel51');fold(k,false);}
const oldQuick=el('quickGym505').onclick;el('quickGym505').onclick=()=>{const vacation=window.asiaVacationContext44?.().active;const planned=[1,2,4,5].includes(new Date(date()+'T12:00:00').getDay());if(vacation)reveal('vacation');else if(!planned)reveal('workout');oldQuick();};
const oldGym=el('homeGym42').onclick;el('homeGym42').onclick=()=>{if(window.asiaVacationContext44?.().active)reveal('vacation');oldGym();};
const oldCoach=el('homeCoach42').onclick;el('homeCoach42').onclick=e=>{if(state.hidden.includes('coach')||state.folded.includes('coach'))openCoach(e.currentTarget);else oldCoach();};
apply();
})();
