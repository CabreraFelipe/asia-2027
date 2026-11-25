// One synthetic IndexedDB row per verified account; atomic initial import of both vaults.
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const validId=id=>typeof id==='string'&&/^acct_[a-f0-9]{32}$/.test(id);
const validRecord=r=>r&&Number.isSafeInteger(r.revision)&&r.revision>0&&r.envelope?.format==='asia84-encrypted-v1'&&typeof r.envelope.cipher==='string';
export async function openUnifiedRepository(factory=globalThis.indexedDB){
 check(factory&&typeof factory.open==='function','IndexedDB no disponible');
 const db=await new Promise((resolve,reject)=>{
  const q=factory.open('asia-v1134-unified-synthetic-staging',1);
  q.onupgradeneeded=()=>q.result.createObjectStore('accounts');
  q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);q.onblocked=()=>reject(Error('Base bloqueada'));
 });
 db.onversionchange=()=>db.close();
 let closed=false;
 function tx(id,write,fn){
  check(!closed&&validId(id),'Cuenta o base inválida');
  return new Promise((resolve,reject)=>{
   const t=db.transaction('accounts',write?'readwrite':'readonly'),s=t.objectStore('accounts'),q=s.get(id);let result,error;
   t.oncomplete=()=>resolve(result);t.onabort=()=>reject(error||t.error||Error('Transacción abortada'));
   q.onsuccess=()=>{try{result=fn(q.result??null,s)}catch(e){error=e;t.abort()}};
  });
 }
 function adapter(key){return Object.freeze({
  read:id=>tx(id,false,row=>row?.[key]??null),
  compareAndSwap(id,expected,next){
   check(Number.isSafeInteger(expected)&&expected>=0&&validRecord(next)&&next.revision===expected+1,'Revisión inválida');
   return tx(id,true,(row,s)=>{check((row?.[key]?.revision??0)===expected,'Conflicto de revisión');s.put({...row,[key]:next},id);return next.revision});
  }
 })}
 return Object.freeze({local:adapter('local'),modules:adapter('modules'),
  empty:id=>tx(id,false,row=>row===null),
  // Snapshot both branches and sync marker in one transaction. No plaintext stored.
  readSync:id=>tx(id,false,row=>({local:row?.local??null,modules:row?.modules??null,baseline:row?.baseline??null})),
  commitSync(id,expected,{local=null,modules=null,baseline}){
   const rev=r=>r?.revision??0;
   check(baseline&&Number.isSafeInteger(baseline.remote)&&baseline.remote>0&&Number.isSafeInteger(baseline.local)&&baseline.local>=0&&Number.isSafeInteger(baseline.modules)&&baseline.modules>=0,'Marcador inválido');
   check((local===null&&modules===null)||(validRecord(local)&&validRecord(modules)&&local.revision===rev(expected.local)+1&&modules.revision===rev(expected.modules)+1),'Revisión de sincronización inválida');
   check(baseline.local===(local?.revision??rev(expected.local))&&baseline.modules===(modules?.revision??rev(expected.modules)),'Marcador inconsistente');
   return tx(id,true,(row,s)=>{
    const current={local:row?.local??null,modules:row?.modules??null,baseline:row?.baseline??null};
    check(JSON.stringify(current)===JSON.stringify(expected),'Conflicto de revisión local');
    s.put({...row,...(local?{local,modules}:{}),baseline},id);return true;
   });
  },
  initialize(id,local,modules){
   check(validRecord(local)&&validRecord(modules)&&local.revision===1&&modules.revision===1,'Importación inválida');
   return tx(id,true,(row,s)=>{check(row===null,'La cuenta ya contiene datos');s.add({local,modules},id);return true});
  },
  // Reconcile an offline branch only when the exact original snapshot is unchanged.
  reconcileOffline(id,expected,working){
   const rev=r=>r?.revision??0;
   for(const k of ['local','modules'])check(working[k]===null?expected[k]===null:validRecord(working[k])&&rev(working[k])>=rev(expected[k]),'Rama offline inválida');
   check(JSON.stringify(working.baseline)===JSON.stringify(expected.baseline),'Marcador offline inválido');
   return tx(id,true,(row,s)=>{
    const now={local:row?.local??null,modules:row?.modules??null,baseline:row?.baseline??null};
    if(JSON.stringify(now)===JSON.stringify(working))return 'already-applied';
    check(JSON.stringify(now)===JSON.stringify(expected),'Conflicto de revisión local; conservá la rama offline');
    s.put({...row,...working},id);return 'applied';
   });
  },
  close(){closed=true;db.close()}
 });
}
