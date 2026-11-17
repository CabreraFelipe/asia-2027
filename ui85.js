/* V8.8.10 — presentation layer. Reuse the original organizer, never recreate inputs. */
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
 organizer.classList.add('inlineOrganizer863');const search=document.createElement('input');search.type='search';search.className='sectionSearch889';search.placeholder='Buscar apartado';search.setAttribute('aria-label','Buscar apartado en la aplicación');const results=document.createElement('div');results.className='searchResults889';results.hidden=true;results.setAttribute('aria-label','Resultados de búsqueda');
 const norm=x=>String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 function candidates(){const out=[];for(const [t,rid,oid2,nav] of specs){const rr=by(rid);if(!rr)continue;for(const target of rr.querySelectorAll(':scope > .card')){if(target.hidden||target.id===oid2||target.classList.contains('hide')||target.classList.contains('hiddenPanel51')||target.classList.contains('personalHidden822')||target.classList.contains('personalEmpty822')||target.classList.contains('layout51'))continue;const title=(target.querySelector(':scope > summary, .foldHeader51 .foldToggle51, :scope > h2, :scope > .row h2')?.textContent||'').trim();if(title)out.push({t,target,title,section:by(nav)?.textContent.trim()||t});}}for(const target of document.querySelectorAll('main > .card, main > details.sectionfold')){if(target.hidden||target.classList.contains('hide')||target.classList.contains('layout51')||target.classList.contains('hiddenPanel51')||target.classList.contains('personalHidden822'))continue;const title=(target.querySelector(':scope > summary, :scope > h2, :scope > .row h2, .foldHeader51 .foldToggle51')?.textContent||'').trim();if(title)out.push({t:key,target,title,section:'General'});}return out;}
 function query(){const q=norm(search.value);results.replaceChildren();results.hidden=!q;if(!q)return;const matches=candidates().filter(x=>q.split(/\s+/).every(word=>norm(x.title+' '+x.section).includes(word)));for(const x of matches.slice(0,15)){const b=button(x.title+' · '+x.section,()=>{if(!x.target.isConnected)return;search.value='';results.replaceChildren();results.hidden=true;tab(x.t);window.asiaRevealPanel541?.(x.target);if(x.target.tagName==='DETAILS')x.target.open=true;x.target.scrollIntoView({block:'start',behavior:'smooth'});});results.append(b);}if(!matches.length){const p=document.createElement('p');p.className='tiny';p.textContent='Sin coincidencias visibles. Revisá Personalizar si el apartado está oculto.';results.append(p);}}
 search.addEventListener('input',query);search.addEventListener('keydown',e=>{if(e.key==='Escape'){search.value='';query();}else if(e.key==='Enter'){const first=results.querySelector('button');if(first){e.preventDefault();first.click();}}});tools.append(personalize,reset,search,results);root.prepend(tools,organizer);
 organizer.addEventListener('toggle',update);update();
}
function active(){for(const [,id,,nav] of specs){const b=by(nav),root=by(id);if(!b||!root)continue;if(!root.classList.contains('hide'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}}
const previous=tab;tab=function(t){previous(t);active();};active();
const nav=document.querySelector('nav');if(nav)nav.setAttribute('aria-label','Secciones principales');
})();
