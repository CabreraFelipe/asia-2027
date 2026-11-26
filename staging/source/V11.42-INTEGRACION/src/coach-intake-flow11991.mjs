// Optional intake state machine. No persistence, account data or implicit inference.
import {validateIntakeInput,validateIntakeReply,continueIntake,reviewedGoal} from './coach-intake1199.mjs';
const check=(v,m)=>{if(!v)throw Error(m)},copy=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function sampleIntake11991(input){
 validateIntakeInput(input);
 return input.turns.length?{kind:'goal',answer:'Respuesta fija de prueba. No interpreta tus respuestas ni recomienda una meta real.',questions:[],goal:{title:'Preparar 10K de prueba',kind:'Running',target:'Completar 10 km (ejemplo sintético)'}}:{kind:'clarify',answer:'Pregunta fija local de prueba, no generada por IA.',questions:[{topic:'Experiencia',question:'¿Cuál sería tu punto de partida en este ejemplo?'},{topic:'Disponibilidad',question:'¿Cuántos días tendría el ejemplo?'}],goal:null};
}
export function createIntakeFlow11991({getState,transport=null,allowSynthetic=false,now=Date.now}){
 check(typeof getState==='function'&&typeof now==='function','Asistente no disponible');
 let phase='idle',input=null,reply=null,bound=null,source=null,expires=0,epoch=0,closed=false;
 function state(){const s=getState();check(!closed&&s?.ready===true&&typeof s.stamp==='string','Guardá el diario o recargá');return s.stamp}
 function live(mark){check(epoch===mark&&bound===state()&&now()<expires,'Cambió el contexto o venció la revisión')}
 function view(){return copy({phase,epoch,payload:phase==='consent'?input:null,reply,source,expires:expires||null,providerAvailable:!closed&&transport?.available?.()===true,syntheticAvailable:!closed&&allowSynthetic===true})}
 function discard(){epoch++;phase='idle';input=reply=bound=source=null;expires=0;transport?.discard()}
 function prepare(question){check(!closed&&phase!=='sending','Consulta en curso');discard();bound=state();input=copy(validateIntakeInput({version:3,question,turns:[]}));expires=now()+120000;phase='consent';return view()}
 async function send(displayed,consent,mode){
  check(phase==='consent'&&consent===true&&eq(displayed,view()),'Revisá y autorizá el contexto exacto');
  check(mode==='synthetic'?allowSynthetic===true:mode==='provider'&&transport?.available?.()===true,'Proveedor no disponible');
  check(source===null||source===mode,'No mezcles respuestas sintéticas y reales');const mark=epoch;
  try{live(mark);phase='sending';let result;
   if(mode==='synthetic')result=sampleIntake11991(input);
   else{const approval=transport.preview(copy(input));check(eq(approval.payload,input)&&approval.expiresAt>now(),'Consentimiento inválido');expires=Math.min(expires,approval.expiresAt);const response=await transport.send(approval,true);live(mark);check(eq(response.input,input),'Respuesta de otro contexto');const taken=await transport.take(response);live(mark);check(eq(taken,response),'Respuesta vencida');result=taken.reply;}
   live(mark);reply=copy(validateIntakeReply(result,input));source=mode;phase='answer';return view();
  }catch(e){if(mark===epoch)discard();throw e}
 }
 function advance(displayed,answers){check(phase==='answer'&&eq(displayed,view()),'Respuesta no vigente');live(epoch);input=copy(continueIntake(input,reply,answers));reply=null;phase='consent';expires=now()+120000;return view()}
 function takeGoal(displayed,confirmed){check(phase==='answer'&&eq(displayed,view()),'Meta no vigente');live(epoch);const goal=reviewedGoal(input,reply,confirmed);discard();return goal}
 return Object.freeze({prepare,send,advance,takeGoal,discard,view,close(){discard();closed=true;transport?.close?.()}})
}
