import {createIntakeFlow11991} from './coach-intake-flow11991.mjs';
const el=id=>document.getElementById(id),n=(tag,t)=>{const x=document.createElement(tag);if(t!==undefined)x.textContent=t;return x},anchor=el('onboard1176'),bridge=window.asiaOnboardDraft11991;
if(anchor&&bridge){
 // Synthetic pilot explicitly has no real provider. Do not create a transport or issue a request.
 const state=()=>({ready:!anchor.hidden&&!blocked600&&localStorage.getItem(key)===disk600&&JSON.stringify(data)===disk600&&window.asiaGym84Ready===true&&window.asiaGym84Active!==true&&!window.asiaGymHasSession532?.()&&!window.asiaClassicRunning532?.(),stamp:JSON.stringify([disk600,date()])});
 const c=createIntakeFlow11991({getState:state,allowSynthetic:true,transport:null}),panel=n('details');panel.id='coachIntake11991';panel.className='card sectionfold';anchor.before(panel);panel.append(n('summary','Conversar sobre una meta · prueba local'),n('p','Proveedor real no habilitado. Este recorrido usa preguntas y una meta fijas de prueba, no interpreta tu texto. No ingreses datos personales. Nada se guarda automáticamente.'));
 const question=n('textarea');question.id='ci11991-question';question.maxLength=1200;const label=n('label','¿Qué te gustaría conseguir? (ejemplo ficticio)');label.htmlFor=question.id;
 const status=n('p');status.id='coachIntakeStatus11991';status.setAttribute('role','status');const output=n('div');output.id='coachIntakeOutput11991';
 let displayed=c.view(),busy=false;
 function run(fn){if(busy)return;busy=true;panel.setAttribute('aria-busy','true');status.textContent='';try{const result=fn();if(result&&typeof result.then==='function')return Promise.resolve(result).catch(fail).finally(finish);finish()}catch(e){fail(e);finish()}}
 function finish(){busy=false;panel.setAttribute('aria-busy','false')}
 function fail(e){status.textContent=e.message||'No se completó';draw(c.view())}
 function btn(parent,id,t,fn){const b=n('button',t);b.id='coachIntake'+id+'11991';b.type='button';b.onclick=()=>run(fn);parent.append(b);return b}
 function draw(v){displayed=v;output.replaceChildren();if(v.phase==='consent'){
  output.append(n('h3','Revisá el contexto exacto de prueba'));const pre=n('pre',JSON.stringify(v.payload,null,2));pre.style.whiteSpace='pre-wrap';pre.style.overflowWrap='anywhere';output.append(pre);
  const consent=n('input');consent.type='checkbox';consent.id='ci11991-consent';const l=n('label','Confirmo este contexto de prueba');l.htmlFor=consent.id;output.append(consent,l);
  const reviewed=v;btn(output,'Sample','Probar respuesta fija local',async()=>{const answer=await c.send(reviewed,consent.checked,'synthetic');if(!panel.open){c.discard();draw(c.view());return}draw(answer)});
 }else if(v.phase==='answer'){
  const reviewed=v;output.append(n('p','Respuesta fija de prueba · sin IA'),n('p',v.reply.answer));
  if(v.reply.kind==='clarify'){const inputs=v.reply.questions.map((q,i)=>{const x=n('input');x.type='text';x.maxLength=500;x.id='ci11991-answer-'+i;const l=n('label',q.question);l.htmlFor=x.id;output.append(l,x);return x});btn(output,'Continue','Revisar siguiente turno',()=>draw(c.advance(reviewed,inputs.map(x=>x.value.trim()))))}
  else if(v.reply.kind==='goal'){const g=v.reply.goal;output.append(n('h3','Meta de prueba editable'),n('p',g.title+' · '+g.kind+' · '+g.target));btn(output,'Transfer','Copiar al formulario manual',()=>{if(!confirm('¿Copiar la meta ficticia al formulario? Reemplaza los campos de meta del borrador manual y desactiva sus acciones de planificación; no guarda datos.'))return;const goal=c.takeGoal(reviewed,true);bridge.loadGoal(goal);draw(c.view());status.textContent='Meta copiada al borrador. Todavía no se guardó.';})}
 }}
 panel.append(label,question);btn(panel,'Prepare','Revisar consulta de prueba',()=>draw(c.prepare(question.value.trim())));btn(panel,'Discard','Descartar conversación',()=>{c.discard();draw(c.view());question.value='';status.textContent='Conversación descartada. Sin cambios.'});panel.append(output,status);
 function visibility(){panel.hidden=anchor.hidden;if(panel.hidden){c.discard();draw(c.view());question.value=''}}
 panel.addEventListener('toggle',()=>{if(!panel.open){c.discard();draw(c.view());question.value=''}});question.addEventListener('input',()=>{c.discard();draw(c.view())});
 const prior=refresh;refresh=function(){const v=prior.apply(this,arguments);visibility();return v};visibility();
}
