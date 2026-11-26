// Separate encrypted work branch; never overwrites the confirmed repository while offline.
const check=(x,m)=>{if(!x)throw Error(m)},rev=r=>r?.revision??0;
const validId=id=>typeof id==='string'&&/^acct_[a-f0-9]{32}$/.test(id);
const validRecord=r=>r&&Number.isSafeInteger(r.revision)&&r.revision>0&&r.envelope?.format==='asia84-encrypted-v1';
const copy=x=>structuredClone(x);
export async function openOfflineRepository(factory=globalThis.indexedDB){
 const db=await new Promise((ok,fail)=>{const q=factory.open('asia-v1137-offline-synthetic-staging',1);q.onupgradeneeded=()=>q.result.createObjectStore('pending');q.onsuccess=()=>ok(q.result);q.onerror=()=>fail(q.error);q.onblocked=()=>fail(Error('Base bloqueada'))});
 db.onversionchange=()=>db.close();let closed=false;
 function tx(id,write,fn){check(!closed&&validId(id),'Cuenta o base inválida');return new Promise((ok,fail)=>{
  const t=db.transaction('pending',write?'readwrite':'readonly'),s=t.objectStore('pending'),q=s.get(id);let out,error;
  t.oncomplete=()=>ok(out);t.onabort=()=>fail(error||t.error||Error('Transacción abortada'));
  q.onsuccess=()=>{try{out=fn(q.result??null,s)}catch(e){error=e;t.abort()}};
 })}
 function adapter(id,key,lease){return Object.freeze({
  read:()=>tx(id,false,r=>{check(r&&r.lease===lease&&r.phase==='editing','Rama bloqueada');return r.working[key]}),
  compareAndSwap(account,expected,next){check(account===id&&validRecord(next)&&next.revision===expected+1,'Revisión inválida');return tx(id,true,(r,s)=>{
   check(r&&r.lease===lease&&r.phase==='editing','Rama bloqueada');check(rev(r.working[key])===expected,'Conflicto de revisión offline');
   r.working[key]=copy(next);s.put(r,id);return next.revision;
  })}
 })}
 return Object.freeze({
  async begin(id,base,lease){
   check(typeof lease==='string'&&lease.length>=16,'Lease inválido');
   await tx(id,true,(r,s)=>{
    // Resuming after online identity verification rotates lease, excluding older handles.
    check(!r||r.phase==='editing','Rama en conciliación');
    if(!r)r={base:copy(base),working:copy(base),phase:'editing'};
    r.lease=lease;s.put(r,id);
   });return Object.freeze({local:adapter(id,'local',lease),modules:adapter(id,'modules',lease),
    // Candidate-only paired fence: no plaintext; existing working record and lease.
    readCoachPair:()=>tx(id,false,r=>{check(r&&r.lease===lease&&r.phase==='editing','Rama bloqueada');return copy({local:r.working.local,modules:r.working.modules})}),
    commitCoachLocal(expected,next){
     check(expected&&Object.keys(expected).length===2&&['local','modules'].every(k=>Object.hasOwn(expected,k)&&(expected[k]===null||validRecord(expected[k])))&&validRecord(next)&&next.revision===rev(expected.local)+1,'Revisión Coach inválida');
     const prior=copy(expected),target=copy(next);
     return tx(id,true,(r,s)=>{check(r&&r.lease===lease&&r.phase==='editing','Rama bloqueada');check(JSON.stringify(r.working.local)===JSON.stringify(prior.local)&&JSON.stringify(r.working.modules)===JSON.stringify(prior.modules),'Conflicto de revisión diario/PRO');r.working.local=target;s.put(r,id);return {accountId:id,revision:target.revision,proRevision:rev(r.working.modules)};});
    }
   });
  },
  inspect:id=>tx(id,false,r=>r?{phase:r.phase,base:r.base,working:r.working}:null),
  // Freeze only the exact inspected branch; no stale review may freeze a
  // newer branch. Existing lease holders are fenced by phase.
  freezeReviewed(id,expected){return tx(id,true,(r,s)=>{
   check(r&&JSON.stringify({phase:r.phase,base:r.base,working:r.working})===JSON.stringify(expected),'Rama pendiente cambió');
   check(['editing','frozen'].includes(r.phase),'Rama inválida');
   r.phase='frozen';s.put(r,id);return {phase:r.phase,base:r.base,working:r.working};
  })},
  freeze:id=>tx(id,true,(r,s)=>{check(r,'No hay rama pendiente');r.phase='frozen';s.put(r,id);return {base:r.base,working:r.working}}),
  finish(id,snapshot){return tx(id,true,(r,s)=>{check(r?.phase==='frozen'&&JSON.stringify({base:r.base,working:r.working})===JSON.stringify(snapshot),'Rama pendiente cambió');s.delete(id);return true})},
  close(){closed=true;db.close()}
 });
}
