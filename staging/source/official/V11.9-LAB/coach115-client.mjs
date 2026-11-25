// V11.5: LOCAL-ONLY client prototype; no persistence, fetch, user ID, or external AI.
// Explicit, per-request grants. No photos, raw Health dumps, personal notes, or secrets.
export const GRANTS115=Object.freeze(['nutrition','training','health','goals','chatHistory','memory']);
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.getPrototypeOf(o)===Object.prototype&&Object.keys(o).sort().join('|')===keys.slice().sort().join('|');
const plain=o=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.getPrototypeOf(o)===Object.prototype;
const copy=o=>JSON.parse(JSON.stringify(o));
const fail=s=>{throw Error(s)};
const safeString=(s,max)=>typeof s==='string'&&s.length>0&&s.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s);
const asNumber=(n,lo,hi)=>typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi?n:null;
const today=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const fields={
 nutrition:{day:x=>today(x)?x:null,kcal:x=>asNumber(x,0,9000),proteinG:x=>asNumber(x,0,900),complete:x=>typeof x==='boolean'?x:null},
 training:{day:x=>today(x)?x:null,completedSessions7d:x=>asNumber(x,0,14),validSets7d:x=>asNumber(x,0,350),trendPct:x=>asNumber(x,-100,300)},
 health:{day:x=>today(x)?x:null,sleepHours:x=>asNumber(x,0,24),restingHeartRate:x=>asNumber(x,25,220),hrvMs:x=>asNumber(x,0,400),energyRating:x=>asNumber(x,1,5)},
 goals:{energyTarget:x=>asNumber(x,1200,4500),proteinTarget:x=>asNumber(x,40,250),stepsTarget:x=>asNumber(x,0,50000)}
};
function controlledSnapshot(raw,grants){
 const output={};
 for(const cat of ['nutrition','training','health','goals']){
  if(!grants[cat])continue;
  const row=raw?.[cat];if(!plain(row))continue;
  const clean={};
  for(const [k,validate] of Object.entries(fields[cat])){
   if(Object.hasOwn(row,k)){const val=validate(row[k]);if(val!==null)clean[k]=val;}
  }
  if(Object.keys(clean).length)output[cat]=clean;
 }
 return output;
}
function validThread(t){return exact(t,['id','role','text','at'])&&/^[a-zA-Z0-9_-]{8,40}$/.test(t.id)&&['user','assistant'].includes(t.role)&&safeString(t.text,1500)&&today(t.at);}
function validMemory(m){return exact(m,['id','note','approvedAt'])&&/^[a-zA-Z0-9_-]{8,40}$/.test(m.id)&&safeString(m.note,500)&&today(m.approvedAt);}
export function validateCoachState115(state){
 if(!exact(state,['schema','messages','memories'])||state.schema!==115||!Array.isArray(state.messages)||!Array.isArray(state.memories)||state.messages.length>80||state.memories.length>30)return false;
 if(!state.messages.every(validThread)||!state.memories.every(validMemory))return false;
 const ids=[...state.messages,...state.memories].map(x=>x.id);
 return new Set(ids).size===ids.length;
}
export function prepareCoachRequest115({question,grants={},snapshot={},history=[],memories=[]}={}){
 if(!safeString(question,1000)||!question.trim())fail('QUESTION_REQUIRED');
 if(!plain(grants)||Object.keys(grants).some(x=>!GRANTS115.includes(x)||typeof grants[x]!=='boolean'))fail('INVALID_PERMISSIONS');
 // A false or missing per-request grant means zero data of that category goes out.
 if(!plain(snapshot))fail('INVALID_SNAPSHOT');
 const useHistory=grants.chatHistory===true, useMemory=grants.memory===true;
 if(!Array.isArray(history)||!Array.isArray(memories))fail('INVALID_CONTEXT');
 if(useHistory&&(history.length>6||history.some(t=>!validThread(t))))fail('INVALID_HISTORY');
 if(useMemory&&(memories.length>10||memories.some(t=>!validMemory(t))))fail('INVALID_MEMORY');
 const context=controlledSnapshot(snapshot,grants);
 const filteredHistory=useHistory?history.map(({role,text})=>({role,text})):[];
 const approvedMemories=useMemory?memories.map(({note})=>({note})):[];
 const permissions=Object.fromEntries(GRANTS115.map(x=>[x,grants[x]===true]));
 return {question,permissions,context,conversation:filteredHistory,memory:approvedMemories,externalAIEnabled:false};
}
// Separate explicit memory-save intent; a chat or its grants NEVER implies memory storage.
export function approveMemory115(note,{approved=false,at='2026-11-23',id}={}){
 if(approved!==true)fail('EXPLICIT_MEMORY_SAVE_REQUIRED');
 const entry={id,note,approvedAt:at};if(!validMemory(entry))fail('INVALID_MEMORY');
 return Object.freeze(entry);
}
// Local AES-256-GCM with PBKDF2-SHA256 for synthetic example only. Passphrase never leaves device.
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const b64=x=>btoa(String.fromCharCode(...x));
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const b64valid=s=>typeof s==='string'&&s.length%4===0&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s);
export const FORMAT115='asia115-coach-encrypted-v1';
export function validateCoachEnvelope115(v){
 if(!exact(v,['format','salt','iv','cipher'])||v.format!==FORMAT115||!b64valid(v.salt)||v.salt.length!==24||!b64valid(v.iv)||v.iv.length!==16||!b64valid(v.cipher)||v.cipher.length<24||v.cipher.length>680000)return false;
 try{return unb64(v.salt).length===16&&unb64(v.iv).length===12&&unb64(v.cipher).length>=16;}catch{return false;}
}
async function derive(phrase,salt){
 if(typeof phrase!=='string'||phrase.length<16||phrase.length>200)fail('LAB_PASSPHRASE_REQUIRED');
 const base=await crypto.subtle.importKey('raw',enc.encode(phrase),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:150000},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function encryptCoachState115(state,phrase){
 if(!validateCoachState115(state))fail('INVALID_COACH_STATE');
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await derive(phrase,salt);
 const bytes=enc.encode(JSON.stringify(state));if(bytes.byteLength>400000)fail('LAB_ARCHIVE_TOO_LARGE');
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(FORMAT115)},key,bytes));
 const result={format:FORMAT115,salt:b64(salt),iv:b64(iv),cipher:b64(cipher)};
 if(!validateCoachEnvelope115(result))fail('LAB_ARCHIVE_TOO_LARGE');
 return result;
}
export async function decryptCoachState115(envelope,phrase){
 if(!validateCoachEnvelope115(envelope))fail('INVALID_COACH_ENVELOPE');
 try{
  const salt=unb64(envelope.salt),iv=unb64(envelope.iv),cipher=unb64(envelope.cipher);
  const key=await derive(phrase,salt),raw=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:enc.encode(FORMAT115)},key,cipher);
  const state=JSON.parse(dec.decode(raw));if(!validateCoachState115(state))throw Error();
  return copy(state);
 }catch{fail('COACH_DECRYPT_OR_INTEGRITY_FAILED');}
}
