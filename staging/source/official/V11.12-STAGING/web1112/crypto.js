// V11.12: browser-side envelope compatible with Asia84 PBKDF2-HMAC-SHA256/AES-GCM.
// Only a randomly generated recovery code is accepted. No human password requirement.
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const b64=b=>{let v='';for(let i=0;i<b.length;i+=8192)v+=String.fromCharCode(...b.slice(i,i+8192));return btoa(v);};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const validId=id=>typeof id==='string'&&/^acct_[0-9a-f]{32}$/.test(id);
const codeRegex=/^[A-Za-z0-9_-]{43}$/;
export function newRecoveryCode(){const raw=new Uint8Array(32);crypto.getRandomValues(raw);return b64(raw).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export async function keyFromRecoveryCode(code){
 if(typeof code!=='string'||!codeRegex.test(code))throw Error('CODIGO_INVALIDO');
 const s=code.replaceAll('-','+').replaceAll('_','/');
 if(unb64(s+'=').length!==32)throw Error('CODIGO_INVALIDO');
 return crypto.subtle.importKey('raw',enc.encode(code),'PBKDF2',false,['deriveKey']);
}
async function derive(key,salt){return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},key,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
const kinds=Object.freeze({meal:'Comida ficticia',walk:'Caminata ficticia',rest:'Descanso ficticio',training:'Entrenamiento ficticio'});
export function validPayload(p,accountId){
 return validId(accountId)&&p&&typeof p==='object'&&!Array.isArray(p)&&p.format==='asia-v1112-demo-v1'&&p.owner===accountId&&Array.isArray(p.entries)&&p.entries.length<=20&&p.entries.every(x=>x&&typeof x==='object'&&Object.keys(x).sort().join('|')==='id|kind'&&typeof x.id==='string'&&/^[0-9a-f]{32}$/.test(x.id)&&Object.hasOwn(kinds,x.kind))&&new Set(p.entries.map(x=>x.id)).size===p.entries.length;
}
export const kinds1112=kinds;
export async function encryptDemo(payload,key,accountId){
 if(!validPayload(payload,accountId))throw Error('DATOS_FICTICIOS_INVALIDOS');
 const raw=enc.encode(JSON.stringify(payload));if(raw.length>15000)throw Error('LIMITE_DE_TAMANO');
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const aes=await derive(key,salt);const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},aes,raw));
 return {format:'asia84-encrypted-v1',salt:b64(salt),iv:b64(iv),cipher:b64(cipher)};
}
export async function decryptDemo(envelope,key,accountId){
 try{
  if(!envelope||Object.keys(envelope).sort().join('|')!=='cipher|format|iv|salt'||envelope.format!=='asia84-encrypted-v1')throw Error('ENVELOPE');
  const salt=unb64(envelope.salt),iv=unb64(envelope.iv),cipher=unb64(envelope.cipher);
  if(salt.length!==16||iv.length!==12||cipher.length<16||cipher.length>15000)throw Error('SIZE');
  const aes=await derive(key,salt),raw=await crypto.subtle.decrypt({name:'AES-GCM',iv},aes,cipher);
  const payload=JSON.parse(dec.decode(raw));if(!validPayload(payload,accountId))throw Error('OWNER');
  return payload;
 }catch{throw Error('CLAVE_O_COPIA_INVALIDA');}
}
export function blankPayload(accountId){if(!validId(accountId))throw Error('CUENTA_INVALIDA');return {format:'asia-v1112-demo-v1',owner:accountId,entries:[]};}
export function nextSyntheticEntry(payload,kind){
 if(!Object.hasOwn(kinds,kind))throw Error('TIPO_INVALIDO');
 if(payload.entries.length>=20)throw Error('MAX_ENTRADAS');
 const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
 return {...payload,entries:[...payload.entries,{id,kind}]};
}
