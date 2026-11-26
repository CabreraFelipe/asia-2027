import assert from 'node:assert/strict';
import '../../../../accounts106.js';
import {seedGym,applyGym} from '../../../../gym84.mjs';
const gymBase=seedGym();
function gymSession(id,date,now){
 let x=applyGym(gymBase,{type:'start',id,routineId:gymBase.routines[0].id,date},now);
 x=applyGym(x,{type:'set',entryId:x.active.entries[0].id,index:0,values:{kg:20,reps:8,done:true}},now+1000);
 return applyGym(x,{type:'finish'},now+2000);
}
const gymLocal=gymSession('gym-local','2026-11-25',1700000000000);
const gymCloud=gymSession('gym-cloud','2026-11-24',1699999000000);

import {preparePendingRecovery1163,prepareAdditiveRecovery1162} from '../dist/assets/v11.42/staging/source/V11.42-INTEGRACION/src/recovery-apply1162.mjs';
import {encrypt84,decrypt84,empty84} from '../../../../model84.mjs';
const bookBase=empty84(),bookLocal={...bookBase,measurements:[{id:'local-measurement',day:'2026-11-25',kind:'Cintura',cm:80}]},bookCloud={...bookBase,threads:[{id:'cloud-thread',day:'2026-11-24',kind:'General',note:'nota sintética'}]};
import {hashBytes} from '../dist/assets/v11.42/staging/source/V11.38-INTEGRACION/src/large-sync.mjs';
const id='acct_'+'b'.repeat(32),oldPhrase='frase sintética pendiente anterior',newSecret='Z'.repeat(43),backupPhrase='respaldo independiente pendiente',identity={accountId:id,csrf:'b'.repeat(43)};
const entries=[['asia2027-v1',JSON.stringify({body:{'2026-11-26':{weight:81}},diet:{},work:{},settings:{},photos:{}})]];
const diary=JSON.parse(entries[0][1]),diaryEntries=x=>[['asia2027-v1',JSON.stringify(x)]];
const localDiary={...diary,body:{...diary.body,'2026-11-25':{weight:80}}},pendingDiary={...diary,journal96:{'2026-11-24':'nota pendiente'}},cloudDiary={...diary,diet:{'2026-11-23':{foods52:[]}}};
const base={entries,modules:{coach:{history:['original']},gym:gymBase,preferences:bookBase}},local={entries:diaryEntries(localDiary),modules:{...base.modules,recovery:{samples:['local']}}},work={entries:diaryEntries(pendingDiary),modules:{...base.modules,planner:{plans:['pendiente']},gym:gymLocal,preferences:bookLocal}},cloud={entries:diaryEntries(cloudDiary),modules:{...base.modules,visual:{photos:['nube']},gym:gymCloud,preferences:bookCloud}};
const plain=payload=>({format:'asia-v1136-sync-v1',accountId:id,payload});
const old=await encrypt84(plain(base),oldPhrase),migrated=await encrypt84(plain(base),newSecret),latest=await encrypt84(plain(cloud),newSecret);
const sha=x=>hashBytes(new TextEncoder().encode(JSON.stringify(x)));
const receipt={operationId:crypto.randomUUID(),phase:'committed',sourceRevision:1,sourceSha:await sha(old),revision:2,targetSha:await sha(migrated)};
async function row(p,revision,phrase=oldPhrase){
 return {local:{revision,envelope:await encrypt84({format:'asia-v1126-local-vault-v1',accountId:id,revision,entries:[...p.entries,['asia-timers-v4','null']]},phrase)},modules:{revision,envelope:await encrypt84({format:'asia-v1128-modules-v1',accountId:id,revision,modules:Object.fromEntries(Object.entries(p.modules).map(([name,payload])=>[name,{name,revision,payload}]))},phrase)},baseline:{remote:1,local:1,modules:1,namespace:'objects-v1138'}};
}
const original=await row(local,3),branchBase=await row(base,1),branchWorking=await row(work,5);
let source=structuredClone(original),branch={phase:'editing',base:branchBase,working:branchWorking},backup=null,objects=[old,migrated,latest],writes=0,commits=0,finishes=0,loseFinish=false;
const repository={readSync:async()=>structuredClone(source),readRekey:async()=>null,readRecovery:async()=>structuredClone(backup),async commitPendingRecovery(account,expected,target,proof,expectedBranch,prior){assert.equal(account,id);assert.deepEqual(source,expected);assert.deepEqual(expectedBranch,branch);assert.equal(prior,null);assert.equal(backup,null);backup={source:structuredClone(expected),proof:structuredClone(proof),branch:structuredClone(expectedBranch)};source=structuredClone(target);commits++;return 'applied'}};
const pending={inspect:async()=>structuredClone(branch),async finish(account,snapshot){assert.equal(account,id);assert.equal(branch.phase,'frozen');assert.deepEqual(snapshot,{base:branch.base,working:branch.working});if(loseFinish){loseFinish=false;throw Error('interrupción antes de finalizar')}branch=null;finishes++;return true}};
const client={accountId:id,verify:async()=>identity,discover:async()=>structuredClone(receipt),managedKey:async()=>newSecret,request:async(method,body,revision)=>{assert.equal(method,'GET');return revision?{ok:true,revision,envelope:structuredClone(objects[revision-1])}:{ok:true,head:objects.length,versions:[{revision:objects.length,bytes:100,created_at:'2026-11-26T00:00:00.000Z'}]}},async writeManaged({expectedRevision,envelope}){assert.equal(expectedRevision,objects.length);objects.push(structuredClone(envelope));writes++;return {ok:true,revision:objects.length}}};
const options={client,repository,pending,policy:globalThis.asiaAccounts106,oldPhrase,backupPhrase,maintenanceConfirmed:true};
const apply=p=>p.apply({confirmed:true,backupSaved:true,savedArchive:structuredClone(p.archive)});
// Each flow requires its own commit adapter, not the unrelated writer.
assert.equal(typeof repository.commitRecovery,'undefined');
await assert.rejects(prepareAdditiveRecovery1162(options),/Confirmá mantenimiento y repositorio/);
await assert.rejects(preparePendingRecovery1163({...options,repository:{...repository,commitPendingRecovery:undefined}}),/Confirmá mantenimiento y repositorio/);
await assert.rejects(preparePendingRecovery1163({...options,pending:{inspect:pending.inspect}}),/Confirmá mantenimiento y repositorio/);
assert.equal(writes,0);assert.equal(commits,0);assert.equal(finishes,0);
let plan=await preparePendingRecovery1163(options);assert.equal(plan.kind,'blocked');assert.equal(plan.reason,'freeze-required');assert.equal(writes,0);
branch.phase='frozen';const frozen=structuredClone(branch);
branch.working=await row({...work,modules:{...work.modules,coach:{history:['diferente']}}},5);
plan=await preparePendingRecovery1163(options);assert.equal(plan.kind,'conflict');assert.equal(writes,0);assert.equal(finishes,0);
branch=structuredClone(frozen);
plan=await preparePendingRecovery1163(options);assert.equal(plan.kind,'ready');assert.equal(plan.willAppend,true);
loseFinish=true;await assert.rejects(apply(plan));assert.equal(writes,1);assert.equal(commits,1);assert.equal(finishes,0);assert.deepEqual(branch,frozen);assert.deepEqual(backup.branch,frozen);assert.deepEqual(backup.source,original);
assert.equal(source.modules.revision,6);
const recovered=await decrypt84(source.modules.envelope,newSecret);
assert.deepEqual(recovered.modules.planner.payload,work.modules.planner);assert.equal(recovered.modules.planner.revision,5);
assert.deepEqual(recovered.modules.recovery.payload,local.modules.recovery);
assert.deepEqual(recovered.modules.visual.payload,cloud.modules.visual);
assert.deepEqual(recovered.modules.gym.payload.sessions,[...gymCloud.sessions,...gymLocal.sessions]);
assert.equal(recovered.modules.gym.revision,6);
assert.deepEqual((await decrypt84(objects[3],newSecret)).payload.modules.gym,recovered.modules.gym.payload);
assert.deepEqual(recovered.modules.preferences.payload,{...bookCloud,measurements:bookLocal.measurements});
assert.equal(recovered.modules.preferences.revision,6);
assert.deepEqual((await decrypt84(objects[3],newSecret)).payload.modules.preferences,recovered.modules.preferences.payload);
const recoveredDiary=JSON.parse((await decrypt84(source.local.envelope,newSecret)).entries.find(e=>e[0]==='asia2027-v1')[1]);
assert.deepEqual(recoveredDiary,{...cloudDiary,body:localDiary.body,journal96:pendingDiary.journal96});
assert.deepEqual(JSON.parse((await decrypt84(objects[3],newSecret)).payload.entries[0][1]),recoveredDiary);
plan=await preparePendingRecovery1163(options);assert.equal(plan.kind,'ready-finalize');
assert.equal((await apply(plan)).kind,'already-applied');assert.equal(finishes,1);assert.equal(branch,null);assert.equal(writes,1);assert.equal(commits,1);
assert.deepEqual(backup.branch,frozen);assert.deepEqual(objects.slice(0,3),[old,migrated,latest]);
console.log('Pending recovery: editing blocked, conflicts retained, legacy branch and original archived, revision fencing, interrupted finalization resumed without duplicate PASS.');
