// Version 2: choose among locally verified hybrid alternatives, never invent a dose or a native ID.
// User-authored question/answers may be private; exact preview & consent required per turn.
const check=x=>{if(!x)throw Error('Contexto o respuesta multidisciplinaria inválida')},obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),exact=(x,k)=>obj(x)&&Object.keys(x).length===k.length&&k.every(a=>Object.hasOwn(x,a)),int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,txt=(x,max,min=1)=>typeof x==='string'&&x.trim().length>=min&&x.length<=max&&!/data:image\/|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[a-zA-Z0-9._-]{16,}|sk-[a-zA-Z0-9_-]{16,}|(?:acct_|(?:goal|prog|runplan|sportplan|sportprofile|coachchange|nut)-)[a-f0-9]{32}/i.test(x);
const fields=['strength','running','sport','nutrition'],alias=x=>typeof x==='string'&&/^a[1-8]$/.test(x);
function plan(x){return exact(x,['sessions','minutes','days'])&&int(x.sessions,1,364)&&int(x.minutes,1,60000)&&Array.isArray(x.days)&&x.days.length>=1&&x.days.length<=7&&new Set(x.days).size===x.days.length&&x.days.every(d=>int(d,0,6));}
function nut(x){return exact(x,['calories','protein','fat','shares','apply'])&&int(x.calories,1200,5000)&&int(x.protein,30,300)&&int(x.fat,20,150)&&4*x.protein+9*x.fat<=x.calories&&Array.isArray(x.shares)&&x.shares.length===4&&x.shares.every(v=>int(v,0,100))&&x.shares.reduce((a,b)=>a+b,0)===100&&typeof x.apply==='boolean';}
export function validateHybridInput1187(x){
 check(exact(x,['version','question','goal','turns','options'])&&x.version===2&&txt(x.question,1200)&&txt(x.goal,300,0)&&Array.isArray(x.turns)&&x.turns.length<=4&&Array.isArray(x.options)&&x.options.length>=1&&x.options.length<=8);
 for(const turn of x.turns)check(exact(turn,['question','answer'])&&txt(turn.question,250)&&txt(turn.answer,500));
 const seen=new Set();for(const o of x.options){check(exact(o,['alias',...fields])&&alias(o.alias)&&!seen.has(o.alias)&&fields.some(k=>o[k]!==null));seen.add(o.alias);for(const k of fields)check(o[k]===null||(k==='nutrition'?nut(o[k]):plan(o[k])));}
 check(new TextEncoder().encode(JSON.stringify(x)).length<=12000);return x;
}
const record=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
export const hybridReplySchema1187=record({kind:{type:'string',enum:['clarify','advice','proposal']},answer:{type:'string'},questions:{type:'array',items:{type:'string'}},choice:{type:['string','null']}});
export function validateHybridReply1187(x,input){
 validateHybridInput1187(input);check(exact(x,['kind','answer','questions','choice'])&&['clarify','advice','proposal'].includes(x.kind)&&txt(x.answer,1800)&&Array.isArray(x.questions)&&x.questions.length<=3&&x.questions.every(q=>txt(q,250)));
 check(x.kind==='proposal'?x.questions.length===0&&input.options.some(o=>o.alias===x.choice):x.choice===null&&(x.kind==='clarify'?x.questions.length>=1:x.questions.length===0));return x;
}
