import './accounts106.js';
import {createController} from './staging/source/V11.40-INTEGRACION/src/controller.mjs';
import {mountShell} from './staging/source/V11.40-INTEGRACION/src/shell.mjs';
import {mountMaintenance} from './staging/source/V11.41-INTEGRACION/src/maintenance.mjs';
import {openUnifiedRepository} from './staging/source/V11.34-INTEGRACION/src/unified-repository.mjs';
import {openOfflineRepository} from './staging/source/V11.37-INTEGRACION/src/offline-repository.mjs';
import {sessionReader,openSessionVault} from './staging/source/V11.26-INTEGRACION/src/session-vault.mjs';
import {devicePolicy} from './staging/source/V11.30-INTEGRACION/src/device-session.mjs';
import {openEncryptedModuleStore} from './staging/source/V11.28-INTEGRACION/src/encrypted-module-store.mjs';
export async function start(passphrase){
 const repository=await openUnifiedRepository(),pending=await openOfflineRepository();let shell,panel;
 const mount=async fixture=>{
  if(globalThis.__asiaCandidateFixture)throw Error('Diario ya abierto');globalThis.__asiaCandidateFixture=fixture;
  const frame=document.createElement('iframe');frame.title='Diario original Asia V10.6';frame.src='/v11.42/diary/index.html';frame.inert=true;
  const remove=()=>{frame.remove();delete globalThis.__asiaCandidateFixture};document.getElementById('diary').append(frame);
  // The original diary may have nonessential resources still loading after its
  // essential modules are ready. The global load event is not a security gate.
  // Require the exact same-origin document, DOM readiness and verified Gym adapter.
  const deadline=Date.now()+60000;
  try{
   while(Date.now()<deadline){
    const win=frame.contentWindow,doc=frame.contentDocument;
    if(doc&&win.location.origin===location.origin&&win.location.pathname==='/v11.42/diary/index.html'){
     if(win.asiaGym84Ready===false)throw Error('El diario cargó, pero no pudo verificar el módulo Gym cifrado.');
     if(doc.readyState!=='loading'&&win.asiaGym84Ready===true){frame.inert=false;return {remove,hide(){frame.inert=true;frame.hidden=true}}}
    }
    await new Promise(r=>setTimeout(r,100));
   }
   throw Error('El diario no verificó sus módulos esenciales en 60 segundos. Revisá la conexión.');
  }catch(e){remove();throw e}

 };
 try{
  const readSession=sessionReader({origin:location.origin}),identity=await readSession(),policy=globalThis.asiaAccounts106;
  const verify=async()=>{const t=await readSession();if(t.accountId!==identity.accountId||t.csrf!==identity.csrf)throw Error('Sesión cambió');return t};
  const snapshot=await repository.readSync(identity.accountId),branch=await pending.inspect(identity.accountId);
  for(const row of [snapshot,...(branch?[branch.working]:[])]){
   const local=await openSessionVault({readSession:verify,repository:{read:async()=>row.local},passphrase,policy:devicePolicy(policy)});local.close();
   const modules=await openEncryptedModuleStore({readSession:verify,repository:{read:async()=>row.modules,compareAndSwap(){throw Error('Solo lectura')}},passphrase});modules.close();
  }
  await verify();
  const c=await createController({origin:location.origin,repository,pending,policy:globalThis.asiaAccounts106,passphrase,mount,onState:s=>{shell?.render();panel?.render();if(s==='closed'){repository.close();pending.close();location.replace('/v11.42/index.html')}}});
  shell=mountShell({doc:document,anchor:document.getElementById('shell'),controller:c,onRender:()=>panel?.render()});
  panel=mountMaintenance({doc:document,anchor:document.getElementById('shell'),controller:c,onChange:()=>shell.render()});
 }catch(e){repository.close();pending.close();throw e}
}
