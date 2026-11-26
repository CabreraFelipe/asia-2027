// Shared bridge for manual typed proposals. Local commit is verified, not cloud sync.
(()=>{'use strict';
const check=(v,m)=>{if(!v)throw Error(m)},facade=typeof asiaCandidateSession!=='undefined'?asiaCandidateSession.coachCommit:null;
window.asiaCoachPersist1184=Object.freeze({
 async review(kind,p){check(facade&&localStorage.getItem(key)===disk600&&!blocked600,'Guardado coordinado no disponible');const before=disk600,r=await facade.review(kind,p,before);check(localStorage.getItem(key)===before&&disk600===before&&JSON.stringify(r.view)===JSON.stringify(p.view),'El diario cambió; revisá nuevamente');return r},
 async apply(kind,p,expected){
  check(facade&&!blocked600&&localStorage.getItem(key)===disk600,'Revisá nuevamente los datos');const before=disk600;let r;try{r=await facade.apply(kind,p,before)}catch(e){try{if(localStorage.getItem(key)!==before)blocked600=true}catch{blocked600=true}throw e}
  try{check(r?.localOnly===true&&typeof r.diary==='string'&&localStorage.getItem(key)===r.diary&&disk600===before&&JSON.stringify(JSON.parse(r.diary))===JSON.stringify(expected),'Guardado local requiere recuperación');const validated=validate600(JSON.parse(r.diary));data=validated;disk600=r.diary;syncRoutineCatalog826();return r}
  catch(e){blocked600=true;throw Error('Guardado no verificado en pantalla. Cerrá y reabrí antes de editar.')}
 },
 discard(){facade?.discard()}
});
})();
