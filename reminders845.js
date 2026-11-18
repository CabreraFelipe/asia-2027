/* V8.4.5: opt-in server queue for the original reminder calendar. */
(function(){'use strict';
const legacy=typeof module!=='undefined'&&module.exports?require('./reminders821.js'):window.asiaReminders821;
const DAY=86400000;
function build(source,now,includeWeight,planner=legacy,extended=false){
 if(!planner)throw Error('Calendario no disponible');const start=planner.localClock(now).day,events=[];
 for(let n=0;n<(extended&&includeWeight?115:14);n++){const day=new Date(Date.parse(start)+n*DAY).toISOString().slice(0,10);if(day>'2027-03-08')break;const p=planner.plan(source,new Date(day+'T00:00:00-03:00'));
 for(const item of p.items){if(item.status==='registered'||(!includeWeight&&item.id==='weight')||(n>=14&&item.id!=='weight'))continue;const due=Date.parse(day+'T'+item.time+':00-03:00');if(due>now.getTime()&&(due<=now.getTime()+14*DAY||(extended&&item.id==='weight'&&day<='2027-03-08')))events.push({kind:item.id,due});}}
 return events.sort((a,b)=>a.due-b.due||a.kind.localeCompare(b.kind));
}
if(typeof module!=='undefined'&&module.exports){module.exports={build};return;}
const cfg=document.getElementById('reminderConfig821');if(!cfg||!legacy)return;
const endpoint='https://asia-2027-rest.cabrerafelipe2003.workers.dev/reminders845',key845='asia-reminders845-client';
const el=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt)x.textContent=txt;if(cls)x.className=cls;return x;};
let state={active:false,weight:false,rev:null,signature:'',extended:false};try{const x=JSON.parse(localStorage.getItem(key845)||'null');if(x&&typeof x.active==='boolean'&&Number.isSafeInteger(x.rev))state=x}catch{}
const box=el('details','','gymMini571');box.id='pushReminders845';box.append(el('summary','Avisos inteligentes · app cerrada'));
// V8.8.3: keep server-confirmed counts separate from the local draft.
const dashboard=el('div','','pushDashboard883');box.append(dashboard);
const hero=el('div','','pushHero883'),heading=el('small','PRÓXIMO PESAJE'),nextWeight=el('strong','Por confirmar'),until=el('small','Consultá la nube.');hero.append(heading,nextWeight,until);dashboard.append(hero);
const stats=el('div','','pushStats883');dashboard.append(stats);
function metric(title){const m=el('div','','pushMetric883'),v=el('strong','—');m.append(el('small',title),v);stats.append(m);return v;}
const weightCount=metric('Pesajes'),otherCount=metric('Otros avisos');
const totalLine=el('p','Total en nube: por confirmar','tiny');dashboard.append(totalLine);
const testLine=el('p','Última prueba: por confirmar','meta');dashboard.append(testLine);
const label=el('label','','pushWeight883'),weight=el('input');weight.type='checkbox';weight.checked=state.weight===true;label.append(weight,el('span','Incluir pesaje en la agenda'));box.append(label);
const status=el('p',state.active?'Renovación automática activada.':'Agenda sin confirmar en este dispositivo.','meta');status.setAttribute('role','status');box.append(status);
const draftNote=el('p','','tiny');box.append(draftNote);
const row=el('div','','pushActions883');box.append(row);
const buttons=[];function button(text,fn,cls){const b=el('button',text,cls||'secondary');b.type='button';b.onclick=fn;row.append(b);buttons.push(b);return b;}
const kind={weight:'Pesaje',gym:'Gym',diet:'Dieta',weekly:'Control semanal',test:'Prueba'};
const technical=el('details','','gymMini571 pushTechnical883');technical.append(el('summary','Detalle técnico'));box.append(technical);
const detail=el('div','','pushDetail883');detail.id='pushDetail882';technical.append(detail);
const weightHint880=el('p','','tiny'),preview=el('p','','tiny');technical.append(weightHint880,preview);
const history=el('details','','gymMini571 pushHistory883');history.append(el('summary','Historial de envíos'));const historyBody=el('div');history.append(historyBody);box.append(history);
const labels882={accepted:'Aceptado por Apple (no confirma recepción)',failed:'Fallido',unknown:'Resultado desconocido; no se reenvía automáticamente',expired:'Vencido sin envío',sending:'En proceso',cancelled:'Cancelado antes del envío'};
function outcome882(x){return x?`${datefmt(x.due)} · ${labels882[x.status]||'Estado no reconocido'}${x.at?' · procesado '+datefmt(x.at):''}${x.http?' · HTTP '+x.http:''}${x.diagnostic?' · '+x.diagnostic:''}`:'Sin historial disponible';}
function clearDashboard(){nextWeight.textContent='Por confirmar';until.textContent='Consultá la nube.';weightCount.textContent=otherCount.textContent='—';totalLine.textContent='Total en nube: por confirmar';testLine.textContent='Última prueba: por confirmar';}
function details882(x){detail.replaceChildren();historyBody.replaceChildren();clearDashboard();if(x.version!==882){detail.append(el('p','Worker anterior: actualizalo para ver el historial y programar el pesaje hasta marzo.','meta'));totalLine.textContent='Total en nube: '+x.count+' (sin desglose)';testLine.textContent='Historial no disponible en este Worker.';return;}
if(Number.isSafeInteger(x.weightCount)&&x.weightCount>=0&&x.weightCount<=x.count){weightCount.textContent=String(x.weightCount);otherCount.textContent=String(x.count-x.weightCount);}
nextWeight.textContent=x.nextWeight?datefmt(x.nextWeight):'Sin pesaje pendiente';until.textContent=x.until?'Agenda hasta '+dayfmt(x.until)+' · Uruguay':'Sin agenda pendiente';totalLine.textContent='Total de avisos en nube: '+x.count;
testLine.textContent='Última prueba: '+(x.lastTest?labels882[x.lastTest.status]||'Estado no reconocido':'Sin historial');
if(x.subscriptionInvalid){testLine.textContent+=' · Suscripción rechazada';detail.append(el('p','Apple rechazó la última suscripción. Revisá el permiso y volvé a suscribirte antes de programar.','meta'));}
for(const t of ['Consultado: '+datefmt(Date.now()),'Próximo aviso: '+(x.next?datefmt(x.next):'ninguno'),'Último pesaje: '+outcome882(x.lastWeight),'Última prueba: '+outcome882(x.lastTest),'Agenda hasta: '+(x.until?datefmt(x.until):'sin avisos')])detail.append(el('p',t,'tiny'));
for(const e of (Array.isArray(x.history)?x.history:[]))historyBody.append(el('p',(kind[e.kind]||'Aviso')+' · '+outcome882(e),'tiny'));
if(!historyBody.childNodes.length)historyBody.append(el('p','Todavía no hay envíos registrados.','tiny'));}
function draft(){if(blocked600||localStorage.getItem(key)!==disk600)throw Error('Recargá los datos antes de programar.');return build(data,new Date(),weight.checked,legacy,state.extended===true);}
const datefmt=t=>new Date(t).toLocaleString('es-UY',{timeZone:'America/Montevideo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const dayfmt=t=>new Date(t).toLocaleDateString('es-UY',{timeZone:'America/Montevideo',day:'2-digit',month:'2-digit',year:'numeric'});
function showDraft(){draftNote.textContent=weight.checked!==(state.weight===true)?'Cambio pendiente: pulsá Renovar agenda.':'';try{const a=draft();const w=a.find(e=>e.kind==='weight');weightHint880.textContent=w?'Próximo pesaje previsto: '+datefmt(w.due)+' (Uruguay). Programá y consultá nube para confirmar.':'Sin pesaje futuro en el borrador. Revisá el permiso, la casilla y el horario.';preview.textContent=a.length?`${a.length} avisos previstos · próximo: ${kind[a[0].kind]} · ${datefmt(a[0].due)}.`:'No hay avisos futuros en el período programable.';}catch(e){preview.textContent=e.message;}}
async function api(body){const token=localStorage.getItem('asia-rest533-token');if(!/^[a-f0-9]{64}$/i.test(token||''))throw Error('Falta la clave de avisos REST en Gym.');const c=new AbortController(),t=setTimeout(()=>c.abort(),12000);try{const r=await fetch(endpoint,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...body?{'Content-Type':'application/json'}:{}},body:body?JSON.stringify(body):undefined,cache:'no-store',redirect:'error',credentials:'omit',signal:c.signal});const x=await r.json().catch(()=>null);if(!r.ok||x?.ok!==true){const e=Error(x?.error||'HTTP '+r.status);e.http=r.status;throw e;}if(!Number.isSafeInteger(x.rev)||!Number.isInteger(x.count))throw Error('Respuesta inválida');return x;}finally{clearTimeout(t)}}
async function sub(){if(!('Notification'in window)||Notification.permission!=='granted')throw Error('Activá las notificaciones de la app instalada.');const r=await navigator.serviceWorker?.getRegistration(),s=await r?.pushManager?.getSubscription();if(!s)throw Error('No hay suscripción push activa.');return s.toJSON();}
function save(x){localStorage.setItem(key845,JSON.stringify(x));state=x;}
function describe(x){details882(x);status.textContent=x.subscriptionInvalid?'Suscripción rechazada. Revisá el permiso antes de renovar.':(state.active?'Renovación automática activada. ':'Renovación automática inactiva en este dispositivo. ')+'Nube consultada: '+datefmt(Date.now())+'.';}
let busy=false,timer;async function run(fn,automatic=false){if(busy)return;busy=true;buttons.forEach(b=>b.disabled=true);try{await fn()}catch(e){clearDashboard();detail.replaceChildren(el('p','No se pudo confirmar el estado actual en la nube.','meta'));historyBody.replaceChildren();status.textContent='Sin confirmación: '+(e.name==='AbortError'?'tiempo de espera agotado':e.message)+'. La agenda anterior puede seguir activa.';if(automatic&&e.http===409){try{save({...state,active:false})}catch{}status.textContent+=' Renovación automática pausada; reprogramá manualmente.';}}finally{busy=false;buttons.forEach(b=>b.disabled=false);showDraft()}}
button('Renovar agenda',()=>run(async()=>{draft();const subscription=await sub(),old=await api(),extended=old.version===882,events=build(data,new Date(),weight.checked,legacy,extended);if(!confirm(`¿Programar ${events.length} avisos y renovar la agenda al abrir o guardar? Se envían solo tipos y horas, no tus registros. Reemplaza la agenda previa.`))return;const x=await api({action:'replace',rev:old.rev,subscription,events});save({active:true,weight:weight.checked,rev:x.rev,signature:JSON.stringify(events),extended});describe(x);}), 'pushPrimary883');
button('Consultar nube',()=>run(async()=>describe(await api())));
button('Prueba · 20 s',()=>run(async()=>{const subscription=await sub(),old=await api();if(!confirm('¿Enviar un aviso de prueba en 20 segundos?'))return;const x=await api({action:'test',rev:old.rev,subscription});if(state.active&&state.rev===old.rev)save({...state,rev:x.rev});describe(x);}));
button('Cancelar avisos',()=>run(async()=>{if(!confirm('¿Cancelar todos los avisos inteligentes? Los avisos de descanso y el pesaje antiguo no cambian.'))return;const old=await api(),x=await api({action:'cancel',rev:old.rev});save({active:false,weight:weight.checked,rev:x.rev,signature:''});describe(x);}), 'danger pushCancel883');
button('Ver suscripción',()=>run(async()=>{await sub();status.textContent='Suscripción push activa y permiso concedido en este dispositivo. No confirma recepción.';}));row.append(row.querySelector('.pushCancel883'));technical.append(el('p','El cron de GitHub puede retrasarse. Si confirmás la agenda de pesaje y la notificación de prueba, podés desactivar el workflow antiguo para evitar duplicados.','meta'));technical.append(el('p','Usa las preferencias locales y el plan guardado. Los cambios sin internet no se reflejan hasta renovar. No se leen datos desde el servidor mientras la app está cerrada. Si cambiás de dispositivo, reprogramá desde el nuevo.','tiny'));cfg.append(box);weight.onchange=showDraft;box.addEventListener('toggle',()=>{if(box.open){showDraft();if(state.active&&navigator.onLine)run(async()=>describe(await api()));}});
function auto(){if(!state.active||document.hidden||!navigator.onLine)return;if(busy){clearTimeout(timer);timer=setTimeout(auto,3000);return;}run(async()=>{const events=build(data,new Date(),state.weight,legacy,state.extended===true);if(blocked600||localStorage.getItem(key)!==disk600)return;const signature=JSON.stringify(events);if(signature===state.signature)return;const subscription=await sub(),x=await api({action:'replace',rev:state.rev,subscription,events,...(state.extended?{renew:true}:{})});save({...state,rev:x.rev,signature});describe(x);},true);}
function queue(){clearTimeout(timer);timer=setTimeout(auto,1500)}
const prev=persist;persist=function(){const ok=prev.apply(this,arguments);if(ok)queue();return ok};window.addEventListener('online',queue);window.addEventListener('pageshow',queue);document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue()});queue();showDraft();
})();
