// V11.16: restore existing V11.15 synthetic encrypted archives to the SAME verified Google account.
// The server never receives a recovery code or plaintext. No destructive update, delete or cross-account migration.
import {decryptJournal} from '/v11.15/crypto115.js';
import {blankJournal,validJournal,summary} from '/v11.15/journal115.js';
export const MAX_ARCHIVE_BYTES=900000;
export const ARCHIVE_FORMAT='asia-v1115-domain-archive-v1';
const own=(x,names)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===names.slice().sort().join(',');
const envelopeOk=x=>own(x,['format','salt','iv','cipher'])&&x.format==='asia84-encrypted-v1'&&['salt','iv','cipher'].every(k=>typeof x[k]==='string');
export const sameEnvelope=(a,b)=>envelopeOk(a)&&envelopeOk(b)&&['format','salt','iv','cipher'].every(k=>a[k]===b[k]);
const eqEntry=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function appendOnly(before,after){
 if(!validJournal(before,before.owner)||!validJournal(after,before.owner)||after.entries.length!==before.entries.length+1)return false;
 for(let i=0;i<before.entries.length;i++)if(!eqEntry(before.entries[i],after.entries[i]))return false;
 return true;
}
export async function verifyArchive(text,master,owner){
 if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>MAX_ARCHIVE_BYTES||!master)throw Error('ARCHIVO_DEMASIADO_GRANDE_O_CLAVE_AUSENTE');
 let file;try{file=JSON.parse(text);}catch{throw Error('ARCHIVO_JSON_INVALIDO');}
 if(!own(file,['format','accountId','head','history'])||file.format!==ARCHIVE_FORMAT)throw Error('FORMATO_NO_COMPATIBLE_V11_15');
 if(file.accountId!==owner||!/^acct_[0-9a-f]{32}$/.test(owner||''))throw Error('ARCHIVO_DE_OTRA_CUENTA');
 if(!Number.isInteger(file.head)||file.head<1||file.head>30||!Array.isArray(file.history)||file.history.length!==file.head)throw Error('HISTORIAL_INCOMPLETO');
 let previous=blankJournal(owner);
 for(let index=0;index<file.history.length;index++){
  const row=file.history[index];
  if(!own(row,['revision','envelope'])||row.revision!==index+1||!envelopeOk(row.envelope))throw Error('REVISION_NO_CONTIGUA_O_INVALIDA');
  const current=await decryptJournal(row.envelope,master,owner);
  if(!appendOnly(previous,current))throw Error('HISTORIAL_NO_ADITIVO');
  previous=current;
 }
 // Keep encrypted envelopes only; no decrypted journal stored in long-lived UI state.
 return {accountId:owner,head:file.head,history:file.history.map(row=>({revision:row.revision,envelope:row.envelope})),overview:summary(previous)};
}
const requireOk=(response,label)=>{if(!response||response.ok!==true||!Number.isInteger(response.head)||response.head<0||response.head>30)throw Error(label);return response;};
async function oneRevision(verified,revision,read){
 const cloud=await read(revision);
 if(!cloud||!cloud.ok||cloud.revision!==revision||!sameEnvelope(cloud.envelope,verified.history[revision-1].envelope))throw Error('NUBE_DIVERGENTE_EN_REVISION_'+revision);
}
async function prefix(verified,limit,read){
 for(let revision=1;revision<=limit;revision++)await oneRevision(verified,revision,read);
}
export async function restoreArchive(verified,{index,read,post}){
 if(!verified||!Number.isInteger(verified.head)||verified.head<1||verified.head>30||verified.history?.length!==verified.head||typeof index!=='function'||typeof read!=='function'||typeof post!=='function')throw Error('ARCHIVO_NO_VALIDADO');
 const current=requireOk(await index(),'INDICE_NUBE_INVALIDO');
 await prefix(verified,Math.min(current.head,verified.head),read);
 if(current.head>=verified.head)return {status:current.head===verified.head?'YA_RESTAURADO':'NUBE_MAS_RECIENTE',written:0,cloudHead:current.head};
 let written=0;
 for(let rev=current.head+1;rev<=verified.head;rev++){
  const response=await post(rev-1,verified.history[rev-1].envelope);
  if(response?.status===409){
   // An interrupted write or a concurrent identical import may have succeeded.
   // ONLY accept the exact archived ciphertext; never retry or merge divergent data.
   await oneRevision(verified,rev,read);
   continue;
  }
  if(!response||!response.ok||response.revision!==rev)throw Error('RECUPERACION_INCOMPLETA_REV_'+rev);
  await oneRevision(verified,rev,read);
  written++;
 }
 const final=requireOk(await index(),'INDICE_FINAL_NO_DISPONIBLE');
 if(final.head<verified.head)throw Error('RECUPERACION_INCOMPLETA');
 await prefix(verified,verified.head,read);
 return {status:'RESTAURADO',written,cloudHead:final.head};
}
