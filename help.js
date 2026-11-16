/* V5.0.2 — presentation only. Move static guidance, never form fields/status/results. */
(()=>{'use strict';
const byId=id=>document.getElementById(id);
const home=byId('home42'), coach=byId('coach50'), vacation=byId('vacation44'), badges=byId('badges44');
// Existing nodes retain all listeners and state. Keep the coach last among dashboard cards.
if(home&&coach&&vacation&&badges){home.append(vacation,badges,coach);badges.open=false;}
const main=document.querySelector('main');if(!main)return;
const help=document.createElement('details');help.className='card sectionfold help502';help.id='help502';
const summary=document.createElement('summary');summary.textContent='Ayuda y guía de uso';help.append(summary);
const intro=document.createElement('p');intro.className='meta';intro.textContent='Consultá cómo se calculan los indicadores y cómo usar cada función.';help.append(intro);
const groups={};
function group(name){if(!groups[name]){const d=document.createElement('details'),s=document.createElement('summary');s.textContent=name;d.append(s);groups[name]=d;help.append(d);}return groups[name];}
// Exact prefixes of static guidance; preserve original paragraphs and links intact.
// Short essential information remains beside the relevant action or metric.
const rules=[
 ['Meta principal 72 kg','Inicio y objetivos','Meta: 72 kg · aspiracional: 70 kg.'],
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
 ['Los relojes se actualizan al volver','Gym y recuperación','El aviso de descanso requiere la app abierta.'],
 ['Series completadas asignadas','Gym y recuperación','Series por grupo principal; no mide activación.'],
 ['Orientación personal, no aptitud','Gym y recuperación','Índice orientativo, no médico · sueño manual.'],
 ['Datos diarios recibidos desde','Apple Salud','Actualizar consulta Cloudflare; no fuerza la exportación.'],
 ['Los pasos manuales, el sueño','Apple Salud','Solo copia pasos; no altera sueño ni peso.'],
 ['Sesiones importadas desde Health Auto Export','Apple Salud','No duplica calorías ni crea series de Gym.'],
 ['Entrenador integral · cálculos locales','IA y privacidad','Los cambios requieren tu aprobación.'],
 ['Se envían resúmenes numéricos','IA y privacidad','Envía resúmenes y chat reciente a Cloudflare/OpenAI (uso compartido posible). Evitá datos personales.'],
 ['La IA es orientación, no diagnóstico','IA y privacidad','No es diagnóstico. Menú y cargas siguen siendo manuales; chat solo local.'],
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
main.append(help);
})();
