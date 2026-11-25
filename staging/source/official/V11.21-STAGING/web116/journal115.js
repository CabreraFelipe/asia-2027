// V11.15 strictly synthetic structured domain data: original V10.6 diet / workout field concepts.
// No free-text, no health measurements, no personal information, no imports from V10.6.
const idPattern=/^[0-9a-f]{32}$/,ownerPattern=/^acct_[0-9a-f]{32}$/;
const datePattern=/^2026-01-(?:0[1-9]|[12][0-9]|3[01])$/;
export const FORMAT115='asia-v1115-synthetic-domain-v1';
export const dietValues=Object.freeze(['yes','part','no','flex']);
export const routineValues=Object.freeze(['A','B','C']);
const keys=(x,expected)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===expected.slice().sort().join(',');
export const validOwner=x=>typeof x==='string'&&ownerPattern.test(x);
const num=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
export function validEntry(x){
 if(!x||typeof x!=='object'||Array.isArray(x)||!idPattern.test(x.id)||!datePattern.test(x.date))return false;
 if(x.kind==='diet')return keys(x,['id','kind','date','ad','steps','energy'])&&dietValues.includes(x.ad)&&Number.isInteger(x.steps)&&num(x.steps,0,30000)&&Number.isInteger(x.energy)&&num(x.energy,1,5);
 if(x.kind==='workout')return keys(x,['id','kind','date','routine','cardioMin','cardioSpeed','cardioIncline','cardioRPE'])&&routineValues.includes(x.routine)&&[x.cardioMin,x.cardioSpeed,x.cardioIncline,x.cardioRPE].every(Number.isInteger)&&num(x.cardioMin,0,90)&&num(x.cardioSpeed,0,18)&&num(x.cardioIncline,0,15)&&num(x.cardioRPE,1,10);
 return false;
}
export function validJournal(x,owner){
 if(!validOwner(owner)||!keys(x,['format','owner','entries'])||x.format!==FORMAT115||x.owner!==owner||!Array.isArray(x.entries)||x.entries.length>40||!x.entries.every(validEntry))return false;
 return new Set(x.entries.map(y=>y.id)).size===x.entries.length&&new Set(x.entries.map(y=>y.date+'|'+y.kind)).size===x.entries.length;
}
export function blankJournal(owner){if(!validOwner(owner))throw Error('CUENTA_INVALIDA');return {format:FORMAT115,owner,entries:[]};}
const newId=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
export function addEntry(journal,fields){
 if(!validJournal(journal,journal?.owner))throw Error('DIARIO_INVALIDO');
 if(journal.entries.length>=40)throw Error('LIMITE_DE_ENTRADAS');
 const row={...fields,id:newId()};
 if(!validEntry(row))throw Error('REGISTRO_FICTICIO_INVALIDO');
 if(journal.entries.some(x=>x.date===row.date&&x.kind===row.kind))throw Error('YA_EXISTE_UN_REGISTRO_DE_ESE_TIPO_Y_FECHA');
 const next={...journal,entries:[...journal.entries,row]};
 if(!validJournal(next,next.owner))throw Error('DIARIO_INVALIDO');
 return next;
}
const entryEqual=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function mergeJournal(base,proposed,latest){
 const owner=base?.owner;
 if(!validJournal(base,owner)||!validJournal(proposed,owner)||!validJournal(latest,owner))return {status:'INVALIDO'};
 const B=new Map(base.entries.map(x=>[x.id,x])),P=new Map(proposed.entries.map(x=>[x.id,x])),L=new Map(latest.entries.map(x=>[x.id,x]));
 for(const [id,row] of B){if(!P.has(id)||!entryEqual(P.get(id),row)||!L.has(id)||!entryEqual(L.get(id),row))return {status:'MODIFICACION_CONCURRENTE'};}
 const byDay=new Map(latest.entries.map(x=>[x.date+'|'+x.kind,x]));
 const result=latest.entries.slice();
 for(const item of proposed.entries.filter(x=>!B.has(x.id))){
  if(L.has(item.id)){if(!entryEqual(L.get(item.id),item))return {status:'COLISION'};continue;}
  const existing=byDay.get(item.date+'|'+item.kind);
  if(existing)return {status:'FECHA_EN_CONFLICTO'};
  byDay.set(item.date+'|'+item.kind,item);result.push(item);
 }
 if(result.length>40)return {status:'LIMITE'};
 const merged={...latest,entries:result};
 if(!validJournal(merged,owner))return {status:'INVALIDO'};
 return {status:result.length===latest.entries.length?'YA_GUARDADO':'LISTO',payload:merged};
}
export function journalContains(latest,proposed){
 if(!validJournal(latest,latest?.owner)||!validJournal(proposed,latest.owner))return false;
 const m=new Map(latest.entries.map(x=>[x.id,x]));
 return proposed.entries.every(x=>m.has(x.id)&&entryEqual(m.get(x.id),x));
}
export function summary(journal){
 if(!validJournal(journal,journal?.owner))throw Error('DIARIO_INVALIDO');
 const diet=journal.entries.filter(x=>x.kind==='diet'),work=journal.entries.filter(x=>x.kind==='workout');
 return {dietDays:diet.length,trainingDays:work.length,stepsTotal:diet.reduce((n,x)=>n+x.steps,0),cardioMinutes:work.reduce((n,x)=>n+x.cardioMin,0)};
}
