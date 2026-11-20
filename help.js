/* V5.1 — presentation only. Move static guidance, never form fields/status/results. */
(()=>{'use strict';
const byId=id=>document.getElementById(id);
const home=byId('home42'), coach=byId('coach50'), vacation=byId('vacation44'), badges=byId('badges44');
// Existing nodes retain all listeners and state. Keep backup last among dashboard cards.
const backup=byId('backupNow42')?.closest('.card');
if(home&&coach&&vacation&&badges){home.append(vacation,badges,coach);if(backup&&backup.parentElement===home)home.append(backup);badges.open=false;}
const main=document.querySelector('main');if(!main)return;
const help=document.createElement('details');help.className='card sectionfold help502';help.id='help502';
const summary=document.createElement('summary');summary.textContent='Ayuda y guía de uso';help.append(summary);
const intro=document.createElement('p');intro.className='meta';intro.textContent='Consultá cómo se calculan los indicadores y cómo usar cada función.';help.append(intro);
const groups={};
function group(name){if(!groups[name]){const d=document.createElement('details'),s=document.createElement('summary');s.textContent=name;d.append(s);groups[name]=d;help.append(d);}return groups[name];}
// Exact prefixes of static guidance; preserve original paragraphs and links intact.
// Short essential information remains beside the relevant action or metric.
const rules=[
 ['Referencia original: 72 kg','Inicio y objetivos','Programa original: 72 kg · aspiracional: 70 kg.'],
 ['Tendencia lineal de hasta 42 días','Inicio y objetivos','Proyección orientativa, no garantía.'],
 ['Gasto = energía activa + en reposo','Inicio y objetivos','Gasto estimado; no suma entrenamientos dos veces.'],
 ['Se basan en registros desde el inicio','Inicio y objetivos',''],
 ['Los avisos push se gestionan en GitHub','Inicio y objetivos',''],
 ['2.000 kcal estimadas y 150 g','Dieta y sustituciones','Porciones cocidas · menú inicial de referencia.'],
 ['Ingresá lo que realmente comiste','Dieta y sustituciones','Registrá consumo real, no metas.'],
 ['Equivalencias orientativas por porción','Dieta y sustituciones','Pesos cocidos o listos para comer; sin aceite agregado.'],
 ['Igualar un nutriente no iguala','Dieta y sustituciones','Guardar una alternativa no registra consumo.'],
 ['Referencias genéricas redondeadas de','Dieta y sustituciones','Valores aproximados.'],
 ['Adjuntá una captura y usá Escanear','Peso, composición y fotos','Solo peso obligatorio · carga manual o escaneo.'],
 ['Pesate a las 08:00','Peso, composición y fotos','Bioimpedancia: estimación sensible a la hidratación.'],
 ['Elegí dos mediciones reales','Peso, composición y fotos','Diferencias estimadas, no clínicas.'],
 ['Fotos privadas en este dispositivo','Peso, composición y fotos','Fotos locales privadas; no se envían a IA.'],
 ['Cumplido · parcial · no seguido','Dieta y sustituciones','Tocá un día para abrirlo.'],
 ['Series efectivas · 1–3 RIR','Gym y recuperación','1–3 RIR · 5–10 min de calentamiento.'],
 ['Analiza tus sesiones guardadas','Gym y recuperación',''],
 ['Verde = al menos una serie','Gym y recuperación','Tocá un día para abrir la rutina.'],
 ['Los relojes se actualizan al volver','Gym y recuperación','Aviso local: app abierta. Apple Watch: conexión a internet y avisos activados.'],
 ['Series completadas asignadas','Gym y recuperación','Series por grupo principal; no mide activación.'],
 ['Orientación personal, no aptitud','Gym y recuperación','Índice orientativo, no médico · sueño manual.'],
 ['Datos diarios recibidos desde','Apple Salud','Actualizar lee los datos disponibles; no fuerza la exportación.'],
 ['Los pasos manuales, el sueño','Apple Salud','Solo copia pasos; no altera sueño ni peso.'],
 ['Sesiones importadas desde Health Auto Export','Apple Salud','No duplica calorías ni crea series de Gym.'],
 ['Entrenador integral · cálculos locales','IA y privacidad','Los cambios requieren tu aprobación.'],
 ['Se envían resúmenes numéricos','IA y privacidad','Cloudflare/OpenAI: resúmenes y chat reciente, uso compartido posible. Evitá identificadores.'],
 ['La IA es orientación, no diagnóstico','IA y privacidad','No es diagnóstico. Chat local; los cambios requieren tu aprobación.'],
 ['Consultá sobre tu progreso, entrenamiento','IA y privacidad','Envía un resumen y chat reciente a OpenAI.'],
 ['La lectura de Salud consulta Cloudflare','IA y privacidad','IA: envía datos a Cloudflare/OpenAI; uso compartido habilitado. No guardes claves en dispositivos ajenos.'],
 ['Seleccioná el lunes de control','Informes y copias','Control: 7 días anteriores.'],
 ['Opcional. Guarda hasta 10 versiones','Informes y copias','Hasta 10 versiones de registros de texto; sin fotos, chat ni claves.'],
 ['Restaurar reemplaza los registros','Informes y copias','Restaurar reemplaza registros. Exportá antes un JSON completo.'],
 ['Guardado local en este navegador','Informes y copias','Datos locales: exportá un JSON antes de borrar datos del navegador.'],
 ['Cuando iOS pida permiso','Informes y copias','Guardá la suscripción como secreto, nunca en GitHub público.'],
 ['Vacaciones 26/12–07/01','Inicio y objetivos','']
];
const paras=[...main.querySelectorAll('p.meta,p.tiny')].filter(p=>!p.id&&!p.hasAttribute('role')&&!p.closest('#reportContent'));
for(const [prefix,topic,short] of rules){const p=paras.find(x=>x.textContent.trim().startsWith(prefix));if(!p)continue;const parent=p.parentNode;if(!parent)continue;if(short){const compact=document.createElement('p');compact.className=p.className+' compact502';compact.textContent=short;parent.insertBefore(compact,p);}group(topic).append(p);}
const appearance=group('Apariencia');
const themeButton=byId('themeV4');if(themeButton)appearance.append(themeButton);
main.append(help);
})();

/* V5.7.0: contextual disclosures for static guidance added after the original help module. */
document.addEventListener('DOMContentLoaded',()=>{
 const rules=[
 ['Guardá preferencias y decisiones que quieras recordar.','Memoria local; solo se comparte con permiso. Salud requiere su propio permiso. No guardes claves ni identificadores.','Privacidad de la memoria'],
 ['El resumen mensual y las decisiones se recalculan','Los recuerdos y el historial se gestionan por separado.','Cómo funciona la memoria'],
 ['Usá la misma vista, distancia, iluminación y postura.','Misma postura y luz. Fotos privadas, solo en este dispositivo.','Consejos para comparar fotos'],
 ['Añadí los ingredientes desde el editor anterior','Añadí ingredientes y número de porciones.','Cómo crear una receta'],
 ['No se suman a los totales previos.','Los totales reemplazan los del día; revisalos antes de guardar.','Cómo se trasladan los totales'],
 ['Los relojes se actualizan al volver','Aviso local: app abierta. Aviso al reloj: requiere internet y configuración.','Cómo funcionan los relojes']
 ];
 const staticParas=[...document.querySelectorAll('main p')].filter(p=>!p.id&&!p.hasAttribute('role')&&!p.querySelector('input,button,select,textarea')&&!p.closest('#help502'));
 for(const [prefix,short,title] of rules){const p=staticParas.find(x=>x.textContent.trim().startsWith(prefix));if(!p||!p.parentNode)continue; const d=document.createElement('details');d.className='context57';const sum=document.createElement('summary');sum.textContent=title;const lead=document.createElement('p');lead.className='meta compact502';lead.textContent=short;p.before(lead,d);d.append(sum,p);}
});

/* V5.7.3 — Keep exact guidance available without hiding dynamic status or consent. */
document.addEventListener('DOMContentLoaded',()=>{
 const rules=[
  ['Necesita internet y permiso de notificaciones.','Aviso al reloj: internet y permisos. Puede llegar un aviso anterior si falla una cancelación.','Cómo se entregan los avisos']
 ];
 for(const [prefix,short,title] of rules){const p=[...document.querySelectorAll('main p.tiny,main p.meta')].find(x=>!x.id&&!x.hasAttribute('role')&&!x.closest('#help502,.context57')&&x.textContent.trim().startsWith(prefix));if(!p)continue;const d=document.createElement('details');d.className='context57';const h=document.createElement('summary');h.textContent=title;const l=document.createElement('p');l.className='tiny compact502';l.textContent=short;p.before(l,d);d.append(h,p);}
 // Link plain labels to their adjacent input where the original markup has an ID.
 for(const label of document.querySelectorAll('main label:not([for])')){const input=label.nextElementSibling;if(!label.querySelector('input,select,textarea')&&input?.matches('input[id],select[id],textarea[id]'))label.htmlFor=input.id;}
 const coach=document.getElementById('coach50');if(coach){
  const toggles=['coachShare50','memInclude55'].map(id=>document.getElementById(id)?.closest('label')).filter(Boolean);
  if(toggles.length===2){const group=document.createElement('div');group.className='share573';group.setAttribute('role','group');group.setAttribute('aria-label','Contexto opcional de la consulta');const h=document.createElement('small');h.textContent='Contexto opcional';toggles[0].before(group);group.append(h,...toggles);const note=document.createElement('p');note.className='tiny';note.textContent='Salud requiere el permiso de la pestaña Salud. La memoria incluye recuerdos, decisiones y meses cerrados.';group.append(note);}
  const mode=document.getElementById('coachMode50');const label=coach.querySelector('label[for="coachQuestion50"]');const sync=()=>{if(label&&mode)label.textContent=mode.value==='chat'?'Tu pregunta':'Tu pregunta (opcional)';};mode?.addEventListener('change',sync);sync();
 }
});
