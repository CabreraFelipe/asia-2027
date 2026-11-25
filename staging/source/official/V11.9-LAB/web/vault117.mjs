// Asia Platform V11.7 — encrypted, synthetic, offline browser laboratory.
// NOT public authentication. Browser-origin storage is not a security boundary.
import {validateCoachState115,prepareCoachRequest115,approveMemory115,GRANTS115} from '../coach115-client.mjs';
import {validateHealthState116} from '../wellness116-client.mjs';
export const VERSION117='11.7';
export const DB_NAME117='asia-v117-demo-only';
const FMT='asia117-browser-vault-v1', CHECK='asia117-lab-verifier';
const e=new TextEncoder(),d=new TextDecoder('utf-8',{fatal:true});
const clone=x=>structuredClone(x);
const fail=s=>{throw Error(s);};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(x,k)=>plain(x)&&Object.keys(x).sort().join('|')===k.slice().sort().join('|');
const b64=bytes=>{let value='';for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(value);};
const un64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const validB64=s=>typeof s==='string'&&s.length%4===0&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s);
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const newId=prefix=>prefix+hex(crypto.getRandomValues(new Uint8Array(16)));
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
export const initial117=()=>({schema:117,entries:[],coach:{schema:115,messages:[],memories:[]},health:{schema:116,samples:[]},grants:Object.fromEntries(GRANTS115.map(k=>[k,false]))});
export function validState117(x){
 if(!exact(x,['schema','entries','coach','health','grants'])||x.schema!==117||!Array.isArray(x.entries)||x.entries.length>60)return false;
 if(!x.entries.every(z=>exact(z,['id','day','kind','text'])&&/^entry_[0-9a-f]{32}$/.test(z.id)&&date(z.day)&&['nutrition','training','note'].includes(z.kind)&&typeof z.text==='string'&&z.text.length>=1&&z.text.length<=240&&z.text.trim()))return false;
 if(new Set(x.entries.map(z=>z.id)).size!==x.entries.length)return false;
 return validateCoachState115(x.coach)&&validateHealthState116(x.health)&&exact(x.grants,GRANTS115)&&GRANTS115.every(k=>typeof x.grants[k]==='boolean');
}
export function validEnvelope117(v){
 if(!exact(v,['format','iv','cipher'])||v.format!==FMT||!validB64(v.iv)||!validB64(v.cipher)||v.cipher.length>160000)return false;
 try{return un64(v.iv).length===12&&un64(v.cipher).length>=16;}catch{return false;}
}
const aad=(id,kind,revision)=>e.encode(`${FMT}|${id}|${kind}|${revision}`);
async function derive(phrase,salt){
 if(typeof phrase!=='string'||phrase.length<16||phrase.length>200)fail('DEMO_PHRASE_LENGTH');
 const base=await crypto.subtle.importKey('raw',e.encode(phrase),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:160000},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function seal(data,key,id,kind,revision){
 const bytes=e.encode(JSON.stringify(data));if(bytes.byteLength>85000)fail('DEMO_LIMIT');
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(id,kind,revision)},key,bytes));
 return {format:FMT,iv:b64(iv),cipher:b64(cipher)};
}
async function open(env,key,id,kind,revision){
 if(!validEnvelope117(env))fail('DEMO_INTEGRITY_FAILED');
 try{
  const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(env.iv),additionalData:aad(id,kind,revision)},key,un64(env.cipher));
  return JSON.parse(d.decode(bytes));
 }catch{fail('DEMO_INTEGRITY_FAILED');}
}
const validId=x=>typeof x==='string'&&/^demo_[0-9a-f]{32}$/.test(x);
const validDraftId=x=>typeof x==='string'&&/^draft_[0-9a-f]{32}$/.test(x);
const validRev=x=>Number.isSafeInteger(x)&&x>=0&&x<=100;
export class MemoryStore117 {
 constructor(){this.accounts=new Map();this.heads=new Map();this.versions=new Map();this.drafts=new Map();}
 async listAccounts(){return clone([...this.accounts.values()].map(({id,label,createdAt})=>({id,label,createdAt})));}
 async addAccount(meta){if(this.accounts.has(meta.id))fail('ACCOUNT_EXISTS');this.accounts.set(meta.id,clone(meta));}
 async getAccount(id){return clone(this.accounts.get(id)??null);}
 async getHead(id){return clone(this.heads.get(id)??null);}
 async commit(id,expected,record,draft){
  const old=this.heads.get(id),rev=old?.revision??0;
  if(rev!==expected){if(draft)this.drafts.set(draft.id,clone(draft));return {status:'CONFLICT',head:rev,draftId:draft?.id??null};}
  if(rev>=100)fail('REVISION_LIMIT');
  const row=clone({id,revision:rev+1,envelope:record.envelope,createdAt:record.createdAt});
  this.heads.set(id,row);this.versions.set(`${id}:${rev+1}`,row);
  return {status:'SAVED',revision:rev+1};
 }
 async getVersion(id,rev){return clone(this.versions.get(`${id}:${rev}`)??null);}
 async versionsFor(id){return clone([...this.versions.values()].filter(r=>r.id===id).sort((a,b)=>b.revision-a.revision));}
 async draftsFor(id){return clone([...this.drafts.values()].filter(r=>r.accountId===id));}
 async getDraft(id,accountId){const v=this.drafts.get(id);return clone(v?.accountId===accountId?v:null);}
}
const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
export class IDBStore117 {
 constructor(db){this.db=db;}
 static async open(){
  if(!('indexedDB' in globalThis))fail('INDEXEDDB_UNAVAILABLE');
  const db=await new Promise((resolve,reject)=>{
   const r=indexedDB.open(DB_NAME117,1);
   r.onupgradeneeded=()=>{
    const db=r.result;
    db.createObjectStore('accounts',{keyPath:'id'});
    db.createObjectStore('heads',{keyPath:'id'});
    const vers=db.createObjectStore('versions',{keyPath:['id','revision']});vers.createIndex('byAccount','id');
    const drafts=db.createObjectStore('drafts',{keyPath:'id'});drafts.createIndex('byAccount','accountId');
   };
   r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('INDEXEDDB_BLOCKED'));
  });
  return new IDBStore117(db);
 }
 async listAccounts(){const tx=this.db.transaction('accounts');const rows=await request(tx.objectStore('accounts').getAll());return rows.map(({id,label,createdAt})=>({id,label,createdAt}));}
 async addAccount(meta){const tx=this.db.transaction('accounts','readwrite');await request(tx.objectStore('accounts').add(meta));}
 async getAccount(id){const tx=this.db.transaction('accounts');return (await request(tx.objectStore('accounts').get(id)))??null;}
 async getHead(id){const tx=this.db.transaction('heads');return (await request(tx.objectStore('heads').get(id)))??null;}
 async commit(id,expected,record,draft){
  return new Promise((resolve,reject)=>{
   let outcome;
   const tx=this.db.transaction(['heads','versions','drafts'],'readwrite');
   tx.oncomplete=()=>resolve(outcome);tx.onerror=()=>reject(tx.error??Error('IDB_ERROR'));tx.onabort=()=>reject(tx.error??Error('IDB_ABORT'));
   const heads=tx.objectStore('heads'),get=heads.get(id);
   get.onsuccess=()=>{
    const rev=get.result?.revision??0;
    if(rev!==expected){if(draft)tx.objectStore('drafts').put(draft);outcome={status:'CONFLICT',head:rev,draftId:draft?.id??null};return;}
    if(rev>=100){tx.abort();return;}
    const row={id,revision:rev+1,envelope:record.envelope,createdAt:record.createdAt};
    heads.put(row);tx.objectStore('versions').put(row);outcome={status:'SAVED',revision:rev+1};
   };
  });
 }
 async getVersion(id,rev){const tx=this.db.transaction('versions');return (await request(tx.objectStore('versions').get([id,rev])))??null;}
 async versionsFor(id){const tx=this.db.transaction('versions');const rows=await request(tx.objectStore('versions').index('byAccount').getAll(id));return rows.sort((a,b)=>b.revision-a.revision);}
 async draftsFor(id){const tx=this.db.transaction('drafts');return await request(tx.objectStore('drafts').index('byAccount').getAll(id));}
 async getDraft(id,accountId){const tx=this.db.transaction('drafts');const row=await request(tx.objectStore('drafts').get(id));return row?.accountId===accountId?row:null;}
}
export class Platform117 {
 #store;#account=null;#key=null;#state=null;#revision=0;#dirty=false;
 constructor(store){if(!store||!['listAccounts','addAccount','getAccount','getHead','commit','getVersion','versionsFor','draftsFor','getDraft'].every(k=>typeof store[k]==='function'))fail('STORE_REQUIRED');this.#store=store;}
 get session(){return this.#account?Object.freeze({id:this.#account.id,label:this.#account.label,revision:this.#revision,dirty:this.#dirty}):null;}
 get state(){return this.#state?clone(this.#state):null;}
 listAccounts(){return this.#store.listAccounts();}
 async createAccount(label,phrase){
  if(typeof label!=='string'||label.trim().length<1||label.trim().length>32||/[\u0000-\u001f<>]/.test(label))fail('INVALID_DEMO_LABEL');
  const names=await this.#store.listAccounts();if(names.length>=8)fail('DEMO_ACCOUNT_LIMIT');
  if(names.some(x=>x.label.toLowerCase()===label.trim().toLowerCase()))fail('LABEL_EXISTS');
  const id=newId('demo_'),salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await derive(phrase,salt);const verifier=await seal({check:CHECK},key,id,'verifier',0);
  await this.#store.addAccount({id,label:label.trim(),createdAt:new Date().toISOString(),salt:b64(salt),verifier});
  return {id,label:label.trim()};
 }
 async unlock(id,phrase){
  this.lock();if(!validId(id))fail('INVALID_ACCOUNT');
  const account=await this.#store.getAccount(id);if(!account||!validB64(account.salt)||un64(account.salt).length!==16)fail('INVALID_ACCOUNT');
  const key=await derive(phrase,un64(account.salt));
  const v=await open(account.verifier,key,id,'verifier',0);if(!exact(v,['check'])||v.check!==CHECK)fail('DEMO_INTEGRITY_FAILED');
  const head=await this.#store.getHead(id);let state=initial117(),revision=0;
  if(head){if(!validRev(head.revision)||head.revision===0)fail('INVALID_REVISION');state=await open(head.envelope,key,id,'vault',head.revision);if(!validState117(state))fail('DEMO_INTEGRITY_FAILED');revision=head.revision;}
  this.#key=key;this.#account={id,label:account.label};this.#state=state;this.#revision=revision;this.#dirty=false;
  return this.session;
 }
 lock(){this.#key=null;this.#account=null;this.#state=null;this.#revision=0;this.#dirty=false;}
 #require(){if(!this.#account||!this.#key||!this.#state)fail('DEMO_LOCKED');}
 async reload(){
  this.#require();if(this.#dirty)fail('DRAFT_PRESERVED_REQUIRES_RELOCK');
  const id=this.#account.id,head=await this.#store.getHead(id);
  if(head){const x=await open(head.envelope,this.#key,id,'vault',head.revision);if(!validState117(x))fail('DEMO_INTEGRITY_FAILED');this.#state=x;this.#revision=head.revision;}
  else{this.#state=initial117();this.#revision=0;}
  return this.session;
 }
 async #mutate(fn){
  this.#require();if(this.#dirty)fail('DRAFT_PRESERVED_REQUIRES_RELOCK');
  const candidate=clone(this.#state);fn(candidate);if(!validState117(candidate))fail('INVALID_DEMO_STATE');
  const rev=this.#revision,id=this.#account.id,stamp=new Date().toISOString();
  const envelope=await seal(candidate,this.#key,id,'vault',rev+1);
  const draftId=newId('draft_');const draft={id:draftId,accountId:id,expectedRevision:rev,createdAt:stamp,envelope:await seal(candidate,this.#key,id,'draft',0)};
  const outcome=await this.#store.commit(id,rev,{envelope,createdAt:stamp},draft);
  if(outcome.status==='SAVED'){this.#state=candidate;this.#revision=outcome.revision;return outcome;}
  this.#state=candidate;this.#dirty=true;return {...outcome,draftPreserved:true};
 }
 addEntry({day,kind,text}){
  if(!date(day)||!['nutrition','training','note'].includes(kind)||typeof text!=='string'||!text.trim()||text.trim().length>240)fail('INVALID_ENTRY');
  return this.#mutate(s=>{if(s.entries.length>=60)fail('ENTRY_QUOTA');s.entries.push({id:newId('entry_'),day,kind,text:text.trim()});});
 }
 addSyntheticHealth(day){
  if(!date(day))fail('INVALID_DATE');
  return this.#mutate(s=>{
   if(s.health.samples.some(v=>v.day===day))fail('SAMPLE_ALREADY_EXISTS');if(s.health.samples.length>=31)fail('HEALTH_QUOTA');
   s.health.samples.push({day,source:'synthetic-healthkit',steps:8123,sleepMinutes:445,restingHeartRate:61,hrvMs:44.2});
  });
 }
 setCoachGrant(grant,allowed){
  if(!GRANTS115.includes(grant)||typeof allowed!=='boolean')fail('INVALID_GRANT');
  return this.#mutate(s=>{s.grants[grant]=allowed;});
 }
 addApprovedMemory(note,day){
  if(typeof note!=='string'||!note.trim()||note.length>500||!date(day))fail('INVALID_MEMORY');
  const memory=approveMemory115(note.trim(),{approved:true,id:'mem_'+newId('').slice(0,20),at:day});
  return this.#mutate(s=>{if(s.coach.memories.length>=30)fail('MEMORY_QUOTA');s.coach.memories.push(memory);});
 }
 prepareCoachPreview(question){
  this.#require();const s=this.#state;
  const sample=s.health.samples.at(-1);
  const snapshot=sample?{health:{day:sample.day,sleepHours:Number((sample.sleepMinutes/60).toFixed(2)),restingHeartRate:sample.restingHeartRate,hrvMs:sample.hrvMs}}:{};
  return prepareCoachRequest115({question,grants:s.grants,snapshot,history:s.coach.messages.slice(-6),memories:s.coach.memories.slice(-10)});
 }
 addCoachQuestion(question,day){
  if(typeof question!=='string'||!question.trim()||question.length>1000||!date(day))fail('INVALID_QUESTION');
  return this.#mutate(s=>{if(s.coach.messages.length>=80)fail('COACH_QUOTA');s.coach.messages.push({id:'msg_'+newId('').slice(0,20),role:'user',text:question.trim(),at:day});});
 }
 async versions(){this.#require();return (await this.#store.versionsFor(this.#account.id)).map(({revision,createdAt})=>({revision,createdAt}));}
 async drafts(){this.#require();return (await this.#store.draftsFor(this.#account.id)).map(({id,expectedRevision,createdAt})=>({id,expectedRevision,createdAt}));}
 async viewDraft(id){this.#require();if(!validDraftId(id))fail('INVALID_DRAFT');const row=await this.#store.getDraft(id,this.#account.id);if(!row)fail('NO_DRAFT');const value=await open(row.envelope,this.#key,this.#account.id,'draft',0);if(!validState117(value))fail('DEMO_INTEGRITY_FAILED');return value;}
 async restore(revision,{confirmed=false}={}){
  this.#require();if(!confirmed)fail('CONFIRMATION_REQUIRED');if(this.#dirty)fail('DRAFT_PRESERVED_REQUIRES_RELOCK');
  if(!Number.isSafeInteger(revision)||revision<1||revision>=this.#revision)fail('NOT_AN_OLDER_REVISION');
  const row=await this.#store.getVersion(this.#account.id,revision);if(!row)fail('NO_VERSION');
  const old=await open(row.envelope,this.#key,this.#account.id,'vault',revision);if(!validState117(old))fail('DEMO_INTEGRITY_FAILED');
  return this.#mutate(s=>{Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,old);});
 }
 async exportEncrypted(){
  this.#require();const row=await this.#store.getHead(this.#account.id);if(!row)return null;
  const account=await this.#store.getAccount(this.#account.id);
  return {format:'asia117-demo-export-v1',accountId:this.#account.id,revision:row.revision,salt:account.salt,envelope:row.envelope};
 }
}
