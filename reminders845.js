/* V8.4.5: opt-in server queue for the original reminder calendar. */
(function(){'use strict';
const legacy=typeof module!=='undefined'&&module.exports?require('./reminders821.js'):window.asiaReminders821;
const DAY=86400000;
function build(source,now,includeWeight,planner=legacy){
 if(!planner)throw Error('Calendario no disponible');const start=planner.localClock(now).day,events=[];
 for(let n=0;n<14;n++){const day=new Date(Date.parse(start)+n*DAY).toISOString().slice(0,10);const p=planner.plan(source,new Date(day+'T00:00:00-03:00'));
 for(const item of p.items){if(item.status==='registered'||(!includeWeight&&item.id==='weight'))continue;const due=Date.parse(day+'T'+item.time+':00-03:00');if(due>now.getTime()&&due<=now.getTime()+14*DAY)events.push({kind:item.id,due});}}
 return events.sort((a,b)=>a.due-b.due||a.kind.localeCompare(b.kind));
}
if(typeof module!=='undefined'&&module.exports){module.exports={build};return;}
const cfg=document.getElementById('reminderConfig821');if(!cfg||!legacy)return;
const endpoint='https://asia-2027-rest.cabrerafelipe2003.workers.dev/reminders845',key845='asia-reminders845-client';
const el=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt)x.textContent=txt;if(cls)x.className=cls;return x;};
let state={active:false,weight:false,rev:null,signature:''};try{const x=JSON.parse(localStorage.getItem(key845)||'null');if(x&&typeof x.active==='boolean'&&Number.isSafeInteger(x.rev))state=x}catch{}
const box=el('details','','gymMini571');box.id='pushReminders845';box.append(el('summary','Avisos inteligentes · app cerrada'));
const info=el('p','Programá hasta 14 días de avisos. Se renuevan al abrir la app o guardar cambios con conexión.','meta');box.append(info);
const label=el('label',''),weight=el('input');weight.type='checkbox';weight.checked=state.weight===true;label.append(weight,' Incluir pesaje (puede duplicar el aviso antiguo de las 08:00)');box.append(label);
const status=el('p',state.active?'Renovación activada en este dispositivo. Consultá la nube.':'Sin activación en este dispositivo.','meta');status.setAttribute('role','status');box.append(status);
const preview=el('p','','tiny');box.append(preview);const row=el('div','','row');row.style.flexWrap='wrap';box.append(row);
const buttons=[];function button(text,fn){const b=el('button',text,'secondary');b.type='button';b.onclick=fn;row.append(b);buttons.push(b);return b;}
const kind={weight:'Pesaje',gym:'Gym',diet:'Dieta',weekly:'Control semanal',test:'Prueba'};
function draft(){if(blocked600||localStorage.getItem(key)!==disk600)throw Error('Recargá los datos antes de programar.');return build(data,new Date(),weight.checked);}
const datefmt=t=>new Date(t).toLocaleString('es-UY',{timeZone:'America/Montevideo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
function showDraft(){try{const a=draft();preview.textContent=a.length?`${a.length} avisos previstos · próximo: ${kind[a[0].kind]} · ${datefmt(a[0].due)}.`:'No hay avisos futuros para los próximos 14 días.';}catch(e){preview.textContent=e.message;}}
async function api(body){const token=localStorage.getItem('asia-rest533-token');if(!/^[a-f0-9]{64}$/i.test(token||''))throw Error('Falta la clave de avisos REST en Gym.');const c=new AbortController(),t=setTimeout(()=>c.abort(),12000);try{const r=await fetch(endpoint,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...body?{'Content-Type':'application/json'}:{}},body:body?JSON.stringify(body):undefined,cache:'no-store',redirect:'error',signal:c.signal});const x=await r.json().catch(()=>null);if(!r.ok||x?.ok!==true){const e=Error(x?.error||'HTTP '+r.status);e.http=r.status;throw e;}if(!Number.isSafeInteger(x.rev)||!Number.isInteger(x.count))throw Error('Respuesta inválida');return x;}finally{clearTimeout(t)}}
async function sub(){if(!('Notification'in window)||Notification.permission!=='granted')throw Error('Activá las notificaciones de la app instalada.');const r=await navigator.serviceWorker?.getRegistration(),s=await r?.pushManager?.getSubscription();if(!s)throw Error('No hay suscripción push activa.');return s.toJSON();}
function save(x){localStorage.setItem(key845,JSON.stringify(x));state=x;}
function describe(x){const last=x.last,labels={accepted:'aceptado por el servicio push (no confirma recepción)',failed:'envío fallido',unknown:'entrega desconocida',expired:'vencido',sending:'en proceso'};status.textContent=`Nube: ${x.count} pendientes${x.next?' · próximo '+datefmt(x.next):''}.${last?' Último: '+(kind[last.kind]||'aviso')+' · '+(labels[last.status]||last.status)+(last.http?' (HTTP '+last.http+')':'')+'.':''}`;}
let busy=false,timer;async function run(fn,automatic=false){if(busy)return;busy=true;buttons.forEach(b=>b.disabled=true);try{await fn()}catch(e){status.textContent='Sin confirmación: '+(e.name==='AbortError'?'tiempo de espera agotado':e.message)+'. La agenda anterior puede seguir activa.';if(automatic&&e.http===409){try{save({...state,active:false})}catch{}status.textContent+=' Renovación automática pausada; reprogramá manualmente.';}}finally{busy=false;buttons.forEach(b=>b.disabled=false);showDraft()}}
button('Programar / renovar',()=>run(async()=>{const events=draft();if(!confirm(`¿Programar ${events.length} avisos y renovar la agenda al abrir o guardar? Se envían solo tipos y horas, no tus registros. Reemplaza la agenda previa.`))return;const subscription=await sub(),old=await api(),x=await api({action:'replace',rev:old.rev,subscription,events});save({active:true,weight:weight.checked,rev:x.rev,signature:JSON.stringify(events)});describe(x);}));
button('Consultar nube',()=>run(async()=>describe(await api())));
button('Prueba 20 s',()=>run(async()=>{const subscription=await sub(),old=await api();if(!confirm('¿Enviar un aviso de prueba en 20 segundos?'))return;const x=await api({action:'test',rev:old.rev,subscription});if(state.active&&state.rev===old.rev)save({...state,rev:x.rev});describe(x);}));
button('Cancelar avisos',()=>run(async()=>{if(!confirm('¿Cancelar todos los avisos inteligentes? Los avisos de descanso y el pesaje antiguo no cambian.'))return;const old=await api(),x=await api({action:'cancel',rev:old.rev});save({active:false,weight:weight.checked,rev:x.rev,signature:''});describe(x);}));
box.append(el('p','Usa las preferencias locales y el plan guardado. Los cambios sin internet no se reflejan hasta renovar. No se leen datos desde el servidor mientras la app está cerrada. Si cambiás de dispositivo, reprogramá desde el nuevo.','tiny'));cfg.append(box);weight.onchange=showDraft;box.addEventListener('toggle',()=>{if(box.open)showDraft()});
function auto(){if(!state.active||document.hidden||!navigator.onLine)return;if(busy){clearTimeout(timer);timer=setTimeout(auto,3000);return;}run(async()=>{const events=build(data,new Date(),state.weight);if(blocked600||localStorage.getItem(key)!==disk600)return;const signature=JSON.stringify(events);if(signature===state.signature)return;const subscription=await sub(),x=await api({action:'replace',rev:state.rev,subscription,events});save({...state,rev:x.rev,signature});describe(x);},true);}
function queue(){clearTimeout(timer);timer=setTimeout(auto,1500)}
const prev=persist;persist=function(){const ok=prev.apply(this,arguments);if(ok)queue();return ok};window.addEventListener('online',queue);window.addEventListener('pageshow',queue);document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue()});queue();showDraft();
})();
