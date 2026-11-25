// Browser and Node/WebCrypto compatible. Uses same independently-held recovery key as V11.14,
// but a distinct AAD/domain for synthetic structured diary data. Never send key or plaintext to D1.
import {validJournal} from './journal115.js';
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const b64=bytes=>{let v='';for(let i=0;i<bytes.length;i+=8192)v+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(v);};
const strictBase64=/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const unb64=str=>{if(typeof str!=='string'||!strictBase64.test(str))throw Error('B64_INVALIDO');return Uint8Array.from(atob(str),x=>x.charCodeAt(0));};
const derive=(master,salt)=>crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},master,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
const aad=owner=>enc.encode('asia-v1115-synthetic-domain-v1\0'+owner);
export async function encryptJournal(journal,master,owner){
 if(!validJournal(journal,owner))throw Error('DIARIO_INVALIDO');
 const data=enc.encode(JSON.stringify(journal));if(data.length>19000)throw Error('TAMANO_EXCEDIDO');
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await derive(master,salt),cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(owner)},key,data));
 return {format:'asia84-encrypted-v1',salt:b64(salt),iv:b64(iv),cipher:b64(cipher)};
}
export async function decryptJournal(envelope,master,owner){
 try{
  if(!envelope||Object.keys(envelope).sort().join(',')!=='cipher,format,iv,salt'||envelope.format!=='asia84-encrypted-v1')throw Error('FORMATO');
  const salt=unb64(envelope.salt),iv=unb64(envelope.iv),cipher=unb64(envelope.cipher);
  if(salt.length!==16||iv.length!==12||cipher.length<16||cipher.length>25000)throw Error('TAMANO');
  const key=await derive(master,salt),raw=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad(owner)},key,cipher);
  const journal=JSON.parse(dec.decode(raw));if(!validJournal(journal,owner))throw Error('OWNER');return journal;
 }catch{throw Error('CLAVE_O_DIARIO_INVALIDO');}
}
export async function sealDraft(base,proposed,master,owner){
 if(!validJournal(base,owner)||!validJournal(proposed,owner))throw Error('BORRADOR_INVALIDO');
 return {base:await encryptJournal(base,master,owner),proposed:await encryptJournal(proposed,master,owner)};
}
export async function openDraft(sealed,master,owner){
 if(!sealed||Object.keys(sealed).sort().join(',')!=='base,proposed')throw Error('BORRADOR_INVALIDO');
 return {base:await decryptJournal(sealed.base,master,owner),proposed:await decryptJournal(sealed.proposed,master,owner)};
}
