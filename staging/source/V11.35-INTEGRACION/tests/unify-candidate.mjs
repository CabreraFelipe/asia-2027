// Change only disposable candidate's adapter. Original sources and prior regressions stay intact.
import {writeFileSync} from 'node:fs';
const path='staging/source/V11.29-INTEGRACION/tests/candidate/candidate-store.mjs';
writeFileSync(path,`import {openUnifiedRepository} from '/staging/source/V11.34-INTEGRACION/src/unified-repository.mjs';
import {openEncryptedModuleStore} from '/staging/source/V11.28-INTEGRACION/src/encrypted-module-store.mjs';
export async function openCandidateStore(){
 if(location.hostname!=='127.0.0.1'||typeof asiaCandidateSession==='undefined')throw Error('Candidato CI no autorizado');
 const {readSession,passphrase}=asiaCandidateSession,repository=await openUnifiedRepository(globalThis.indexedDB);
 try{const store=await openEncryptedModuleStore({readSession,repository:repository.modules,passphrase});
 return Object.freeze({read:store.read,write:store.write,readPair:store.readPair,replacePair:store.replacePair,close(){store.close();repository.close()}})}
 catch(e){repository.close();throw e}
}
`);
