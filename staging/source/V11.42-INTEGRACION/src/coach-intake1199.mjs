// Minimal first conversation; no account, history, routine, health or credential payload.
const check=v=>{if(!v)throw Error('Contexto inicial o respuesta inválidos')},obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),exact=(x,k)=>obj(x)&&Object.keys(x).length===k.length&&k.every(a=>Object.hasOwn(x,a)),txt=(x,max,min=1)=>typeof x==='string'&&x.trim().length>=min&&x.length<=max&&!/data:image\/|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[a-zA-Z0-9._-]{16,}|sk-[a-zA-Z0-9_-]{16,}|(?:acct_|(?:goal|prog|runplan|sportplan|sportprofile|coachchange|nut)-)[a-f0-9]{32}/i.test(x),clone=x=>JSON.parse(JSON.stringify(x));
export const topics=Object.freeze(['Objetivo','Plazo','Experiencia','Disponibilidad','Material','Deporte','Nutrición','Seguridad']);
export const goalKinds=Object.freeze(['Running','Rendimiento deportivo','Fuerza','Otro']);
export function validateIntakeInput(x){
 check(exact(x,['version','question','turns'])&&x.version===3&&txt(x.question,1200)&&Array.isArray(x.turns)&&x.turns.length<=6);
 for(const t of x.turns)check(exact(t,['topic','question','answer'])&&topics.includes(t.topic)&&txt(t.question,250)&&txt(t.answer,500));
 check(new TextEncoder().encode(JSON.stringify(x)).length<=10000);return x;
}
const record=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
export const intakeReplySchema=record({kind:{type:'string',enum:['clarify','advice','goal']},answer:{type:'string'},questions:{type:'array',items:record({topic:{type:'string',enum:topics},question:{type:'string'}})},goal:{anyOf:[{type:'null'},record({title:{type:'string'},kind:{type:'string',enum:goalKinds},target:{type:'string'}})]}});
export function validateIntakeReply(x,input){
 validateIntakeInput(input);check(exact(x,['kind','answer','questions','goal'])&&['clarify','advice','goal'].includes(x.kind)&&txt(x.answer,1800)&&Array.isArray(x.questions)&&x.questions.length<=3);
 for(const q of x.questions)check(exact(q,['topic','question'])&&topics.includes(q.topic)&&txt(q.question,250));
 check(new Set(x.questions.map(q=>q.topic)).size===x.questions.length);
 if(x.kind==='goal'){check(x.questions.length===0&&exact(x.goal,['title','kind','target'])&&txt(x.goal.title,80)&&goalKinds.includes(x.goal.kind)&&txt(x.goal.target,120,0));}
 else check(x.goal===null&&(x.kind==='clarify'?x.questions.length>0:x.questions.length===0));return x;
}
// Build next turn only from exact displayed questions and explicit answers.
export function continueIntake(input,reply,answers){
 validateIntakeReply(reply,input);check(reply.kind==='clarify'&&Array.isArray(answers)&&answers.length===reply.questions.length&&input.turns.length+answers.length<=6);
 const turns=reply.questions.map((q,i)=>{check(txt(answers[i],500));return {...q,answer:answers[i]};});
 return validateIntakeInput({version:3,question:input.question,turns:[...clone(input.turns),...turns]});
}
// User-reviewed, editable text only. Never sets dates, doses or writes anything.
export function reviewedGoal(input,reply,confirmed){
 validateIntakeReply(reply,input);check(reply.kind==='goal'&&confirmed===true);return clone(reply.goal);
}
