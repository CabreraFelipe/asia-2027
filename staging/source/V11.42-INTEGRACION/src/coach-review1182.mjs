// Unmounted review coordinator. No direct network, writes or DOM.
// The injected commit MUST be a real account-bound durable CAS, not a UI acknowledgement.
import {validateInput,validateReply} from './coach-inference1181.mjs';
const check=(ok,m)=>{if(!ok)throw Error(m)},copy=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),valid=x=>x&&typeof x.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(x.accountId)&&Number.isSafeInteger(x.revision)&&x.revision>=0&&Number.isSafeInteger(x.proRevision)&&x.proRevision>=0&&typeof x.today==='string'&&x.data&&typeof x.data==='object'&&x.busy===false;
const stamp=x=>({accountId:x.accountId,revision:x.revision,proRevision:x.proRevision,today:x.today});
export function createCoachReview1182({transport,context,api,readState,checkPRO,commit,newId,now=Date.now,ttlMs=120000}){
 check(['preview','send','take','discard','close'].every(k=>typeof transport?.[k]==='function')&&typeof context?.preview==='function'&&typeof context?.toNative==='function'&&typeof api?.A?.apply==='function'&&[readState,checkPRO,commit,newId,now].every(f=>typeof f==='function')&&Number.isSafeInteger(ttlMs)&&ttlMs>=1000&&ttlMs<=300000,'Configuración inválida');
 let phase='idle',closed=false,epoch=0,bound=null,local=null,consent=null,reply=null,native=null,deadline=0;
 function discard(){check(!['saving','unconfirmed'].includes(phase),'Hay un guardado en curso o pendiente de verificar');epoch++;transport.discard();phase='idle';bound=local=consent=reply=native=null;deadline=0;}
 function close(){check(phase!=='saving','Hay un guardado en curso');if(phase==='unconfirmed'){epoch++;transport.discard();bound=local=consent=reply=native=null;deadline=0;}else discard();closed=true;transport.close();phase='closed';}
 async function state(){check(!closed,'Coach cerrado');const s=await readState();check(!closed&&valid(s),'Finalizá sesiones activas o revisá la cuenta');return s;}
 function same(s){check(bound&&eq(stamp(s),bound)&&now()<deadline,'La cuenta o los datos cambiaron; volvé a revisar');}
 function still(e){check(!closed&&epoch===e,'Consulta descartada');}
 function view(){return copy({phase,reviewEpoch:epoch,payload:consent?.payload??null,expiresAt:deadline||null,reply:reply??null,proposal:native?.view??null});}
 async function prepare(selection){
  check(!closed&&!['sending','saving','preparing','reviewing','unconfirmed'].includes(phase),'Coach ocupado');discard();phase='preparing';const e=epoch;
  try{const s=await state();still(e);const l=context.preview(s.data,selection,s.today,api);validateInput(l.input);const c=transport.preview(l.input);check(eq(c.payload,l.input)&&Number.isFinite(c.expiresAt)&&c.expiresAt>now(),'Contexto de consulta inválido');
   bound=stamp(s);local=l;consent=c;deadline=Math.min(c.expiresAt,now()+ttlMs);phase='consent';return view();
  }catch(err){if(epoch===e)discard();throw err}
 }
 async function send(visible,accepted){
  check(phase==='consent'&&accepted===true&&eq(visible,view()),'Revisá y autorizá el contexto exacto');const e=epoch;phase='sending';
  try{same(await state());still(e);const r=await transport.send(consent,true);still(e);const s=await state();still(e);same(s);check(eq(r.input,local.input)&&r.expiresAt>=now(),'Respuesta de otro contexto');
   const checked=validateReply(r.reply,local.input);const taken=await transport.take(r);still(e);check(eq(taken,r),'Respuesta no vigente');same(await state());still(e);
   reply=copy(checked);consent=null;phase='answer';return view();
  }catch(err){if(epoch===e)discard();throw err}
 }
 async function review(editedOperations,confirmedMaterial){
  check(['answer','review'].includes(phase)&&reply?.kind==='proposal'&&confirmedMaterial===true,'No hay propuesta o falta confirmar disponibilidad');const e=epoch;phase='reviewing';native=null;
  try{const s=await state();still(e);same(s);const edited={...reply,operations:copy(editedOperations)};validateReply(edited,local.input);
   const p=context.toNative(s.data,local,edited,true,newId(),s.today,api);const pro=await checkPRO(p.view.dates);still(e);check(pro===bound.proRevision,'Cambió la agenda PRO');
   const latest=await state();still(e);same(latest);api.A.apply(latest.data,p,latest.today,api);native=p;phase='review';return view();
  }catch(err){if(epoch===e){native=null;phase='answer'}throw err}
 }
 async function apply(visible,accepted){
  check(phase==='review'&&native&&accepted===true&&eq(visible,view()),'Aceptá la propuesta exacta revisada');const e=epoch,p=native;phase='saving';
  try{const s=await state();still(e);same(s);const pro=await checkPRO(p.view.dates);still(e);check(pro===bound.proRevision,'Cambió la agenda PRO');const latest=await state();still(e);same(latest);
   const next=api.A.apply(latest.data,p,latest.today,api);
   // CAS must atomically bind diary revision + account + PRO revision. If the
   // backend cannot provide this guarantee, don't expose this coordinator.
   const ack=await commit({expected:copy(bound),next,changeId:p.changeId});
   check(ack?.ok===true&&ack.accountId===bound.accountId&&ack.changeId===p.changeId&&ack.revision===bound.revision+1&&ack.proRevision===bound.proRevision,'Guardado no confirmado; verificá recuperación antes de reintentar');
   phase='idle';discard();phase='saved';return {phase,changeId:p.changeId,revision:ack.revision};
  }catch(err){phase='idle';discard();phase='unconfirmed';throw err}
 }
 return Object.freeze({prepare,send,review,apply,discard,close,view});
}
