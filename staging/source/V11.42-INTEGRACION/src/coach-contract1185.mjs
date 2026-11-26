// Shared input/output schema only; no provider, network or credentials.
const fail=()=>{throw Error('Coach no disponible o respuesta inválida')};
const check=v=>{if(!v)fail()},obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),exact=(x,ks)=>obj(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k)),integer=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b,txt=(s,max,min=1)=>typeof s==='string'&&s.trim().length>=min&&s.length<=max&&!/data:image\/|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[a-zA-Z0-9._-]{16,}|sk-[a-zA-Z0-9_-]{16,}/i.test(s),nullable=(x,f)=>x===null||f(x);
const ops=['add','replace','remove','move','dose'];
const recordSchema=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false}),str={type:'string'},num={type:['integer','null']};
export const replySchema=recordSchema({kind:{type:'string',enum:['clarify','advice','proposal']},answer:str,questions:{type:'array',items:str},operations:{type:'array',items:recordSchema({type:{type:'string',enum:ops},at:{type:'integer'},to:num,choice:{type:['string','null']},sets:num,min:num,max:num,rest:num})}});
export function validateInput(x){
 check(exact(x,['version','question','goal','routine','availableMinutes','scope','choices'])&&x.version===1&&txt(x.question,1200)&&txt(x.goal,300,0)&&integer(x.availableMinutes,30,120)&&['once','future'].includes(x.scope)&&Array.isArray(x.routine)&&x.routine.length>=1&&x.routine.length<=12&&Array.isArray(x.choices)&&x.choices.length<=40);
 for(const e of x.routine)check(exact(e,['name','sets','min','max','rest'])&&txt(e.name,100)&&integer(e.sets,1,12)&&integer(e.min,1,100)&&integer(e.max,e.min,100)&&integer(e.rest,15,600));
 const aliases=new Set(),names=new Set();for(const c of x.choices){check(exact(c,['alias','name'])&&/^e[1-9][0-9]?$/.test(c.alias)&&!aliases.has(c.alias)&&txt(c.name,100)&&!names.has(c.name));aliases.add(c.alias);names.add(c.name);}
 check(JSON.stringify(x).length<=12000);return x;
}
export function validateReply(x,input){
 validateInput(input);check(exact(x,['kind','answer','questions','operations'])&&['clarify','advice','proposal'].includes(x.kind)&&txt(x.answer,1800)&&Array.isArray(x.questions)&&x.questions.length<=3&&x.questions.every(q=>txt(q,250))&&Array.isArray(x.operations)&&x.operations.length<=12);
 check(x.kind==='proposal'?x.operations.length>0&&x.questions.length===0:x.operations.length===0&&(x.kind==='clarify'?x.questions.length>0:x.questions.length===0));
 const choices=new Set(input.choices.map(c=>c.alias)),available=new Set(input.choices.map(c=>c.name)),rows=input.routine.map(e=>e.name);
 for(const o of x.operations){check(exact(o,['type','at','to','choice','sets','min','max','rest'])&&ops.includes(o.type)&&integer(o.at,0,o.type==='add'?rows.length:rows.length-1)&&nullable(o.choice,v=>choices.has(v)));
 const dose=['add','replace','dose'].includes(o.type);check(dose?integer(o.sets,1,6)&&integer(o.min,1,30)&&integer(o.max,o.min,30)&&integer(o.rest,30,600):[o.sets,o.min,o.max,o.rest].every(v=>v===null));
 check(o.type==='move'?integer(o.to,0,rows.length-1):o.to===null);check(['add','replace'].includes(o.type)?o.choice!==null:o.choice===null);
 if(o.type==='add'||o.type==='replace'){const name=input.choices.find(c=>c.alias===o.choice).name;if(o.type==='add')rows.splice(o.at,0,name);else rows[o.at]=name;}
 else if(o.type==='dose')check(available.has(rows[o.at]));else if(o.type==='remove')rows.splice(o.at,1);else if(o.type==='move'){const [v]=rows.splice(o.at,1);rows.splice(o.to,0,v);}
 check(rows.length>=1&&rows.length<=12&&new Set(rows).size===rows.length);
 }return x;
}
