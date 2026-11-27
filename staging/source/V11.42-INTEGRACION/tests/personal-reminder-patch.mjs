// Copy-only patch for the V10.6 reminder engines. Legacy schedule remains intact.
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('Marcador de recordatorio inesperado');return s.replace(a,()=>b)};
export function personalReminders(source){
 const a=" if(inPeriod&&(!vac||generic))add('weight'";
 const branch=` if(data?.settings?.goals101?.version===2){
  const start=data.settings.personalCalendar1173,own=dateOK(start)&&day>=start;
  const routine=own?a.routine:null;
  add('weight',a.weight,'Revisá el registro de peso.');
  add('diet',a.dietComplete,'Revisá el diario nutricional.');
  if(own&&routine!==null)add('gym',a.matching,'Revisá la rutina prevista.');
  if(!context.cloud){
   const c=data?.diet?.[day]?.checkin89,answered=['energy','hunger','rest','stress','soreness'].filter(k=>Number.isInteger(c?.[k])&&c[k]>=1&&c[k]<=5).length;
   add('checkin',answered>0,'Registro de bienestar opcional.');
   if(Number.isSafeInteger(context.pendingStrategies)&&context.pendingStrategies>0)add('strategy',false,'Hay estrategias con revisión prevista o vencida.');
  }
  return {day,time,phase:own&&a.phase==='active'?'active':'outside',items,routine,generic:true,settings:p};
 }
`;
 return once(source,a,branch+a);
}
export function personalAgenda(source){
 return once(once(once(source,"const start=planner.localClock(now).day,events=[];","const start=planner.localClock(now).day,events=[],personal=source?.settings?.goals101?.version===2;"),"(extended&&includeWeight?115:14)","(!personal&&extended&&includeWeight?115:14)"),"if(day>'2027-03-08')break;","if(!personal&&day>'2027-03-08')break;");
}
