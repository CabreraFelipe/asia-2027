import {validateHybridInput1187,validateHybridReply1187} from './coach-hybrid-contract1187.mjs';
// Deterministic synthetic test transport, not a recommendation or AI provider.
const copy=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),check=v=>{if(!v)throw Error('Prueba local inválida')};
export function createHybridSample1188({syntheticOnly=false,now=Date.now}={}){
 check(syntheticOnly===true);let pending=null,result=null;
 function discard(){pending=result=null}
 return Object.freeze({available:()=>true,preview(input){validateHybridInput1187(input);discard();pending={payload:copy(input),expiresAt:now()+120000};return copy(pending)},async send(review,confirmed){check(confirmed===true&&pending&&eq(review,pending)&&now()<pending.expiresAt);const p=pending;pending=null;const i=p.payload,r=i.turns.length?{kind:'proposal',answer:'Prueba fija local: selecciona la primera alternativa. No es una recomendación.',questions:[],choice:i.options[0].alias}:{kind:'clarify',answer:'Pregunta fija de prueba; no se interpreta el texto.',questions:['¿Qué prioridad querés usar para esta prueba sintética?'],choice:null};validateHybridReply1187(r,i);result={input:copy(i),reply:r,expiresAt:p.expiresAt};return copy(result)},async take(review){check(result&&eq(review,result)&&now()<result.expiresAt);const r=copy(result);result=null;return r},discard});
}
