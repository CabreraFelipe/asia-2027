/* R32.2: presentation only; keep original controls/listeners and diary data. */
(()=>{'use strict';
const el=id=>document.getElementById(id),details=(txt)=>{const d=document.createElement('details'),s=document.createElement('summary');d.className='context57 uiHelp8322';s.textContent=txt;d.append(s);return d;};
// Move long static explanations into an optional help disclosure, not warnings or status.
for(const id of ['planner820','reminderConfig821','personal822','gymTemplates826','nutritionTransfer827','healthTransfer828','healthSources828','simulator825']){
 const panel=el(id);if(!panel)continue;const p=[...panel.children].find(n=>n.tagName==='P'&&(n.classList.contains('meta')||n.classList.contains('tiny')||!n.className)&&!n.id&&!n.hasAttribute('role'));
 if(p&&p.textContent.trim().length>110){const d=details('Cómo funciona');const short={planner820:'Consultá y reprogramá tu semana.',reminderConfig821:'Avisos locales; no cambia las notificaciones push.',personal822:'Elegí qué querés ver en Inicio.',gymTemplates826:'Creá una versión sin modificar sesiones previas.',nutritionTransfer827:'Transferencia selectiva; verificá el respaldo antes de restaurar.',healthTransfer828:'Transferencia selectiva; no sobrescribe discrepancias.',healthSources828:'Compara las fuentes sin sumar pasos dos veces.',simulator825:'Escenarios hipotéticos, no predicciones ni recomendaciones de déficit.'}[id];const caption=document.createElement('p');caption.className='meta';caption.textContent=short;p.before(caption,d);d.append(p);}
}
// New direct cards use the existing organizer and its persisted folding state.
for(const root of document.querySelectorAll('main > section'))for(const card of root.querySelectorAll(':scope > details.card'))card.classList.add('sectionfold');
// Nested disclosures are consistent with the original Gym controls. Do not wrap/recreate their content.
for(const id of ['gymTemplates826','nutritionTransfer827','planner820','reminders821','reminderConfig821','personal822','muscleRecovery819','homeRecovery819'])el(id)?.classList.add('gymMini571');
// The visual panels already clear images on collapse. Keep native details and show privacy notices.
for(const id of ['visual824-meal','visual824-technique'])el(id)?.classList.add('sectionfold');
})();
