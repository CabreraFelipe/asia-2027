import {validateHybridInput1187,validateHybridReply1187} from './coach-hybrid-contract1187.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),keys=['strength','running','sport','nutrition'],prefix={strength:'coachchange',running:'runplan',sport:'sportplan',nutrition:'nut'},days=rows=>[...new Set(rows.map(d=>new Date(d+'T00:00:00Z').getUTCDay()))].sort((a,b)=>a-b);
function summary(view,alias){
 const planned=(rows,dates)=>rows.length?{sessions:rows.length,minutes:rows.reduce((a,r)=>a+r.minutes,0),days:days(dates)}:null;
 return {alias,strength:view.strength?{sessions:view.strength.dates.length,minutes:view.strength.afterMinutes*view.strength.dates.length,days:days(view.strength.dates)}:null,
 running:view.running?planned(view.running.after,view.running.after.map(r=>r.day)):null,sport:view.sport?planned(view.sport.after,view.sport.after.map(r=>r.day)):null,
 nutrition:view.nutrition?{calories:view.nutrition.after.calories,protein:view.nutrition.after.protein,fat:view.nutrition.after.fat,shares:clone(view.nutrition.after.shares),apply:view.nutrition.apply}:null};
}
// Local alternatives are full raw bundle drafts supplied and confirmed by user;
// native engine validates each complete alternative, including hybrid conflicts.
export function createHybrid1187({bundle,api,state,persist,newId,transport=null,now=Date.now}){
 check(['review','apply'].every(k=>typeof bundle?.[k]==='function')&&typeof state==='function'&&typeof newId==='function'&&['review','apply','discard'].every(k=>typeof persist?.[k]==='function'),'Coach no disponible');
 let phase='idle',epoch=0,local=null,input=null,reply=null,proposal=null,choice=null,expires=0;
 function read(){const x=state();check(x&&x.busy===false&&typeof x.disk==='string'&&x.data&&x.current&&typeof x.today==='string','Diario no disponible');return x}
 function live(mark){check(mark===epoch&&local&&now()<expires,'Revisión vencida o descartada');const s=read();check(s.disk===local.disk&&s.today===local.today&&eq(s.current,local.current),'Cambió el diario o los objetivos');return s}
 function view(){return clone({phase,epoch,payload:phase==='consent'?input:null,reply,choice,options:input?.options??[],proposal:proposal?.view??null,expires:expires||null,available:transport?.available?.()===true});}
 function discard(){check(!['saving','unconfirmed'].includes(phase),'Verificá el guardado antes de continuar');epoch++;transport?.discard();persist.discard();local=input=reply=proposal=choice=null;expires=0;phase='idle'}
 function prepare({question,goal='',alternatives}){
  check(!['sending','reviewing','saving','unconfirmed'].includes(phase),'Operación en curso');discard();const s=read();check(Array.isArray(alternatives)&&alternatives.length>=1&&alternatives.length<=8,'Elegí de una a ocho alternativas revisadas');
  const options=alternatives.map((raw,i)=>{const ids=Object.fromEntries(keys.map(k=>[k,raw[k]===null?null:newId(prefix[k])]));const p=clone(bundle.review(s.data,raw,ids,s.today,api,s.current));bundle.apply(s.data,p,s.today,api,s.current);return {alias:'a'+(i+1),p,summary:summary(p.view,'a'+(i+1))}});
  check(new Set(options.map(x=>JSON.stringify(x.p.draft))).size===options.length,'Alternativas repetidas');
  input=clone(validateHybridInput1187({version:2,question,goal,turns:[],options:options.map(x=>x.summary)}));local={disk:s.disk,today:s.today,current:clone(s.current),options};expires=now()+120000;phase='consent';return view();
 }
 function followUp(visible,answers){
  check(phase==='answer'&&reply?.kind==='clarify'&&eq(visible,view())&&Array.isArray(answers)&&answers.length===reply.questions.length,'Respondé las preguntas visibles');live(epoch);
  const updated={...input,turns:[...input.turns,...reply.questions.map((question,i)=>({question,answer:answers[i]}))]};validateHybridInput1187(updated);
  input=clone(updated);reply=null;proposal=null;choice=null;phase='consent';expires=now()+120000;return view();
 }
 async function send(visible,confirmed){
  check(phase==='consent'&&confirmed===true&&eq(visible,view())&&transport?.available?.()===true,'Revisá el contexto y autorizá el envío');const mark=epoch;live(mark);phase='sending';
  try{const review=transport.preview(input);check(eq(review.payload,input)&&review.expiresAt>now(),'Contexto no autorizado');expires=Math.min(expires,review.expiresAt);const r=await transport.send(review,true);live(mark);check(eq(r.input,input),'Respuesta de otro contexto');const taken=await transport.take(r);live(mark);check(eq(taken,r),'Respuesta no vigente');reply=clone(validateHybridReply1187(r.reply,input));phase='answer';return view()}
  catch(e){if(mark===epoch)discard();throw e}
 }
 async function review(visible,selected,confirmed){
  check(['answer','review'].includes(phase)&&reply?.kind==='proposal'&&eq(visible,view())&&confirmed===true,'Confirmá la alternativa que querés revisar');const mark=epoch,s=live(mark),option=local.options.find(x=>x.alias===selected);check(option,'Alternativa no disponible');proposal=null;persist.discard();phase='reviewing';
  try{const p=option.p;bundle.apply(s.data,p,s.today,api,s.current);await persist.review('bundle',p);live(mark);choice=selected;proposal=clone(p);phase='review';return view()}catch(e){if(mark===epoch){persist.discard();phase='answer';choice=null;proposal=null}throw e}
 }
 async function apply(visible,accepted){
  check(phase==='review'&&accepted===true&&eq(visible,view()),'Aceptá la revisión exacta');const s=live(epoch),p=proposal,next=bundle.apply(s.data,p,s.today,api,s.current);phase='saving';
  try{const ack=await persist.apply('bundle',p,next);check(ack?.localOnly===true&&Number.isSafeInteger(ack.revision),'Guardado no confirmado');phase='idle';discard();phase='saved';return view()}catch(e){phase='unconfirmed';throw e}
 }
 return Object.freeze({prepare,followUp,send,review,apply,discard,view});
}
