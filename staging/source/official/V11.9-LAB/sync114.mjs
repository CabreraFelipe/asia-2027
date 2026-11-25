// Asia Platform V11.4: OFFLINE laboratory synchronization coordinator.
// Account identity is ALWAYS resolved by the injected V11.2 transport (server session),
// never a user-supplied account ID. No network, storage, or browser access in this module.
// A pending upload is never discarded by a failed/stale/concurrent remote operation.
const MAX_CIPHER=900000;
const enc=new TextEncoder();
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(o,keys)=>isObj(o)&&Object.keys(o).sort().join(',')===keys.slice().sort().join(',');
const b64=s=>typeof s==='string'&&s.length%4===0&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s);
export function validateEnvelope114(v){
 if(!exact(v,['format','salt','iv','cipher'])||v.format!=='asia84-encrypted-v1')return false;
 if(!b64(v.salt)||v.salt.length!==24||!b64(v.iv)||v.iv.length!==16||!b64(v.cipher)||v.cipher.length<24||v.cipher.length>MAX_CIPHER)return false;
 try{return atob(v.salt).length===16&&atob(v.iv).length===12&&(v.cipher.length/4*3-(v.cipher.endsWith('==')?2:v.cipher.endsWith('=')?1:0))>=16;}catch{return false;}
}
export async function fingerprint114(envelope){
 if(!validateEnvelope114(envelope))throw Error('INVALID_ENCRYPTED_ENVELOPE');
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(JSON.stringify(envelope))));
 return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
}
const copy=x=>JSON.parse(JSON.stringify(x));
const fail=(code)=>{throw Error(code);};
const validRevision=x=>Number.isSafeInteger(x)&&x>=0&&x<=20;
// Fail closed on transport shape: never interpret 400/401/403/409/500 as an empty account.
export function checkList114(result){
 if(!isObj(result)||result.ok!==true||!validRevision(result.head)||!Array.isArray(result.versions)||result.versions.length>20)return fail('REMOTE_LIST_UNTRUSTED');
 if(result.versions.length!==result.head)fail('REMOTE_LIST_UNTRUSTED');
 let expected=result.head;
 for(const x of result.versions){
  if(!isObj(x)||x.revision!==expected--||typeof x.created_at!=='string')fail('REMOTE_LIST_UNTRUSTED');
 }
 return result.head;
}
export class SyncDevice114 {
 #transport;#verify;
 #base={revision:0,digest:null};#pending=null;#incoming=null;#localArchives=[];#confirmed=[];
 constructor({transport,verifyArchive}){
  if(!transport||!['list','read','append'].every(k=>typeof transport[k]==='function')||typeof verifyArchive!=='function')throw Error('SYNC_ADAPTER_REQUIRED');
  this.#transport=transport;this.#verify=verifyArchive;
 }
 get state(){return Object.freeze({
  baseline:this.#base.revision,baselineDigest:this.#base.digest,
  hasPending:!!this.#pending,pendingDigest:this.#pending?.digest??null,
  hasIncoming:!!this.#incoming,incomingRevision:this.#incoming?.revision??null,
  retainedLocalVersions:this.#localArchives.length,confirmedUploads:this.#confirmed.length
 });}
 async #verifyCopy(envelope){
  if(!validateEnvelope114(envelope))fail('INVALID_ENCRYPTED_ENVELOPE');
  try{if(await this.#verify(copy(envelope))!==true)fail('INTEGRITY_OR_PASSPHRASE_FAILED');}
  catch{fail('INTEGRITY_OR_PASSPHRASE_FAILED');}
  return fingerprint114(envelope);
 }
 async #head(){return checkList114(await this.#transport.list());}
 async #readRevision(revision){
  if(!validRevision(revision)||revision===0)fail('INVALID_REMOTE_REVISION');
  const v=await this.#transport.read(revision);
  if(!isObj(v)||v.ok!==true||v.revision!==revision)fail('REMOTE_REVISION_UNTRUSTED');
  const digest=await this.#verifyCopy(v.envelope);
  return {revision,envelope:copy(v.envelope),digest};
 }
 // Prepare a LOCAL encrypted archive. Does not publish anything to server or overwrite device data.
 async stage(envelope,{replacePending=false}={}){
  const digest=await this.#verifyCopy(envelope);
  if(this.#pending&&!replacePending)fail('PENDING_COPY_MUST_BE_RETAINED');
  if(this.#pending)this.#localArchives.push(copy(this.#pending));
  this.#pending={envelope:copy(envelope),digest,baseRevision:this.#base.revision,baseDigest:this.#base.digest};
  return {status:'LOCAL_COPY_STAGED',baseline:this.#base.revision,localArchives:this.#localArchives.length};
 }
 // Read only. Never automatically applies remote changes to an in-progress local diary.
 async inspect(){
  const head=await this.#head();
  return Object.freeze({status:head>this.#base.revision?'REMOTE_AHEAD':head<this.#base.revision?'REMOTE_BEHIND':this.#pending?'READY_TO_UPLOAD':'IN_SYNC',
   remoteRevision:head,localRevision:this.#base.revision,hasPending:!!this.#pending,action:head!==this.#base.revision&&this.#pending?'REVIEW_CONFLICT_MANUALLY':undefined});
 }
 // Download to quarantine. No journal/data restore occurs without explicit acceptIncoming().
 async download(){
  const head=await this.#head();
  if(head===0)return {status:'REMOTE_EMPTY'};
  const remote=await this.#readRevision(head);
  if(this.#base.revision===head&&this.#base.digest!==null&&remote.digest!==this.#base.digest)fail('REMOTE_BASE_INTEGRITY_MISMATCH');
  this.#incoming=remote;
  return {status:this.#pending&&head!==this.#base.revision?'CONFLICT_QUARANTINED':'REMOTE_QUARANTINED',revision:head,verified:true,hasPending:!!this.#pending};
 }
 // Caller (future UI) must explicitly restore decrypted data separately; this only accepts baseline.
 async acceptIncoming({confirmed=false}={}){
  if(confirmed!==true)fail('EXPLICIT_CONFIRMATION_REQUIRED');
  if(!this.#incoming)fail('NO_VERIFIED_REMOTE_COPY');
  if(this.#pending)fail('LOCAL_COPY_MUST_BE_PRESERVED');
  const latest=await this.#head();
  if(latest!==this.#incoming.revision)fail('REMOTE_CHANGED_DURING_REVIEW');
  const recheck=await this.#readRevision(latest);
  if(recheck.digest!==this.#incoming.digest)fail('REMOTE_CHANGED_DURING_REVIEW');
  const result=copy(this.#incoming.envelope);
  this.#base={revision:latest,digest:recheck.digest};
  this.#incoming=null;
  return {status:'REMOTE_ACCEPTED_FOR_EXPLICIT_LOCAL_RESTORE',revision:latest,envelope:result};
 }
 // CAS on server, using session-derived owner. No optimistic blind overwrite, no silent merge.
 async upload(){
  if(!this.#pending)fail('NO_PENDING_COPY');
  const head=await this.#head();
  if(head!==this.#pending.baseRevision)return {status:'CONFLICT',remoteRevision:head,localRevision:this.#pending.baseRevision,pendingPreserved:true};
  if(head>=20)fail('REMOTE_REVISION_QUOTA');
  if(head>0){
   const serverBase=await this.#readRevision(head);
   if(serverBase.digest!==this.#pending.baseDigest)fail('REMOTE_BASE_INTEGRITY_MISMATCH');
  }
  let outcome;
  try{outcome=await this.#transport.append(this.#pending.baseRevision,copy(this.#pending.envelope));}
  catch(e){
   // Network failures are ambiguous: the server might have committed. Never re-submit blindly.
   return {status:'UNKNOWN_DELIVERY',pendingPreserved:true,reason:'CHECK_REMOTE_BEFORE_RETRY'};
  }
  if(outcome?.status===409)return {status:'CONFLICT',remoteRevision:null,pendingPreserved:true};
  if(outcome?.status!==201||outcome?.body?.ok!==true||outcome.body.revision!==head+1)fail('REMOTE_COMMIT_UNVERIFIED');
  // Server acknowledgement alone is insufficient: read back the encrypted snapshot and compare SHA-256.
  let readBack;
  try{readBack=await this.#readRevision(head+1);}catch{return {status:'UNKNOWN_DELIVERY',pendingPreserved:true,reason:'READBACK_FAILED'};}
  if(readBack.digest!==this.#pending.digest)fail('REMOTE_READBACK_MISMATCH');
  const saved=this.#pending;
  this.#confirmed.push({revision:head+1,digest:saved.digest});
  this.#base={revision:head+1,digest:saved.digest};this.#pending=null;this.#incoming=null;
  return {status:'UPLOADED_AND_VERIFIED',revision:head+1,pendingPreserved:false};
 }
 // Explicitly quarantine a conflicting local archive. Never silently discard it.
 retainPendingForReview({confirmed=false}={}){
  if(confirmed!==true)fail('EXPLICIT_CONFIRMATION_REQUIRED');
  if(!this.#pending)fail('NO_PENDING_COPY');
  this.#localArchives.push(copy(this.#pending));this.#pending=null;
  return {status:'LOCAL_ENCRYPTED_COPY_RETAINED',index:this.#localArchives.length-1,remoteUntouched:true};
 }
 // After an ambiguous request, compare the exact ciphertext to determine whether it committed.
 async reconcileUnknown(){
  if(!this.#pending)fail('NO_PENDING_COPY');
  const head=await this.#head();
  if(head===this.#pending.baseRevision)return {status:'SAFE_TO_RETRY',pendingPreserved:true};
  if(head===this.#pending.baseRevision+1){
   const remote=await this.#readRevision(head);
   if(remote.digest===this.#pending.digest){
    this.#confirmed.push({revision:head,digest:remote.digest});
    this.#base={revision:head,digest:remote.digest};this.#pending=null;this.#incoming=null;
    return {status:'PREVIOUS_UPLOAD_CONFIRMED',revision:head};
   }
  }
  return {status:'CONFLICT',remoteRevision:head,pendingPreserved:true};
 }
 // Revision rollback is NON-destructive: append old verified content as new revision.
 async prepareRestoreOfRevision(revision,{confirmed=false}={}){
  if(confirmed!==true)fail('EXPLICIT_CONFIRMATION_REQUIRED');
  if(this.#pending)fail('LOCAL_COPY_MUST_BE_PRESERVED');
  const head=await this.#head();
  if(head>=20)fail('REMOTE_REVISION_QUOTA');
  if(revision<=0||revision>=head)fail('NOT_AN_OLDER_REVISION');
  const latest=await this.#readRevision(head);
  const old=await this.#readRevision(revision);
  this.#base={revision:head,digest:latest.digest};
  this.#pending={envelope:copy(old.envelope),digest:old.digest,baseRevision:head,baseDigest:latest.digest};
  return {status:'RESTORE_PREPARED_NOT_PUBLISHED',fromRevision:revision,willCreateRevision:head+1};
 }
 // Export a local quarantined encrypted envelope for independent recovery. It is never plaintext.
 exportPending(){return this.#pending?copy(this.#pending.envelope):null;}
 exportIncoming(){return this.#incoming?copy(this.#incoming.envelope):null;}
 exportRetained(index){if(!Number.isSafeInteger(index)||index<0||index>=this.#localArchives.length)fail('INVALID_LOCAL_INDEX');return copy(this.#localArchives[index].envelope);}
}
