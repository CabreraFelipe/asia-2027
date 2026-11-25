// Staging-only gate; uses existing Google OIDC session endpoint, never accepts caller-selected account.
import {sessionReader} from '../../V11.26-INTEGRACION/src/session-vault.mjs';
import {openRecoverableDeviceSession} from '../../V11.31-INTEGRACION/src/recovery.mjs';
import {openEncryptedModuleStore} from '../../V11.28-INTEGRACION/src/encrypted-module-store.mjs';
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
export async function unlockCandidate({origin,fetcher=fetch,repository,policy,passphrase,onStatus=()=>{}}){
 check(/^https:\/\/asia-v1111-identity-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin),'Origen de staging inválido');
 const read=sessionReader({origin,fetcher}),identity=await read();
 let active=true,closing=false,locked=false;
 async function verify(){check(active&&!locked,'Sesión cerrada');let s;try{s=await read()}catch(e){if(e.revoked===true)locked=true;throw e}if(s.accountId!==identity.accountId||s.csrf!==identity.csrf){locked=true;const e=Error('La sesión cambió');e.revoked=true;throw e}return s}
 const local=await openRecoverableDeviceSession({readSession:verify,repository:repository.local,passphrase,policy,onStatus});
 // Check the other vault before exposing any diary.
 const modules=await openEncryptedModuleStore({readSession:verify,repository:repository.modules,passphrase});modules.close();await verify();
 function storageGuard(){check(active&&!closing&&!locked,'Sesión bloqueada')}
 const storage=Object.freeze({getItem(k){storageGuard();return local.storage.getItem(k)},setItem(k,v){storageGuard();local.storage.setItem(k,v)},removeItem(k){storageGuard();local.storage.removeItem(k)},key(i){storageGuard();return local.storage.key(i)},get length(){storageGuard();return local.storage.length}});
 return Object.freeze({storage,readSession:verify,passphrase,session:local,
  async close({unmount,logout=false}={}){
   check(active&&!closing&&!locked&&typeof unmount==='function','Cierre inválido');closing=true;
   try{
    // Failed flush must keep UI and pending data available. Do not send logout.
    await local.flush();await local.close();active=false;await unmount();
    if(logout){const r=await fetcher(origin+'/v11.11/auth/logout',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',headers:{'X-Asia-CSRF':identity.csrf}});check(r.ok&&(await r.json()).ok===true,'Cierre remoto no confirmado')}
   }finally{closing=false}
  }
 });
}
