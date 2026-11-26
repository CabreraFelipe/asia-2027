// V11.50 foundation only. Not exposed by any route or enabled in the pilot.
// Account key = random secret compatible with existing encrypt84/decrypt84.
// KEK is an independent, versioned server secret; never derive from Google identity.
const check=(ok,m)=>{if(!ok)throw Error(m)};
const accountOK=s=>typeof s==='string'&&/^acct_[a-f0-9]{32}$/.test(s);
const idOK=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,48}$/.test(s);
const encode=a=>{let s='';for(const b of a)s+=String.fromCharCode(b);return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')};
function decode(s,n){check(typeof s==='string'&&s.length===Math.ceil(n*8/6)&&/^[A-Za-z0-9_-]+$/.test(s),'Formato de clave inválido');const x=Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));check(x.length===n&&encode(x)===s,'Formato de clave inválido');return x}
const random=n=>crypto.getRandomValues(new Uint8Array(n));
const aad=(accountId,kekId)=>new TextEncoder().encode(JSON.stringify(['asia-account-key-v1',accountId,kekId]));
export const generateAccountSecret=()=>encode(random(32));
export async function importWrappingKey(secret){const bytes=decode(secret,32);try{return await crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt'])}finally{bytes.fill(0)}}
export async function wrapAccountSecret({accountId,kekId,key,secret}){
 check(accountOK(accountId)&&idOK(kekId),'Identidad de clave inválida');const bytes=decode(secret,32),iv=random(12);
 try{const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(accountId,kekId),tagLength:128},key,bytes));return {format:'asia-account-key-v1',kekId,iv:encode(iv),cipher:encode(cipher)}}finally{bytes.fill(0)}
}
export async function unwrapAccountSecret({accountId,kekId,key,envelope}){
 check(accountOK(accountId)&&idOK(kekId)&&envelope&&Object.keys(envelope).sort().join(',')==='cipher,format,iv,kekId'&&envelope.format==='asia-account-key-v1'&&envelope.kekId===kekId,'Envoltura inválida');
 const iv=decode(envelope.iv,12),cipher=decode(envelope.cipher,48);
 let raw;try{raw=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad(accountId,kekId),tagLength:128},key,cipher));check(raw.length===32,'Clave inválida');return encode(raw)}catch{throw Error('No se pudo verificar la clave de cuenta')}finally{raw?.fill(0)}
}
