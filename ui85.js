/* V9.4 — cross-app task navigation and presentation. Reuse original controls and preferences. */
(()=>{'use strict';
const specs=[['home','home42','layout51','tabHome'],['diet','diet','layout541-diet','tabDiet'],['training','training','layout541-training','tabTrain'],['health','health','layout541-health','tabHealth'],['progress','progress54','layout541-progress54','tabProgress54']];
const by=id=>document.getElementById(id);
function button(label,action){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;b.addEventListener('click',action);return b;}
const tasks=[
 ['homeWater902','Agua registrada hoy','hidratación total vaso'],
 ['homeNext902','Próxima sesión prevista','entrenamiento plan calendario'],

 ['adaptive896','Adaptar entrenamiento','tiempo 30 45 60 minutos fatiga alternativa reducir series'],
 ['weeklyReview896','Revisión semanal con el Coach','reunión objetivos control lunes reflexión'],
 ['cardio896','Evolución cardiovascular','vo2 frecuencia cardíaca reposo vfc ejercicio aeróbico'],
 ['milestones896','Mis hitos y medidas corporales','logros perímetros cintura cadera brazo pecho muslo'],
 ['overlay896','Superposición de fotografías','alineación opacidad comparar fotos'],
 ['checkin89','Check-in diario','energía hambre descanso estrés molestias ánimo bienestar'],
 ['coachDaily89','Check-in y estrategia de hoy','coach proactivo consejo diario recomendaciones'],
 ['day','Registrar comida','comer alimentos calorias proteínas desayuno almuerzo merienda cena dieta'],
 ['voiceMode891','Registrar comida por voz','dictar micrófono narrar transcribir almorcé describir alimentos'],
 ['mealComposer8810','Añadir alimentos','porciones plato morron pollo cantidad comida'],
 ['compose92','Componer comida con alimentos disponibles','cantidades sugeridas porciones combinación macros'],
 ['barcode92','Código de barras','ean upc gtin producto etiqueta favorito'],
 ['recipeWeight92','Receta por peso cocido','rendimiento gramos cien gramos plato'],
 ['historyMeal903','Frecuentes y repetir comida','historial porción anterior copiar desayuno almuerzo merienda cena repetir'],
 ['memory55','Memoria del Coach y estrategias','recuerdos aprendizaje hipótesis decisiones seguimiento resultados'],
 ['voiceFast901','Describir comida con IA','texto descripción dictado ingredientes estimar macros'],
 ['healthOverview905','Bienestar y recuperación','salud sueño energía descanso indicadores fecha'],
 ['healthRecovery855','Tendencias de recuperación','comparación vfc frecuencia reposo sueño'],
 ['progressOverview905','Evolución corporal','peso composición media móvil grasa cintura tendencia'],
 ['photoTimeline905','Historial visual de fotografías','fotos fechas comparación anterior'],
 ['photoFast901','Escanear comida o etiqueta','foto cámara codigo barras nutrición ia calorías'],
 ['toolsMode901','Crear un alimento con IA','ingrediente huevo frito biblioteca alimento nuevo'],
 ['nutSearch817','Buscar en biblioteca','favoritos recetas alimento guardado'],
 ['waterDate52','Registrar agua','hidratacion beber ml vaso'],
 ['measureDay','Registrar peso y composición','pesaje balanza xiaomi grasa muscular captura'],
 ['recoveryDay43','Recuperación diaria','sueño fatiga descanso energía'],
 ['gymPerformance93','Rendimiento y récords','1rm fatiga fuerza duración cargas gimnasio'],
 ['gymPro53','Abrir entrenamiento','rutina entreno hoy sesión series pesas'],
 ['plannerDay820','Planificador semanal','calendario reprogramar cambiar día entreno'],
 ['gymTemplates826','Personalizar rutinas','crear ejercicios editar gimnasio'],
 ['exercisePick','Analizar fuerza','progresión pesos cargas marcas'],
 ['healthRefresh','Actualizar Apple Salud','reloj watch sincronizar pasos datos'],
 ['healthMetric','Histórico de actividad','frecuencia cardíaca vfc sueño gráficos pasos'],
 ['coachQuestion50','Conversar con el Coach','preguntar inteligencia artificial asesoramiento chat entrenador ia'],
 ['reportPeriod818','Informe de evolución','revisión semanal controles progreso exportar csv'],
 ['weeklyV4','Informe semanal de dieta','control lunes pdf nutrición'],
 ['before54','Comparar fotos de evolución','imagen antes después cuerpo'],
 ['pushReminders845','Avisos inteligentes','notificaciones push pesar recordatorio alarma'],
 ['backup844','Respaldo integral cifrado','copia seguridad recuperar restaurar datos nube'],
 ['diagnostics56','Sincronización y diagnóstico','ver versión cache offline error actualizar'],
 ['aiToken','Conexión con IA','token clave cloudflare configuración permisos privacidad'],
 ['aiChatResult','Historial del entrenador anterior','mi entrenador ia chat clásico conversaciones antiguas']
];
const norm=x=>String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function cardVisible(n){return !!n&&!n.hidden&&!n.matches('.hide,.hiddenPanel51,.personalHidden822,.personalEmpty822,.layout51');}
function cardTitle(n){return (n.querySelector(':scope > summary, .foldHeader51 .foldToggle51, :scope > h2, :scope > .row h2')?.textContent||'').trim();}
function matchScore(x,q){const title=norm(x.title),section=norm(x.section),terms=norm(x.keywords||''),words=q.split(/\s+/);if(!words.every(w=>(title+' '+section+' '+terms).includes(w)))return -1;return (title===q?100:title.startsWith(q)?45:title.includes(q)?25:0)+words.reduce((n,w)=>n+(title.includes(w)?5:0),0)+(x.task?3:0);}
function scrollMode(){return matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';}
const resetSearch=[];
for(const [key,id,oid] of specs){
 const root=by(id),organizer=by(oid);if(!root||!organizer)continue;
 const tools=document.createElement('div');tools.className='viewTools85';tools.setAttribute('role','group');tools.setAttribute('aria-label','Vista de esta sección');
 const personalize=button('⚙ Personalizar',()=>{organizer.open=!organizer.open;update();});
 personalize.setAttribute('aria-controls',oid);
 const reset=button('Plegar al inicio',()=>{window.asiaInitialView85?.(key);update();window.scrollTo(0,0);});reset.title='Abre solo el primer apartado visible, sin cambiar el orden';
 function update(){personalize.setAttribute('aria-expanded',String(organizer.open));personalize.textContent=organizer.open?'Cerrar personalización':'⚙ Personalizar';if(!organizer.open&&organizer.contains(document.activeElement)&&!root.classList.contains('hide'))personalize.focus({preventScroll:true});}
 // Move the original organizer, not its contents. No extra editor or storage keys.
 organizer.classList.add('inlineOrganizer863');const search=document.createElement('input');search.type='search';search.className='sectionSearch889';search.placeholder='Buscar apartado';search.setAttribute('aria-label','Buscar apartado en la aplicación');const results=document.createElement('div');results.className='searchResults889';results.hidden=true;results.setAttribute('aria-label','Resultados de búsqueda');
 function candidates(){const out=[],cards=new Map();for(const [t,rid,,nav] of specs){const rr=by(rid);if(!rr)continue;for(const target of rr.querySelectorAll(':scope > .card')){if(!cardVisible(target))continue;const title=cardTitle(target);if(title){const x={t,target,title,section:by(nav)?.textContent.trim()||t};out.push(x);cards.set(target,x);}}}for(const target of document.querySelectorAll('main > .card, main > details.sectionfold')){if(!cardVisible(target))continue;const title=cardTitle(target);if(title){const x={t:key,target,title,section:'General'};out.push(x);cards.set(target,x);}}
 for(const [anchor,title,keywords] of tasks){const node=by(anchor);if(!node)continue;let owner=null;for(let n=node;n;n=n.parentElement){if(cards.has(n)){owner=cards.get(n);break;}}if(!owner||node.closest('[hidden],.hiddenPanel51,.personalHidden822,.personalEmpty822'))continue;out.push({...owner,title,keywords,anchor:node,task:true});}return out;}
 function clear(){search.value='';results.replaceChildren();results.hidden=true;search.setAttribute('aria-expanded','false');}
 resetSearch.push(clear);
 function go(x){if(!x.target.isConnected||!cardVisible(x.target)||x.anchor&&(!x.anchor.isConnected||!x.target.contains(x.anchor)||x.anchor.closest('[hidden],.hiddenPanel51,.personalHidden822,.personalEmpty822'))){clear();notify('El apartado ya no está disponible en esta vista. Revisá Personalizar o buscá nuevamente.');return;}search.blur();clear();tab(x.t);window.asiaRevealPanel541?.(x.target);if(x.target.tagName==='DETAILS')x.target.open=true;const target=x.anchor&&x.target.contains(x.anchor)?x.anchor:x.target;if(target.id==='voiceMode891')window.asiaOpenVoice891?.();if(target.id==='toolsMode901')target.click();for(let n=target;n&&n!==x.target;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;const focusTarget=target.matches('input,select,textarea,button')?target:target.querySelector(':scope > summary,.foldToggle51');requestAnimationFrame(()=>{target.scrollIntoView({block:'start',behavior:scrollMode()});if(focusTarget&&focusTarget.matches('summary,button'))focusTarget.focus({preventScroll:true});});}
 function query(showDefaults=false){const q=norm(search.value);results.replaceChildren();results.hidden=!q&&!showDefaults;search.setAttribute('aria-expanded',String(!results.hidden));if(results.hidden)return;const all=candidates();const matches=q?all.map(x=>({x,score:matchScore(x,q)})).filter(o=>o.score>=0).sort((a,b)=>b.score-a.score).map(o=>o.x):all.filter(x=>x.task&&x.t===key).slice(0,6);const note=document.createElement('p');note.className='tiny searchNote8811';note.textContent=q?(matches.length?`${matches.length} coincidencias`:'Sin coincidencias visibles. Revisá Personalizar si el apartado está oculto.'):'Acciones frecuentes de esta pestaña';note.setAttribute('role','status');results.append(note);for(const x of matches.slice(0,15)){const b=button('',()=>go(x));const title=document.createElement('strong'),sub=document.createElement('span');title.textContent=x.title;sub.textContent=x.section+(x.task?' · acceso directo':' · apartado');b.append(title,sub);results.append(b);}if(matches.length>15){const n=document.createElement('p');n.className='tiny';n.textContent='Escribí algo más específico para ver otros resultados.';results.append(n);}if(!matches.length&&!q)note.textContent='Escribí una tarea, como agua, pesaje o rutina.';}
 search.id='sectionSearch8811-'+key;results.id='sectionResults8811-'+key;search.setAttribute('aria-controls',results.id);search.setAttribute('aria-expanded','false');search.placeholder='Buscar una tarea o apartado';
 search.addEventListener('focus',()=>query(true));search.addEventListener('input',()=>query(true));search.addEventListener('keydown',e=>{if(e.key==='Escape'){clear();search.blur();}else if(e.key==='Enter'){const first=results.querySelector('button');if(first){e.preventDefault();first.click();}}else if(e.key==='ArrowDown'){const first=results.querySelector('button');if(first){e.preventDefault();first.focus();}}});results.addEventListener('keydown',e=>{if(e.key==='Escape'){search.focus();clear();}else if(['ArrowDown','ArrowUp'].includes(e.key)){const bs=[...results.querySelectorAll('button')],i=bs.indexOf(document.activeElement),j=i+(e.key==='ArrowDown'?1:-1);e.preventDefault();if(j<0)search.focus();else bs[Math.min(j,bs.length-1)]?.focus();}});document.addEventListener('pointerdown',e=>{if(!tools.contains(e.target)&&!results.hidden)clear();});
 tools.append(personalize,reset,search,results);root.prepend(tools,organizer);
 const look=document.createElement('details');look.className='appearance8812';const title=document.createElement('summary');title.textContent='Apariencia · colores y modo';const paletteLabel=document.createElement('label');paletteLabel.htmlFor='palette8812-'+key;paletteLabel.textContent='Paleta de colores';const palette=document.createElement('select');palette.id=paletteLabel.htmlFor;for(const [value,label] of [['original','Asia · azul y dorado'],['ocean','Océano · azul y celeste'],['forest','Bosque · verde y menta'],['graphite','Grafito · gris y lavanda']])palette.add(new Option(label,value));const modeLabel=document.createElement('label');modeLabel.htmlFor='mode8812-'+key;modeLabel.textContent='Modo de pantalla';const mode=document.createElement('select');mode.id=modeLabel.htmlFor;mode.add(new Option('Oscuro','dark'));mode.add(new Option('Claro','light'));const preview=document.createElement('div');preview.className='palettePreview8812';preview.setAttribute('aria-hidden','true');for(const cls of ['bg','panel','accent']){const swatch=document.createElement('span');swatch.className=cls;preview.append(swatch);}const status=document.createElement('p');status.className='tiny';status.setAttribute('role','status');const hint=document.createElement('p');hint.className='tiny';hint.textContent='La apariencia se aplica a toda la app y se guarda en las preferencias.';function syncLook(){const v=window.asiaTheme8812?.get();if(v){palette.value=v.palette;mode.value=v.light?'light':'dark';}}function applyLook(){const ok=window.asiaTheme8812?.set(palette.value,mode.value==='light');status.textContent=ok?'Apariencia guardada.':'No se pudo guardar; cambio temporal.';}palette.addEventListener('change',applyLook);mode.addEventListener('change',applyLook);window.addEventListener('asiaTheme8812',syncLook);look.append(title,paletteLabel,palette,modeLabel,mode,preview,hint,status);const before=organizer.querySelector('.singleFold8812');if(before)before.before(look);else organizer.append(look);syncLook();
 organizer.addEventListener('toggle',update);update();
}
function active(){for(const [,id,,nav] of specs){const b=by(nav),root=by(id);if(!b||!root)continue;if(!root.classList.contains('hide'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}}
const previous=tab;tab=function(t){for(const clear of resetSearch)clear();previous(t);active();if(t==='health')window.asiaHealthOverview905?.();};active();
// Make existing buttons self-explanatory without replacing nodes or their listeners.
const labels={homeLog42:'Registrar comida',homeRefresh42:'Actualizar Salud',healthRefresh:'Actualizar Salud',healthSetup:'Configurar conexión',healthStepsCopy:'Sincronizar pasos ahora',backupNow42:'Guardar copia clásica',backupList42:'Ver copias guardadas',backupDownload42:'Descargar copia elegida',backupRestore42:'Restaurar copia elegida',aiDisconnect:'Olvidar clave del dispositivo',aiClearChat:'Borrar chat clásico',gymOther53:'Retomar sesión pendiente',gymFinish53:'Guardar y finalizar sesión',saveWorkout:'Guardar sesión',export818:'Exportar informe CSV',nutReturn8810:'Volver al diario'};
for(const [id,label] of Object.entries(labels)){const n=by(id);if(n&&n.tagName==='BUTTON'&&!n.querySelector('svg'))n.textContent=label;}
// Group only static instructions, never consent, status, input, or medical warnings.
const routineInfo=by('routineInfo');const routineHelp=routineInfo?.nextElementSibling;if(routineHelp?.tagName==='P'&&routineHelp.classList.contains('tiny')&&routineHelp.textContent.includes('Registrá el peso con el mismo criterio')){const d=document.createElement('details'),summary=document.createElement('summary');d.className='context57 guidance8811';summary.textContent='Cómo registrar cargas y RIR';routineHelp.before(d);d.append(summary,routineHelp);}
// Only apply layout to known action groups. Original IDs, button states and handlers stay intact.
for(const ids of [['healthRefresh','healthSetup'],['aiConnect','aiDisconnect'],['backupNow42','backupList42','backupDownload42','backupRestore42'],['gymPrev53','gymNext53'],['nutLoadMeal52','nutLoadLabel52'],['nutAdd817','nutAdd52','nutFavorite52'],['gymBegin53','gymOther53']]){const nodes=ids.map(by).filter(Boolean);if(nodes.length>1&&nodes.every(n=>n.parentElement===nodes[0].parentElement)&&[...nodes[0].parentElement.children].every(n=>n.tagName==='BUTTON'))nodes[0].parentElement.classList.add('actionRow8811');}
// Associate existing adjacent labels with their actual fields for tap and screen-reader navigation.
for(const label of document.querySelectorAll('main label:not([for])')){const field=label.nextElementSibling;if(!label.querySelector('input,select,textarea')&&field?.matches('input[id],select[id],textarea[id]')&&field.type!=='hidden'&&!field.labels?.length)label.htmlFor=field.id;}
const work901=by('workV4'),bar901=by('gymPro53'),timer901=by('timerBlock');if(work901&&bar901&&timer901){const legacy=document.createElement('details');legacy.id='gymClassic901';legacy.className='gymMini571';const title=document.createElement('summary');title.textContent='Cronómetro clásico (opcional)';timer901.before(legacy);legacy.append(title,timer901);legacy.open=!!window.asiaClassicRunning532?.();const info=by('routineInfo');if(info)info.after(bar901);}
const priorRefresh905=refresh;refresh=function(){const out=priorRefresh905();if(!by('health')?.classList.contains('hide'))window.asiaHealthOverview905?.();return out;};
const nav=document.querySelector('nav');if(nav)nav.setAttribute('aria-label','Secciones principales');
})();
