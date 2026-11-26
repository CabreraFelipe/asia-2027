import {validateInput,validateReply} from './coach-contract1185.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// Explicitly synthetic fixture. No free text interpretation, no personalized advice.
export function sampleReply(input){
 validateInput(input);
 if(input.routine.length<2)return {kind:'clarify',answer:'Respuesta de prueba: la rutina tiene un solo ejercicio.',questions:['¿Querés seleccionar otra sesión con más ejercicios?'],operations:[]};
 return {kind:'proposal',answer:'Respuesta de prueba local: quitar el último ejercicio para comprobar el flujo de revisión. No es una recomendación de entrenamiento.',questions:[],operations:[{type:'remove',at:input.routine.length-1,to:null,choice:null,sets:null,min:null,max:null,rest:null}]};
}
// The real transport, when provisioned, must provide preview/send/take/discard.
// Persist revalidates and commits via the V11.84 parent shell, not via raw storage.
export function createConversation1185({context,api,getState,persist,newId,transport=null,allowSynthetic=false,now=Date.now}){
 check(typeof context?.preview==='function'&&typeof context?.toNative==='function'&&typeof api?.A?.apply==='function'&&typeof getState==='function'&&typeof newId==='function'&&['review','apply','discard'].every(k=>typeof persist?.[k]==='function'),'Coach no disponible');
 let phase='idle',epoch=0,bound=null,local=null,authorization=null,reply=null,proposal=null,source=null,edited=null,expires=0;
 function state(){const s=getState();check(s&&s.busy===false&&typeof s.disk==='string'&&s.data&&s.today,'Finalizá las sesiones activas o guardá el diario');return s}
 function live(mark){check(mark===epoch,'Revisión descartada');const s=state();check(bound&&s.disk===bound.disk&&s.today===bound.today&&now()<expires&&eq(context.preview(s.data,local.selection,s.today,api),local),'Cambió el diario o venció la revisión');return s;}
 function view(){return clone({phase,epoch,source,payload:phase==='consent'?local?.input??null:null,reply,edited,choices:local?.input?.choices??[],proposal:proposal?.view??null,expires:expires||null,providerAvailable:!!transport&&transport.available?.()===true,syntheticAvailable:allowSynthetic===true});}
 function discard(){check(!['saving','unconfirmed'].includes(phase),'Guardado en curso o por verificar');epoch++;transport?.discard();persist.discard();phase='idle';bound=local=authorization=reply=proposal=source=edited=null;expires=0;}
 function prepare(selection){check(!['saving','unconfirmed','sending','reviewing'].includes(phase),'Operación en curso');discard();const s=state(),l=clone(context.preview(s.data,selection,s.today,api));validateInput(l.input);bound={disk:s.disk,today:s.today};local=l;expires=now()+120000;phase='consent';return view();}
 async function send(visible,accepted,mode){
  check(phase==='consent'&&accepted===true&&eq(visible,view())&&['provider','synthetic'].includes(mode),'Revisá y autorizá el contexto exacto');
  check(mode==='synthetic'?allowSynthetic===true:transport?.available?.()===true,'Proveedor de IA no disponible');
  const mark=epoch;live(mark);phase='sending';try{
   let r;
   if(mode==='synthetic'){r=sampleReply(local.input);}
   else{authorization=transport.preview(local.input);check(eq(authorization.payload,local.input)&&authorization.expiresAt>now(),'Contexto no autorizado');expires=Math.min(expires,authorization.expiresAt);const answer=await transport.send(authorization,true);live(mark);check(eq(answer.input,local.input),'Respuesta de otro contexto');const consumed=await transport.take(answer);live(mark);check(eq(answer,consumed),'Respuesta no vigente');r=answer.reply;}
   live(mark);reply=clone(validateReply(r,local.input));edited=clone(reply.operations);source=mode;phase='answer';return view();
  }catch(e){if(mark===epoch)discard();throw e}
 }
 async function review(operations,confirmed){
  check(['answer','review'].includes(phase)&&reply?.kind==='proposal'&&confirmed===true,'Confirmá la técnica y el material');const mark=epoch;proposal=null;persist.discard();phase='reviewing';
  try{const s=live(mark),r={...reply,operations:clone(operations)};validateReply(r,local.input);
   const p=context.toNative(s.data,local,r,true,newId(),s.today,api);api.A.apply(s.data,p,s.today,api);await persist.review('strength',p);live(mark);proposal=clone(p);edited=clone(operations);phase='review';return view();
  }catch(e){if(mark===epoch){persist.discard();proposal=null;phase='answer'}throw e}
 }
 async function apply(visible,accepted){check(phase==='review'&&accepted===true&&eq(visible,view()),'Aceptá la propuesta exacta');const mark=epoch,s=live(mark),p=proposal,next=api.A.apply(s.data,p,s.today,api);phase='saving';
  try{const ack=await persist.apply('strength',p,next);check(ack?.localOnly===true&&Number.isSafeInteger(ack.revision),'Guardado local no confirmado');phase='idle';discard();phase='saved';return view()}
  catch(e){phase='unconfirmed';throw e}
 }
 return Object.freeze({prepare,send,review,apply,discard,view});
}
