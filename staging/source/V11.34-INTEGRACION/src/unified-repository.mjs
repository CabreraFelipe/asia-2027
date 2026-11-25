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
  initialize(id,local,modules){
   check(validRecord(local)&&validRecord(modules)&&local.revision===1&&modules.revision===1,'Importación inválida');
   return tx(id,true,(row,s)=>{check(row===null,'La cuenta ya contiene datos');s.add({local,modules},id);return true});
  },
  close(){closed=true;db.close()}
 });
}
