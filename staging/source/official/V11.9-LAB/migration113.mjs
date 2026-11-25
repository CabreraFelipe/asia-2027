// V11.3 — migration PRE-FLIGHT ONLY. No network, storage writes or Cloudflare access.
// Reuses the exact V10.6 backup format and validators. Never expose decrypted payload.
import {createHash} from 'node:crypto';
import {read844} from './legacy_v106/backup844.mjs';
import {inspectLegacy88,MAX_ENVELOPE_BYTES} from './legacy_v106/migration88.mjs';
import {checksum84} from './legacy_v106/model84.mjs';

const MAX_TEST_API_BYTES=900000;
const exact=(x,fields)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===fields.slice().sort().join('|');
const hash=s=>createHash('sha256').update(s).digest('hex');
const label=(x,n)=>Number.isSafeInteger(x)&&x>=0&&x<=n?x:0;

// Only a fully authenticated and structurally valid *integral* V10.6 backup may pass.
// The object itself is never mutated and is not returned from this function.
export async function preflight113(envelope,phrase){
 if(!exact(envelope,['format','salt','iv','cipher'])||envelope.format!=='asia84-encrypted-v1')throw Error('NOT_INTEGRAL_ENCRYPTED_BACKUP');
 if(typeof phrase!=='string'||phrase.length<12||phrase.length>200)throw Error('INVALID_PASSPHRASE');
 const raw=JSON.stringify(envelope);
 const byteLength=Buffer.byteLength(raw,'utf8');
 if(byteLength>MAX_ENVELOPE_BYTES||byteLength<100)throw Error('BACKUP_SIZE_OUT_OF_RANGE');
 let value;
 try{value=await read844(envelope,phrase);}catch{throw Error('INTEGRITY_OR_PASSWORD_FAILED');}
 const legacy=inspectLegacy88(value.legacy);
 // checksum84 is the same SHA-256(JSON.stringify()) primitive used by the actual backup.
 const fingerprint=await checksum84([value.legacy,value.preferences,value.gym,value.presentation844,value.coach844]);
 const summary=Object.freeze({
  sourceFormat:'asia84-portable-v1',envelopeFormat:'asia84-encrypted-v1',
  archiveSha256:hash(raw),contentFingerprint:fingerprint,
  envelopeBytes:byteLength,
  // Count only. Never print any notes, names, meals, weights, workouts or timestamps.
  counters:Object.freeze({measurements:label(legacy.measurements,500000),dietDays:label(legacy.dietDays,500000),
   foodRows:label(legacy.foodRows,500000),workouts:label(legacy.workouts,500000),
   photos:label(legacy.photos,500000),favorites:label(legacy.favorites,500000),
   recipes:label(legacy.recipes,500000),gymSessions:label(value.gym.sessions?.length,500000),
   gymRoutines:label(value.gym.routines?.length,500000)}),
  components:Object.freeze(['legacy','preferences','gym','presentation844','coach844']),
  withinCurrentStagingRequestLimit:byteLength<=MAX_TEST_API_BYTES-512,
  exclusions:Object.freeze(['Health stored in production D1','device credentials','push subscriptions','Apple Health provider permissions']),
  action:'READ_ONLY_LOCAL_PREFLIGHT',
  remoteTransferAllowed:false,
  productionMutationAllowed:false
 });
 return summary;
}
export function verifySameArchive113(envelope,summary){
 if(!exact(envelope,['format','salt','iv','cipher'])||!summary||summary.action!=='READ_ONLY_LOCAL_PREFLIGHT')return false;
 const raw=JSON.stringify(envelope);
 return hash(raw)===summary.archiveSha256&&Buffer.byteLength(raw,'utf8')===summary.envelopeBytes;
}
export function describePlan113(summary){
 if(!summary||summary.action!=='READ_ONLY_LOCAL_PREFLIGHT')throw Error('NEED_VERIFIED_PREFLIGHT');
 return Object.freeze({phase:'rehearsal-only',originalPreserved:true,localBackupMustBeRetained:true,
  importRequired:false,remoteTransferAllowed:false,
  verifiedSourceSha256:summary.archiveSha256,
  beforeAnyRealImport:['production backup remains accessible','real identity with recovery ready','per-account security audited','actual backup size supported','explicit user confirmation','independent rollback validated']});
}
