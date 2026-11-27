// Meal comparison, entirely local. Uses confirmed quantities and existing library, never logs intake.
(function(root){'use strict';
const check=(v,m)=>{if(!v)throw Error(m)},obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),exact=(x,k)=>obj(x)&&Object.keys(x).length===k.length&&k.every(y=>Object.hasOwn(x,y)),num=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b,txt=x=>typeof x==='string'&&x.trim()&&x.length<=100,round=x=>Math.round(x*10)/10;
const meals=Object.freeze(['Desayuno','Almuerzo','Merienda','Cena']),macros=['kcal','protein','carbs','fat'],caps=[15000,1000,2000,1000],maxItems=4,maxAlternatives=6;
function values(x){check(obj(x)&&txt(x.name)&&txt(x.basis)&&['manual','meal','label','recipe'].includes(x.source)&&macros.every((k,i)=>i>=2&&x[k]===null||num(x[k],0,caps[i])),'Ficha nutricional incompleta o inválida');return Object.fromEntries(macros.map(k=>[k,x[k]]))}
function sum(rows){return Object.fromEntries(macros.map(k=>[k,rows.some(x=>x[k]===null)?null:round(rows.reduce((n,x)=>n+x[k],0))]))}
function library(settings){
 const f=settings?.favorites52??[],r=settings?.recipes52??[];check(Array.isArray(f)&&f.length<=100&&Array.isArray(r)&&r.length<=40,'Biblioteca inválida');
 const list=f.map((x,i)=>({id:'favorite-'+i,name:x.name,basis:x.basis,source:x.source,...values(x)}));
 for(const [i,x] of r.entries()){check(obj(x)&&txt(x.name)&&Number.isInteger(x.servings)&&num(x.servings,1,50)&&Array.isArray(x.ingredients)&&num(x.ingredients.length,1,30),'Receta inválida');const v=sum(x.ingredients.map(values));for(const k of macros)if(v[k]!==null)v[k]=round(v[k]/x.servings);check(macros.every((k,j)=>v[k]===null&&j>=2||num(v[k],0,caps[j])),'Porción inválida');list.push({id:'recipe-'+i,name:x.name,basis:'1 porción de receta',source:'recipe',...v});}
 return list;
}
function evaluate(items,lib){
 check(Array.isArray(items)&&num(items.length,1,maxItems)&&new Set(items.map(x=>x?.id)).size===items.length,'Elegí de uno a cuatro alimentos diferentes por alternativa');
 const rows=items.map(x=>{check(exact(x,['id','factor'])&&num(x.factor,.01,20)&&Math.abs(x.factor*100-Math.round(x.factor*100))<1e-6,'Revisá las cantidades confirmadas');const f=lib.find(y=>y.id===x.id);check(f,'Cambió la biblioteca');const v=Object.fromEntries(macros.map(k=>[k,f[k]===null?null:round(f[k]*x.factor)]));check(macros.every((k,i)=>v[k]===null&&i>=2||num(v[k],0,caps[i])),'Porción fuera de rango');return {id:f.id,name:f.name,basis:f.basis,source:f.source,factor:x.factor,...v}});
 return {rows,totals:sum(rows)};
}
function compare(settings,strategy,choices,N){
 check(N&&typeof N.validate==='function'&&typeof N.preview==='function','Estrategias no disponibles');const st=N.validate(settings?.nutrition103),p=st.plans.find(x=>x.id===strategy);check(p,'Elegí una estrategia guardada y revisada');const target=N.preview(p),lib=library(settings);
 check(Array.isArray(choices)&&choices.length===4,'Completá las cuatro comidas');const options=choices.map(a=>{check(Array.isArray(a)&&num(a.length,1,maxAlternatives),'Elegí entre una y seis alternativas por comida');const seen=new Set();return a.map(x=>{const y=evaluate(x,lib),sig=JSON.stringify(y.rows.map(r=>[r.id,r.factor]).sort());check(!seen.has(sig),'Alternativa repetida');seen.add(sig);return y})});
 const relative=(actual,ref)=>Math.abs(actual-ref)/Math.max(1,ref),rank=[];
 for(const a of options[0])for(const b of options[1])for(const c of options[2])for(const d of options[3]){
  const selections=[a,b,c,d],totals=sum(selections.map(x=>x.totals));
  if(totals.kcal>caps[0]||totals.protein>caps[1]||(totals.carbs!==null&&totals.carbs>caps[2])||(totals.fat!==null&&totals.fat>caps[3]))continue;
  // Rank by comparison to user-chosen daily and per-meal references; no food quantity is changed.
  const score=relative(totals.kcal,p.calories)+relative(totals.protein,p.protein)+selections.reduce((n,m,i)=>n+(relative(m.totals.kcal,target.meals[i].calories)+relative(m.totals.protein,target.meals[i].protein))/8,0);
  rank.push({selections,totals,score,delta:{kcal:round(totals.kcal-p.calories),protein:round(totals.protein-p.protein)}});
 }
 check(rank.length>0,'No hay combinaciones representables');rank.sort((a,b)=>a.score-b.score);
 return JSON.parse(JSON.stringify({strategy:{id:p.id,name:p.name,calories:p.calories,protein:p.protein,fat:p.fat,carbs:target.carbs,shares:p.shares},combinations:rank.length,menus:rank.slice(0,3)}));
}
root.asiaNutritionMenu=Object.freeze({meals,library,evaluate,compare,maxItems,maxAlternatives});
})(globalThis);
