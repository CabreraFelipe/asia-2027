// Loaded inside the candidate document's own realm, not a parent-owned store object.
import {openModuleRepository,openEncryptedModuleStore} from '/staging/source/V11.28-INTEGRACION/src/encrypted-module-store.mjs';
export async function openCandidateStore(){
 if(location.hostname!=='127.0.0.1'||typeof asiaCandidateSession==='undefined')throw Error('Candidato CI no autorizado');
 const {readSession,passphrase}=asiaCandidateSession;
 const repository=await openModuleRepository(globalThis.indexedDB);
 try{
  const store=await openEncryptedModuleStore({readSession,repository,passphrase});
  return Object.freeze({read:store.read,write:store.write,readPair:store.readPair,replacePair:store.replacePair,
   close(){store.close();repository.close()}});
 }catch(e){repository.close();throw e}
}
