// Integrated candidate controller. Synthetic only, not a deployed PWA.
import {sessionReader} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
import {openOfflineEditing,reconcileOffline,exportOfflineConflict} from '../../V11.37-INTEGRACION/src/offline-session.mjs';
import {prepareLargeSync} from '../../V11.38-INTEGRACION/src/large-sync-client.mjs';
import {prepareFullImport} from '../../V11.35-INTEGRACION/src/full-archive.mjs';
import {prepareSelectiveRestore} from '../../V11.32-INTEGRACION/src/selective-restore.mjs';
import {createAccountServices} from '../../V11.39-INTEGRACION/src/service-client.mjs';
const check=(x,m)=>{if(!x)throw Error(m)};
const same=(a,b)=>a.accountId===b.accountId&&a.csrf===b.csrf;
function transient(){const m=new Map();return Object.freeze({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]??null,get length(){return m.size}})}
export async function createController({origin,fetcher=fetch,repository,pending,policy,passphrase,mount,onState=()=>{},now=Date.now}){
 check(/^https:\/\/asia-v1111-identity-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin)&&typeof mount==='function','Origen o montaje inválido');
 const read=sessionReader({origin,fetcher}),identity=await read();
 let state='maintenance',busy=false,plan=null,editing=null,services=null,view=null,closing=false,locked=false;
 const publish=next=>{state=next;try{onState(next)}catch{}};
 async function verify(){check(!locked&&state!=='closed','Sesión bloqueada');let s;try{s=await read()}catch(e){if(e.revoked===true){locked=true;services?.close();view?.hide?.();publish('locked')}throw e}
  if(!same(s,identity)){locked=true;services?.close();view?.hide?.();publish('locked');throw Error('La sesión cambió')}return s}
 const options={readSession:verify,origin,fetcher,repository,pending,policy,passphrase,now};
 const maintenance=()=>check(state==='maintenance'&&!busy&&!plan,'Cerrá el diario y la operación pendiente');
 async function operation(fn){check(!busy,'Operación en curso');busy=true;try{return await fn()}finally{busy=false}}
 async function prepare(fn){maintenance();return operation(async()=>{
  await verify();const p=await fn();plan=p;let active=true;
  return Object.freeze({...Object.fromEntries(Object.entries(p).filter(([k])=>!['commit','apply','cancel'].includes(k))),
   cancel(){check(active&&!busy,'Plan cerrado o en curso');active=false;p.cancel();plan=null},
   async apply(confirm){check(active&&plan===p&&state==='maintenance','Plan cerrado');return operation(async()=>{try{await verify();const result=await (p.commit??p.apply)(confirm);active=false;plan=null;return result}catch(e){p.cancel();active=false;plan=null;throw e}})}
  });
 })}
 publish('maintenance');
 return Object.freeze({
  get state(){return state},get hasPlan(){return plan!==null},get busy(){return busy},get status(){return editing?.status??null},
  async openDiary(){maintenance();return operation(async()=>{
   await verify();editing=await openOfflineEditing({...options,onStatus:()=>{try{onState(state)}catch{}}});
   try{
    services=await createAccountServices({origin,readSession:verify,fetcher});
    let calls=0;const guarded=fn=>(...a)=>{check(!closing&&!locked,'Diario bloqueado');calls++;return Promise.resolve().then(()=>fn(...a)).finally(()=>calls--)};
    const m=editing.moduleStore,serviceFacade=Object.freeze({available:()=>!closing&&!locked&&services.available(),request:guarded(services.request)});
    const storage=Object.freeze({getItem:k=>editing.storage.getItem(k),setItem(k,v){check(!closing&&!locked,'Diario bloqueado');editing.storage.setItem(k,v)},removeItem(k){check(!closing&&!locked,'Diario bloqueado');editing.storage.removeItem(k)},key:i=>editing.storage.key(i),get length(){return editing.storage.length}});
    const fixture=Object.freeze({storage,sessionStorage:transient(),services:serviceFacade,moduleStore:Object.freeze({read:guarded(m.read),write:guarded(m.write),readPair:guarded(m.readPair),replacePair:guarded(m.replacePair),close(){}})});
    view=await mount(fixture);check(view&&typeof view.remove==='function','Montaje incompleto');
    view.pending=()=>calls;publish('editing');
   }catch(e){services?.close();view?.remove?.();view=null;try{await editing.close()}catch{}editing=null;throw e}
  })},
  async closeDiary(){check(state==='editing'&&!busy&&!closing,'Diario no disponible');return operation(async()=>{
   closing=true;try{check(view.pending()===0,'Hay operaciones en curso');await editing.flush();await editing.close();services.close();view.remove();view=null;editing=null;services=null;publish('maintenance')}finally{closing=false}
  })},
  async reconcile(confirmation){maintenance();return operation(async()=>{await verify();return reconcileOffline({...options,maintenanceConfirmed:true,confirmed:confirmation===true})})},
  async inspectPending(){maintenance();return operation(async()=>{await verify();const p=await pending.inspect(identity.accountId);return p?{phase:p.phase}:null})},
  async exportConflict(backupPhrase){maintenance();return operation(()=>exportOfflineConflict({...options,backupPhrase}))},
  prepareSync({allowTransportChange=false}={}){return prepare(async()=>{check(!await pending.inspect(identity.accountId),'Conciliá primero los cambios pendientes');return prepareLargeSync({...options,maintenanceConfirmed:true,allowTransportChange})})},
  prepareImport({envelope,sourcePhrase}){return prepare(async()=>{check(!await pending.inspect(identity.accountId),'Conciliá primero los cambios pendientes');return prepareFullImport({...options,envelope,sourcePhrase,accountPhrase:passphrase})})},
  prepareRestore({envelope,recoveryPhrase,backupPhrase}){return prepare(async()=>{check(!await pending.inspect(identity.accountId),'Conciliá primero los cambios pendientes');return prepareSelectiveRestore({...options,repository:repository.local,envelope,recoveryPhrase,backupPhrase})})},
  async logout(){maintenance();return operation(async()=>{await verify();check(!await pending.inspect(identity.accountId),'Conciliá primero los cambios pendientes');const r=await fetcher(origin+'/v11.11/auth/logout',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',headers:{'X-Asia-CSRF':identity.csrf}});check(r.ok&&(await r.json()).ok===true,'Cierre remoto no confirmado');publish('closed')})}
 });
}
