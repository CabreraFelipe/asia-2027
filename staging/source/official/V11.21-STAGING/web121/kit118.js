// V11.18 — independent offline rescue kit for the existing V11.13 recovery code.
// The data encryption key is NOT rotated. Cloudflare never receives the codes or kit plaintext.
// Kit and rescue code MUST be stored separately. Staging uses fictional data only.
import {newRecoveryCode,keyFromRecoveryCode} from '/v11.13/crypto.js';
export const KIT_FORMAT='asia-v1118-offline-rescue-kit-v1';
export const MAX_KIT_BYTES=4096;
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const ownerPattern=/^acct_[0-9a-f]{32}$/;
const codePattern=/^[A-Za-z0-9_-]{43}$/;
const validCode=code=>typeof code==='string'&&codePattern.test(code)&&b64url(unb64url(code))===code&&unb64url(code).length===32;
const b64=bytes=>btoa(String.fromCharCode(...bytes));
const unb64=str=>{if(typeof str!=='string'||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str))throw Error('B64_INVALIDO');return Uint8Array.from(atob(str),x=>x.charCodeAt(0));};
const b64url=b=>b64(b).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const unb64url=code=>unb64(code.replaceAll('-','+').replaceAll('_','/')+'=');
const own=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===keys.slice().sort().join(',');
const aad=owner=>enc.encode('asia-v1118-offline-rescue-kit-v1\0'+owner);
async function rescueAES(code,salt){
 const base=await crypto.subtle.importKey('raw',enc.encode(code),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function createRecoveryKit(originalCode,owner){
 if(!ownerPattern.test(owner||'')||!validCode(originalCode))throw Error('CUENTA_O_CODIGO_INVALIDO');
 // Reuse the original code as a nonextractable PBKDF2 key; this never exposes a stored CryptoKey.
 await keyFromRecoveryCode(originalCode);
 const rescueCode=newRecoveryCode();if(!validCode(rescueCode))throw Error('ALEATORIEDAD_INVALIDA');
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await rescueAES(rescueCode,salt);
 const plain=enc.encode(JSON.stringify({format:'asia-v1118-original-key-v1',accountId:owner,code:originalCode}));
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(owner)},key,plain));
 const json=JSON.stringify({format:KIT_FORMAT,accountId:owner,kdf:'PBKDF2-SHA256-600000',salt:b64(salt),iv:b64(iv),cipher:b64(cipher)},null,2);
 if(enc.encode(json).byteLength>MAX_KIT_BYTES)throw Error('KIT_DEMASIADO_GRANDE');
 return {json,rescueCode};
}
export async function openRecoveryKit(json,rescueCode,owner){
 // Distinguish malformed files/account mismatches; never disclose whether an unknown rescue code is close.
 if(!ownerPattern.test(owner||'')||typeof json!=='string'||enc.encode(json).byteLength>MAX_KIT_BYTES||json.length===0)throw Error('KIT_INVALIDO');
 let kit;try{kit=JSON.parse(json);}catch{throw Error('KIT_INVALIDO');}
 if(!own(kit,['format','accountId','kdf','salt','iv','cipher'])||kit.format!==KIT_FORMAT||kit.kdf!=='PBKDF2-SHA256-600000')throw Error('KIT_INVALIDO');
 if(kit.accountId!==owner)throw Error('CUENTA_DISTINTA');
 if(!validCode(rescueCode))throw Error('CODIGO_RESCATE_INVALIDO');
 try{
  const salt=unb64(kit.salt),iv=unb64(kit.iv),cipher=unb64(kit.cipher);
  if(salt.length!==16||iv.length!==12||cipher.length<16||cipher.length>512)throw Error('FORMATO');
  const key=await rescueAES(rescueCode,salt);
  const decrypted=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad(owner)},key,cipher);
  const item=JSON.parse(dec.decode(decrypted));
  if(!own(item,['format','accountId','code'])||item.format!=='asia-v1118-original-key-v1'||item.accountId!==owner||!validCode(item.code))throw Error('CONTENIDO');
  return keyFromRecoveryCode(item.code);
 }catch{throw Error('KIT_O_CODIGO_RESCATE_INVALIDO');}
}
