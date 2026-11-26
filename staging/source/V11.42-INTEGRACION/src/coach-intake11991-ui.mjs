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
 function localParameters(parent,g){
  const details=n('details');details.append(n('summary','Datos de planificación ya confirmados (opcional)'),n('p','Completá solo datos explícitos. Quedan en este dispositivo, no se envían a la IA. La meta se puede copiar sin añadir entrenamiento ni nutrición.'));
  parent.append(details);
  const field=(box,id,label,type,values=[])=>{const x=n(type==='select'?'select':'input');x.id='ci11992-'+id;if(type==='select'){x.add(new Option('Elegí',''));for(const v of values)x.add(new Option(v,v))}else x.type=type;const l=n('label',label);l.htmlFor=x.id;box.append(l,x);return x};
  const f=(...a)=>field(details,...a),dateOn=f('dates','Copiar fechas confirmadas','checkbox'),start=f('start','Inicio','date'),end=f('end','Fin del bloque','date'),deadline=f('deadline','Fecha objetivo opcional','date');
  const S=window.asiaSchedule829,R=window.asiaRunning1174,N=window.asiaNutrition103,E=window.asiaExtras830;
  const sBox=n('details');sBox.append(n('summary','Fuerza'));details.append(sBox);
  const sf=(...a)=>field(sBox,...a),sOn=sf('strength','Copiar datos de fuerza','checkbox'),objective=sf('objective','Objetivo','select',S.objectives),equipment=sf('equipment','Equipo disponible','select',S.equipment),sMinutes=sf('sMinutes','Minutos por sesión','number');
  const names=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],pick=(box,p)=>names.map((label,i)=>field(box,p+i,label,'checkbox')),sDays=pick(sBox,'sDay');
  const rBox=n('details');rBox.append(n('summary','Running'));details.append(rBox);rBox.hidden=g.kind!=='Running';
  const rf=(...a)=>field(rBox,...a),rOn=rf('running','Copiar datos de Running','checkbox'),distance=rf('distance','Distancia objetivo (km; 0 sin distancia)','number'),targetTime=rf('targetTime','Tiempo objetivo (min, opcional)','number'),weekly=rf('weekly','Minutos semanales recientes','number'),longest=rf('longest','Rodaje reciente más largo (min)','number'),level=rf('level','Experiencia','select',R.levels),surface=rf('surface','Modalidad','select',R.modes),minutes=rf('minutes','Minutos disponibles','number'),symptoms=rf('symptoms','Síntomas preocupantes','select',['Sin síntomas preocupantes','Sí / no estoy seguro']),rDays=pick(rBox,'rDay');
  const nBox=n('details');nBox.append(n('summary','Nutrición'),n('p','Solo valores propios ya revisados; se copiarán para guardar sin aplicar, tras una nueva revisión manual.'));details.append(nBox);
  const nf=(...a)=>field(nBox,...a),nOn=nf('nutrition','Copiar valores nutricionales confirmados','checkbox'),kind=nf('nutKind','Objetivo nutricional','select',E.nutritionKinds103),calories=nf('calories','kcal','number'),protein=nf('protein','Proteína (g)','number'),fat=nf('fat','Grasas (g)','number'),shares=['Desayuno','Almuerzo','Merienda','Cena'].map((label,i)=>nf('share'+i,label+' (%)','number'));
  const num=x=>x.value===''?NaN:Number(x.value),days=x=>x.flatMap((v,i)=>v.checked?[i]:[]);
  return ()=>window.asiaIntakeParams11992.validate(g,{
   dates:dateOn.checked?{start:start.value,end:end.value,deadline:deadline.value}:null,
   strength:sOn.checked?{objective:objective.value,equipment:equipment.value,minutes:num(sMinutes),days:days(sDays)}:null,
   running:rOn.checked?{distanceM:Math.round(num(distance)*1000),targetSeconds:targetTime.value===''?null:Math.round(num(targetTime)*60),weeklyMinutes:num(weekly),longestMinutes:num(longest),level:level.value,surface:surface.value,minutes:num(minutes),days:days(rDays),symptoms:symptoms.value}:null,
   nutrition:nOn.checked?{kind:kind.value,calories:num(calories),protein:num(protein),fat:num(fat),shares:shares.map(num)}:null
  },date(),{kinds:E.goalKinds101,objectives:S.objectives,equipment:S.equipment,levels:R.levels,surfaces:R.modes,nutritionKinds:E.nutritionKinds103,previewNutrition:N.preview}).parameters;
 }
 function draw(v){displayed=v;output.replaceChildren();if(v.phase==='consent'){
  output.append(n('h3','Revisá el contexto exacto de prueba'));const pre=n('pre',JSON.stringify(v.payload,null,2));pre.style.whiteSpace='pre-wrap';pre.style.overflowWrap='anywhere';output.append(pre);
  const consent=n('input');consent.type='checkbox';consent.id='ci11991-consent';const l=n('label','Confirmo este contexto de prueba');l.htmlFor=consent.id;output.append(consent,l);
  const reviewed=v;btn(output,'Sample','Probar respuesta fija local',async()=>{const answer=await c.send(reviewed,consent.checked,'synthetic');if(!panel.open){c.discard();draw(c.view());return}draw(answer)});
 }else if(v.phase==='answer'){
  const reviewed=v;output.append(n('p','Respuesta fija de prueba · sin IA'),n('p',v.reply.answer));
  if(v.reply.kind==='clarify'){const inputs=v.reply.questions.map((q,i)=>{const x=n('input');x.type='text';x.maxLength=500;x.id='ci11991-answer-'+i;const l=n('label',q.question);l.htmlFor=x.id;output.append(l,x);return x});btn(output,'Continue','Revisar siguiente turno',()=>draw(c.advance(reviewed,inputs.map(x=>x.value.trim()))))}
  else if(v.reply.kind==='goal'){const g=v.reply.goal;output.append(n('h3','Meta de prueba editable'),n('p',g.title+' · '+g.kind+' · '+g.target));const read=localParameters(output,g);btn(output,'Transfer','Copiar al formulario manual',()=>{const parameters=read();if(!confirm('¿Copiar la meta ficticia y los datos explícitos seleccionados al formulario? Reemplaza el borrador previo. No guarda ni aplica datos.'))return;const goal=c.takeGoal(reviewed,true);bridge.loadGoal(goal,parameters);draw(c.view());status.textContent='Meta copiada al borrador. Todavía no se guardó.';})}
 }}
 panel.append(label,question);btn(panel,'Prepare','Revisar consulta de prueba',()=>draw(c.prepare(question.value.trim())));btn(panel,'Discard','Descartar conversación',()=>{c.discard();draw(c.view());question.value='';status.textContent='Conversación descartada. Sin cambios.'});panel.append(output,status);
 function visibility(){panel.hidden=anchor.hidden;if(panel.hidden){c.discard();draw(c.view());question.value=''}}
 panel.addEventListener('toggle',()=>{if(!panel.open){c.discard();draw(c.view());question.value=''}});question.addEventListener('input',()=>{c.discard();draw(c.view())});
 const prior=refresh;refresh=function(){const v=prior.apply(this,arguments);visibility();return v};visibility();
}
