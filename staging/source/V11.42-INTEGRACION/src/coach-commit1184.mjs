import '../../../../migration88.mjs';
import '../../../../training1184.js';
import '../../../../nutrition1184.js';
import '../../../../coach-bundle1184.js';
import {inspectLegacy88} from '../../../../migration88.mjs';
import {validateGym} from '../../../../gym84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),day=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const api=()=>({A:globalThis.asiaCoachActions1179,Gym:globalThis.asiaGym826,S:globalThis.asiaSchedule829,T:globalThis.asiaTraining102,R:globalThis.asiaRunning1174,Sport:globalThis.asiaSport1177,N:globalThis.asiaNutrition103,G:globalThis.asiaExtras830.goals101});
function read(snapshot){check(snapshot&&typeof snapshot.diary==='string'&&Number.isSafeInteger(snapshot.revision)&&snapshot.revision>=1&&Number.isSafeInteger(snapshot.proRevision)&&snapshot.proRevision>=0,'Diario no disponible');const d=JSON.parse(snapshot.diary);inspectLegacy88(d);return d;}
function current(data){const s=data.settings??{},c=globalThis.asiaCore105,defaults=c.defaults,k=Number.isInteger(s.coachKcal50)&&c.valid(s.coachKcal50,'calories')?s.coachKcal50:defaults.calories,p=Number.isInteger(s.coachProtein50)&&c.valid(s.coachProtein50,'protein')?s.coachProtein50:defaults.protein;check(c.coachTarget({calories:k,protein:p})||globalThis.asiaExtras830.target103({calories:k,protein:p}),'Objetivos vigentes inválidos');return {calories:k,protein:p};}
function calculate(data,kind,proposal,today){
 check(day(today),'Fecha inválida');let next,dates,sportRows=null;const x=api();
 if(kind==='strength'){next=x.A.apply(data,proposal,today,x);dates=proposal.view.dates;}
 else if(kind==='bundle'){next=globalThis.asiaCoachBundle1180.apply(data,proposal,today,x,current(data));dates=proposal.view.affectedDates;sportRows=proposal.view.sport?.after??null;}
 else if(kind==='sport'||kind==='sportReduction'){
  check(proposal&&Object.keys(proposal).length===3&&Object.hasOwn(proposal,'draft')&&Object.hasOwn(proposal,'key')&&Object.hasOwn(proposal,'view')&&/^sportplan-[a-f0-9]{32}$/.test(proposal.key),'Propuesta deportiva inválida');
  const {draft,key,view}=proposal,g=x.G(data.settings?.goals101);
  const b=kind==='sport'?x.Sport.activate(data.sport1177,draft,key,g,data.settings,data.running1174,today,x.S,x.R,data.work):x.Sport.activateReduction(data.sport1177,draft,key,g,data.settings,data.running1174,today,x.S,x.R,data.work);
  sportRows=b.plans[key].rows;check(eq(view,{rows:sportRows}),'Vista deportiva no coincide');dates=sportRows.map(r=>r.day);next={...data,sport1177:b};
 }else throw Error('Acción Coach desconocida');
 inspectLegacy88(next);return {next,dates,sportRows};
}
function proCheck(gym,result){const {dates,sportRows}=result;check(gym&&Number.isSafeInteger(gym.revision)&&gym.revision>=0,'Gym PRO no disponible');if(gym.revision){validateGym(gym.payload);check(!gym.payload.active&&!gym.payload.planned.some(r=>dates.includes(r.date))&&!gym.payload.sessions.some(r=>dates.includes(r.date)),'Sesión PRO activa o fechas ocupadas');}if(sportRows)api().Sport.proCalendarGuard(gym,sportRows);}
export function createCoachCommit1184({editing,verify,today,canUse}){
 check(typeof editing?.coachSnapshot==='function'&&typeof editing?.commitCoachDiary==='function'&&typeof editing?.moduleStore?.read==='function'&&typeof verify==='function'&&typeof today==='function'&&typeof canUse==='function','Coach no disponible');
 let pending=null,flight=false,closed=false,epoch=0;
 function guard(){check(!closed&&canUse(),'Diario bloqueado')}
 async function review(kind,proposal,expectedDiary){check(!flight,'Operación en curso');guard();pending=null;const mark=++epoch;flight=true;try{await verify();guard();const snap=await editing.coachSnapshot();guard();check(snap.diary===expectedDiary,'El diario cambió; revisá nuevamente');const d=read(snap),p=clone(proposal),date=today(),result=calculate(d,kind,p,date),gym=await editing.moduleStore.read('gym');proCheck(gym,result);const after=await editing.coachSnapshot();guard();check(mark===epoch&&eq(snap,after)&&date===today(),'Cambió el calendario o la revisión PRO');pending={kind,p,date,snap,gymRevision:gym.revision};return {revision:snap.revision,proRevision:snap.proRevision,view:clone(p.view)};}finally{flight=false}}
 async function apply(kind,proposal,expectedDiary){check(!flight,'Operación en curso');guard();const r=pending;pending=null;check(r&&r.kind===kind&&eq(r.p,proposal)&&r.snap.diary===expectedDiary&&r.date===today(),'Revisá nuevamente la propuesta');flight=true;try{await verify();guard();const snap=await editing.coachSnapshot();guard();check(eq(snap,r.snap),'Cambió el diario o la bóveda modular');const result=calculate(read(snap),kind,r.p,r.date),gym=await editing.moduleStore.read('gym');proCheck(gym,result);check(gym.revision===r.gymRevision,'Cambió Gym PRO');const after=await editing.coachSnapshot();guard();check(eq(after,snap)&&today()===r.date,'Cambió el calendario');const diary=JSON.stringify(result.next),ack=await editing.commitCoachDiary(snap,diary);check(ack.accountId===snap.accountId&&ack.revision===snap.revision+1&&ack.proRevision===snap.proRevision,'Guardado local no confirmado');await verify();guard();return {diary,revision:ack.revision,proRevision:ack.proRevision,localOnly:true};}finally{flight=false}}
 return Object.freeze({review,apply,discard(){epoch++;pending=null},close(){closed=true;epoch++;pending=null}});
}
