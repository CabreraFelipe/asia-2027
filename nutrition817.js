/* R17: shared pure rules for the original daily nutrition record. No storage/network. */
(function(root){'use strict';
const limits={kcal:15000,protein:1000,carbs:2000,fat:1000};
const finite=(v,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
const round=v=>Math.round(v*10)/10;
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
function matches(name,basis,query){const text=norm(name+' '+basis);return norm(query).split(/\s+/).every(word=>text.includes(word));}
function total(rows){if(!Array.isArray(rows)||rows.length>80||rows.some(x=>!x||typeof x.name!=='string'||!x.name.trim()||typeof x.basis!=='string'||!x.basis.trim()||!finite(x.kcal,limits.kcal)||!finite(x.protein,limits.protein)||['carbs','fat'].some(k=>x[k]!=null&&!finite(x[k],limits[k]))))throw Error('Hay alimentos inválidos. Revisá el detalle antes de actualizar el total.');
 const s=Object.fromEntries(Object.keys(limits).map(k=>[k,rows.length&&rows.every(x=>x[k]!=null)?round(rows.reduce((a,x)=>a+x[k],0)):null]));if(s.kcal>limits.kcal||s.protein>limits.protein)throw Error('Revisá las cantidades: el total supera el límite del registro.');return { ...s, intakeKcal:s.kcal===null?null:Math.round(s.kcal),proteinG:s.protein};}
const saved=r=>({intakeKcal:r?.intakeKcal??null,proteinG:r?.proteinG??null,intakeComplete:r?.intakeComplete===true});
function same(a,b){return a.intakeKcal===b.intakeKcal&&a.proteinG===b.proteinG;}
function plan(record,next,form){const before=saved(record);if(!same(before,form)||before.intakeComplete!==form.intakeComplete)throw Error('Hay totales sin guardar en Registro diario. Guardalos o recargá la fecha antes de actualizar.');const old=total(record?.foods52??[]),after=total(next);return {before,after,needsConfirm:!same(before,old)||before.intakeComplete,patch:{foods52:next,intakeKcal:after.intakeKcal,proteinG:after.proteinG,intakeComplete:false}};}
const api={matches,total,saved,same,plan};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.asiaNutrition817=api;
})(typeof window!=='undefined'?window:globalThis);
