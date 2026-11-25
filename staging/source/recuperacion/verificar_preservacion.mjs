// Pure comparison of two V10.6 encrypted integral backups. No network, writes or browser storage.
// Intended as a migration acceptance gate, not an importer. Do not send real backups to ChatGPT.
import {read844} from './original_parcial/backup844.mjs';
import {MAX_ENVELOPE_BYTES} from './original_parcial/migration88.mjs';
const parts=Object.freeze(['legacy','preferences','gym','presentation844','coach844']);
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
function checkEnvelope(e,p){
 if(!exact(e,['format','salt','iv','cipher'])||e.format!=='asia84-encrypted-v1'||!['salt','iv','cipher'].every(k=>typeof e[k]==='string')||new TextEncoder().encode(JSON.stringify(e)).length>MAX_ENVELOPE_BYTES||typeof p!=='string'||p.length<12||p.length>200)throw Error('ARCHIVO_O_FRASE_INVALIDOS');
}
async function read(e,p){checkEnvelope(e,p);try{return await read844(e,p)}catch{throw Error('INTEGRIDAD_O_FRASE_INVALIDA')}}
// Key order is not data; array order and the exact contents of strings are data.
function equal(a,b){if(a===b)return true;if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 if(Array.isArray(a))return a.length===b.length&&a.every((v,i)=>equal(v,b[i]));
 const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));}
export async function verificarPreservacion(original,fraseOriginal,reexportado,fraseNueva){
 const a=await read(original,fraseOriginal),b=await read(reexportado,fraseNueva);
 const expected=['format','created',...parts];if(!exact(a,expected)||!exact(b,expected))throw Error('FORMATO_INTEGRAL_NO_RECONOCIDO');
 const components=Object.freeze(Object.fromEntries(parts.map(k=>[k,equal(a[k],b[k])])));
 return Object.freeze({allPreserved:Object.values(components).every(Boolean),components,healthServerVerified:false,accountIsolationVerified:false,canDeleteOriginal:false});
}
