// V11.4 unit/property checks + full real-crypto/SQLite E2E. Completely offline.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {SyncDevice114,validateEnvelope114,fingerprint114,checkList114} from '../sync114.mjs';
import {rehearsal114} from '../scripts/rehearsal114.mjs';
let count=0;
const eq=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);count++;};
const ok=(condition,label)=>{assert.ok(condition,label);count++;};
const fail=(fn,expected)=>{assert.throws(fn,new RegExp(expected));count++;};
const reject=async(fn,expected)=>{await assert.rejects(async()=>fn(),new RegExp(expected));count++;};
const envelope=(a=1)=>({format:'asia84-encrypted-v1',salt:randomBytes(16).toString('base64'),iv:randomBytes(12).toString('base64'),cipher:randomBytes(48+a).toString('base64')});
const first=envelope();
ok(validateEnvelope114(first),'normal envelope');
for(const v of [null,[],{},42,'not an object',{...first,format:'plaintext'},{...first,extra:1},{...first,salt:''},{...first,iv:''},{...first,cipher:''},{...first,salt:42},{...first,cipher:'*'.repeat(128)},{...first,cipher:'AAAA'}, {...first,cipher:'A'.repeat(900004)}]){
 eq(validateEnvelope114(v),false,'reject malformed encrypted envelope');
}
const h=await fingerprint114(first);eq(h.length,64,'sha256 hex digest');eq(await fingerprint114({...first}),h,'digest reproducible');
ok((await fingerprint114(envelope(2)))!==h,'different ciphertext yields different digest');
await reject(()=>fingerprint114({cipher:'none'}),'INVALID_ENCRYPTED_ENVELOPE');
const collection=(head)=>({ok:true,head,versions:Array.from({length:head},(_,i)=>({revision:head-i,created_at:'2026-11-23T00:00:00.000Z'}))});
for(let i=0;i<=20;i++)eq(checkList114(collection(i)),i,'valid list revision '+i);
for(const v of [null,{},[],{ok:false,head:0,versions:[]},{ok:true,head:1,versions:[]},{ok:true,head:0,versions:[{revision:1,created_at:'y'}]},{ok:true,head:-1,versions:[]},{ok:true,head:21,versions:[]},{ok:true,head:1,versions:[{revision:1}]},{ok:true,head:2,versions:[{revision:1,created_at:'t'}]},{ok:true,head:2,versions:[{revision:2,created_at:'t'},{revision:2,created_at:'t'}]},{ok:true,head:2,versions:[{revision:1,created_at:'t'},{revision:2,created_at:'t'}]}])fail(()=>checkList114(v),'REMOTE_LIST_UNTRUSTED');
fail(()=>new SyncDevice114({}), 'SYNC_ADAPTER_REQUIRED');
fail(()=>new SyncDevice114({transport:{},verifyArchive:async()=>true}), 'SYNC_ADAPTER_REQUIRED');
const newStore=()=>{
 const rows=[];const stats={list:0,read:0,write:0};
 const transport={async list(){stats.list++;return collection(rows.length)},async read(rev){stats.read++;const row=rows[rev-1];if(!row)throw Error('NOT_FOUND');return {ok:true,revision:rev,envelope:structuredClone(row)};},async append(rev,env){stats.write++;if(rev!==rows.length)return {status:409,body:{ok:false}};rows.push(structuredClone(env));return {status:201,body:{ok:true,revision:rows.length}};}};
 return {transport,rows,stats};
};
const verify=async v=>validateEnvelope114(v);
{
 const store=newStore(),dev=new SyncDevice114({transport:store.transport,verifyArchive:verify});
 const a=envelope(2),b=envelope(3);await dev.stage(a);
 eq(store.stats.write,0,'stage does not upload');
 eq(dev.state.hasPending,true,'pending visible without ciphertext');
 fail(()=>dev.exportRetained(0),'INVALID_LOCAL_INDEX');
 await reject(()=>dev.stage(b),'PENDING_COPY_MUST_BE_RETAINED');
 await dev.stage(b,{replacePending:true});eq(dev.state.retainedLocalVersions,1,'old local copy retained');
 eq(await fingerprint114(dev.exportRetained(0)),await fingerprint114(a),'retained version remains available');
 const exported=dev.exportPending();exported.cipher='tampered';eq(validateEnvelope114(dev.exportPending()),true,'export does not give mutable reference');
 await reject(()=>dev.acceptIncoming({confirmed:true}),'NO_VERIFIED_REMOTE_COPY');
 eq((await dev.upload()).status,'UPLOADED_AND_VERIFIED','upload requires acknowledgement plus readback');
 eq(dev.state.hasPending,false,'pending cleared only after readback');
 eq(dev.state.confirmedUploads,1,'confirmed history');
 await reject(()=>dev.upload(),'NO_PENDING_COPY');
 await reject(()=>dev.prepareRestoreOfRevision(1,{confirmed:true}),'NOT_AN_OLDER_REVISION');
 eq((await dev.download()).status,'REMOTE_QUARANTINED','can stage a verified remote');
 eq(dev.state.baseline,1,'downloading does not advance baseline');
 eq((await dev.acceptIncoming({confirmed:true})).revision,1,'explicit accept updates baseline');
}
{
 const store=newStore(),a=new SyncDevice114({transport:store.transport,verifyArchive:verify}),b=new SyncDevice114({transport:store.transport,verifyArchive:verify});
 const x=envelope(),y=envelope();await a.stage(x);await b.stage(y);
 const outcomes=await Promise.all([a.upload(),b.upload()]);
 eq(outcomes.map(r=>r.status).sort(),['CONFLICT','UPLOADED_AND_VERIFIED'],'concurrent CAS yields one committed revision');
 ok(a.state.hasPending!==b.state.hasPending,'loser retains pending copy');
 eq(store.rows.length,1,'no duplicated writes');
}
{
 const store=newStore(),dev=new SyncDevice114({transport:store.transport,verifyArchive:verify});
 await dev.stage(envelope());await dev.upload();
 const old=await dev.download();eq(old.revision,1,'remote at version 1');
 const newer=envelope(4);store.rows[0]=newer;
 await reject(()=>dev.acceptIncoming({confirmed:true}),'REMOTE_CHANGED_DURING_REVIEW','detect substituted version');
}
{
 const store=newStore(),dev=new SyncDevice114({transport:store.transport,verifyArchive:verify});
 store.transport.list=async()=>{throw Error('CLOUD_OFFLINE');};
 await reject(()=>dev.inspect(),'CLOUD_OFFLINE');
 eq(dev.state.baseline,0,'network error does not reset baseline');
 eq(dev.state.hasPending,false,'network error does not invent copies');
}
{
 const store=newStore(),dev=new SyncDevice114({transport:store.transport,verifyArchive:async()=>false});
 await reject(()=>dev.stage(envelope()),'INTEGRITY_OR_PASSPHRASE_FAILED');
 eq(store.stats.write,0,'unverified copy never uploaded');
}
{
 const store=newStore(),dev=new SyncDevice114({transport:store.transport,verifyArchive:verify});
 await dev.stage(envelope());eq(dev.retainPendingForReview({confirmed:true}).index,0,'pending archived with confirmation');
 eq(dev.exportPending(),null,'pending cleared after archiving');
 eq(dev.state.retainedLocalVersions,1,'archived encrypted copy retained');
 await reject(()=>dev.retainPendingForReview({confirmed:true}),'NO_PENDING_COPY');
}
{
 const store=newStore(),dev=new SyncDevice114({transport:store.transport,verifyArchive:verify});
 await dev.stage(envelope());
 const accepted=await dev.upload();eq(accepted.revision,1,'acknowledged valid upload');
 store.transport.append=async()=>({status:201,body:{ok:true,revision:99}});
 await dev.stage(envelope());await reject(()=>dev.upload(),'REMOTE_COMMIT_UNVERIFIED');
 eq(dev.state.hasPending,true,'untrusted ack keeps copy');
}
{
 const store=newStore(),dev=new SyncDevice114({transport:store.transport,verifyArchive:verify});
 await dev.stage(envelope());await dev.upload();
 await dev.download();await dev.acceptIncoming({confirmed:true});
 const item=envelope();await dev.stage(item);
 store.transport.append=async()=>({status:409,body:{ok:false}});
 eq((await dev.upload()).status,'CONFLICT','race 409 handled without deletion');
 eq(await fingerprint114(dev.exportPending()),await fingerprint114(item),'409 retains exact envelope');
}

{
 const store=newStore(),dev=new SyncDevice114({transport:store.transport,verifyArchive:verify});
 await dev.stage(envelope());await dev.upload();
 store.rows[0]=envelope(13);
 await dev.stage(envelope(12));
 await reject(()=>dev.upload(),'REMOTE_BASE_INTEGRITY_MISMATCH');
 eq(dev.state.hasPending,true,'baseline altered remotely refuses upload and keeps pending');
}
{
 const store=newStore(),dev=new SyncDevice114({transport:store.transport,verifyArchive:verify});
 for(let i=0;i<20;i++)store.rows.push(envelope(i+1));
 eq((await dev.download()).revision,20,'staging cap of twenty revisions is visible');
 await dev.acceptIncoming({confirmed:true});
 await dev.stage(envelope());
 await reject(()=>dev.upload(),'REMOTE_REVISION_QUOTA');
 eq(store.rows.length,20,'quota rejection never deletes old revisions');
 await reject(()=>dev.prepareRestoreOfRevision(1,{confirmed:true}),'LOCAL_COPY_MUST_BE_PRESERVED');
}
{
 const store=newStore(),dev=new SyncDevice114({transport:store.transport,verifyArchive:verify});
 const saved=envelope();await dev.stage(saved);
 store.transport.append=async()=>({status:503,body:{ok:false,error:'Backend unavailable'}});
 await reject(()=>dev.upload(),'REMOTE_COMMIT_UNVERIFIED');
 eq(dev.state.hasPending,true,'server 503 never clears the pending copy');
 eq(await fingerprint114(dev.exportPending()),await fingerprint114(saved),'pending retained on 503');
}
const complete=await rehearsal114({verbose:false});eq(complete.passed,51,'51 encrypted SQLite/API E2E checks');
console.log(`V11.4: ${count} tests unitarios + ${complete.passed} comprobaciones E2E offline. Sin red, sin datos personales, sin despliegue.`);
