/* V8.8.7 — presentation layer. Reuse the original organizer, never recreate inputs. */
(()=>{'use strict';
const specs=[['home','home42','layout51','tabHome'],['diet','diet','layout541-diet','tabDiet'],['training','training','layout541-training','tabTrain'],['health','health','layout541-health','tabHealth'],['progress','progress54','layout541-progress54','tabProgress54']];
const by=id=>document.getElementById(id);
function button(label,action){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;b.addEventListener('click',action);return b;}
for(const [key,id,oid] of specs){
 const root=by(id),organizer=by(oid);if(!root||!organizer)continue;
 const tools=document.createElement('div');tools.className='viewTools85';tools.setAttribute('role','group');tools.setAttribute('aria-label','Vista de esta sección');
 const personalize=button('⚙ Personalizar',()=>{organizer.open=!organizer.open;update();});
 personalize.setAttribute('aria-controls',oid);
 const reset=button('Plegar al inicio',()=>{window.asiaInitialView85?.(key);update();window.scrollTo(0,0);});reset.title='Abre solo el primer apartado visible, sin cambiar el orden';
 function update(){personalize.setAttribute('aria-expanded',String(organizer.open));personalize.textContent=organizer.open?'Cerrar personalización':'⚙ Personalizar';if(!organizer.open&&organizer.contains(document.activeElement)&&!root.classList.contains('hide'))personalize.focus({preventScroll:true});}
 // Move the original organizer, not its contents. No extra editor or storage keys.
 organizer.classList.add('inlineOrganizer863');tools.append(personalize,reset);root.prepend(tools,organizer);
 organizer.addEventListener('toggle',update);update();
}
function active(){for(const [,id,,nav] of specs){const b=by(nav),root=by(id);if(!b||!root)continue;if(!root.classList.contains('hide'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}}
const previous=tab;tab=function(t){previous(t);active();};active();
const nav=document.querySelector('nav');if(nav)nav.setAttribute('aria-label','Secciones principales');
})();
