import './accounts106.js';
import {createController} from './staging/source/V11.40-INTEGRACION/src/controller.mjs';
import {mountShell} from './staging/source/V11.40-INTEGRACION/src/shell.mjs';
import {mountMaintenance} from './staging/source/V11.41-INTEGRACION/src/maintenance.mjs';
import {openUnifiedRepository} from './staging/source/V11.34-INTEGRACION/src/unified-repository.mjs';
import {openOfflineRepository} from './staging/source/V11.37-INTEGRACION/src/offline-repository.mjs';
export async function start(passphrase){
 const repository=await openUnifiedRepository(),pending=await openOfflineRepository();let shell,panel;
 const mount=async fixture=>{
  if(globalThis.__asiaCandidateFixture)throw Error('Diario ya abierto');globalThis.__asiaCandidateFixture=fixture;
  const frame=document.createElement('iframe');frame.title='Diario original Asia V10.6';frame.src='/v11.42/diary/index.html';const loaded=new Promise(r=>frame.addEventListener('load',r,{once:true}));
  const remove=()=>{frame.remove();delete globalThis.__asiaCandidateFixture};document.getElementById('diary').append(frame);
  try{await Promise.race([loaded,new Promise((_,rej)=>setTimeout(()=>rej(Error('Montaje agotado')),15000))]);for(let i=0;i<150;i++){if(frame.contentWindow.asiaGym84Ready===true)return {remove,hide(){frame.hidden=true}};await new Promise(r=>setTimeout(r,100))}throw Error('Diario no inicializado')}catch(e){remove();throw e}
 };
 try{
  const c=await createController({origin:location.origin,repository,pending,policy:globalThis.asiaAccounts106,passphrase,mount,onState:s=>{shell?.render();panel?.render();if(s==='closed'){repository.close();pending.close();location.replace('/v11.42/index.html')}}});
  shell=mountShell({doc:document,anchor:document.getElementById('shell'),controller:c,onRender:()=>panel?.render()});
  panel=mountMaintenance({doc:document,anchor:document.getElementById('shell'),controller:c,onChange:()=>shell.render()});
 }catch(e){repository.close();pending.close();throw e}
}
