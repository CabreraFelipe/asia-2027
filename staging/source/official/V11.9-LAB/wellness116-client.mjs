// Asia Platform V11.6 - synthetic wellness client only: NO network, no real Apple Health,
// no push delivery. The user-agent encrypts synthetic metrics and synthetic endpoint material.
export const HEALTH_FORMAT116='asia116-health-encrypted-v1';
export const PUSH_FORMAT116='asia116-push-encrypted-v1';
export const DEVICE_RE116=/^dev_[0-9a-f]{32}$/;
export const REMINDER_RE116=/^rem_[0-9a-f]{24}$/;
const te=new TextEncoder(),td=new TextDecoder('utf-8',{fatal:true});
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(o,keys)=>obj(o)&&Object.keys(o).sort().join('|')===keys.slice().sort().join('|');
const num=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const integer=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const hex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const base64=bytes=>btoa(String.fromCharCode(...bytes));
const un64=str=>Uint8Array.from(atob(str),c=>c.charCodeAt(0));
const b64check=s=>typeof s==='string'&&s.length%4===0&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s);
export const freshDeviceId116=()=> 'dev_'+hex(crypto.getRandomValues(new Uint8Array(16)));
export const freshReminderId116=()=> 'rem_'+hex(crypto.getRandomValues(new Uint8Array(12)));
export function validateHealthState116(s){
 if(!exact(s,['schema','samples'])||s.schema!==116||!Array.isArray(s.samples)||s.samples.length>31)return false;
 const seen=new Set();
 for(const x of s.samples){
  if(!exact(x,['day','source','steps','sleepMinutes','restingHeartRate','hrvMs'])||!date(x.day)||!['synthetic-healthkit','synthetic-healthconnect'].includes(x.source)||!integer(x.steps,0,100000)||!integer(x.sleepMinutes,0,1440)||!integer(x.restingHeartRate,25,220)||!num(x.hrvMs,0,400)||seen.has(x.day))return false;
  seen.add(x.day);
 }
 return true;
}
function validateSyntheticSubscription116(s){
 if(!exact(s,['endpoint','p256dh','auth']))return false;
 if(typeof s.endpoint!=='string'||s.endpoint.length>250||typeof s.p256dh!=='string'||typeof s.auth!=='string')return false;
 try{const u=new URL(s.endpoint);return u.protocol==='https:'&&u.hostname==='push.example.invalid'&&!u.username&&!u.password&&!u.hash&&!u.search&&/^\/synthetic\/[a-z0-9_-]{5,70}$/.test(u.pathname)&&/^[A-Za-z0-9_-]{8,128}$/.test(s.p256dh)&&/^[A-Za-z0-9_-]{8,128}$/.test(s.auth);}catch{return false;}
}
export function fakePushSubscription116(deviceId){
 if(!DEVICE_RE116.test(deviceId))throw Error('INVALID_DEVICE_ID');
 // This domain is intentionally reserved for examples. No actual push subscription accepted.
 return {endpoint:`https://push.example.invalid/synthetic/${deviceId}`,p256dh:'syntheticKey_0123456789ABCDEF',auth:'syntheticAuth_0123456789'};
}
export function validateEnvelope116(e,format){
 if(!exact(e,['format','salt','iv','cipher'])||e.format!==format||![HEALTH_FORMAT116,PUSH_FORMAT116].includes(format)||!b64check(e.salt)||e.salt.length!==24||!b64check(e.iv)||e.iv.length!==16||!b64check(e.cipher)||e.cipher.length<24||e.cipher.length>280000)return false;
 try{return un64(e.salt).length===16&&un64(e.iv).length===12&&un64(e.cipher).length>=16;}catch{return false;}
}
async function derive(phrase,salt){
 if(typeof phrase!=='string'||phrase.length<16||phrase.length>200)throw Error('LAB_PASSPHRASE_REQUIRED');
 const base=await crypto.subtle.importKey('raw',te.encode(phrase),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:150000},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function seal(data,deviceId,phrase,format){
 if(!DEVICE_RE116.test(deviceId))throw Error('INVALID_DEVICE_ID');
 if(format===HEALTH_FORMAT116&&!validateHealthState116(data))throw Error('INVALID_HEALTH_STATE');
 if(format===PUSH_FORMAT116&&!validateSyntheticSubscription116(data))throw Error('INVALID_SYNTHETIC_SUBSCRIPTION');
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const raw=te.encode(JSON.stringify(data));if(raw.byteLength>175000)throw Error('LAB_PAYLOAD_TOO_LARGE');
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:te.encode(`${format}:${deviceId}`)},await derive(phrase,salt),raw));
 const env={format,salt:base64(salt),iv:base64(iv),cipher:base64(cipher)};
 if(!validateEnvelope116(env,format))throw Error('LAB_PAYLOAD_TOO_LARGE');return env;
}
async function unseal(env,deviceId,phrase,format,validate){
 if(!DEVICE_RE116.test(deviceId)||!validateEnvelope116(env,format))throw Error('INVALID_ENVELOPE');
 try{
  const key=await derive(phrase,un64(env.salt));
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(env.iv),additionalData:te.encode(`${format}:${deviceId}`)},key,un64(env.cipher));
  const data=JSON.parse(td.decode(plain));if(!validate(data))throw Error('Invalid data');return data;
 }catch{throw Error('DECRYPT_OR_INTEGRITY_FAILED');}
}
export const encryptHealth116=(data,id,pass)=>seal(data,id,pass,HEALTH_FORMAT116);
export const decryptHealth116=(env,id,pass)=>unseal(env,id,pass,HEALTH_FORMAT116,validateHealthState116);
export async function encryptSyntheticPush116(data,id,pass){
 const envelope=await seal(data,id,pass,PUSH_FORMAT116);
 const fingerprint=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(data.endpoint))));
 return {fingerprint,envelope};
}
export const decryptSyntheticPush116=(env,id,pass)=>unseal(env,id,pass,PUSH_FORMAT116,validateSyntheticSubscription116);
