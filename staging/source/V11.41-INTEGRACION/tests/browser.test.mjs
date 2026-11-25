import {createController} from '../../V11.40-INTEGRACION/src/controller.mjs';
import {mountShell} from '../../V11.40-INTEGRACION/src/shell.mjs';
import {candidateMount} from '../../V11.40-INTEGRACION/src/fixture-mount.mjs';
import {mountMaintenance} from '../src/maintenance.mjs';
import {captureFullArchive} from '../../V11.35-INTEGRACION/src/full-archive.mjs';
import {openUnifiedRepository} from '../../V11.34-INTEGRACION/src/unified-repository.mjs';
import {openOfflineRepository} from '../../V11.37-INTEGRACION/src/offline-repository.mjs';
import {openDeviceSession} from '../../V11.30-INTEGRACION/src/device-session.mjs';
import {MODULES} from '../../../../store84.mjs';
import {empty84,encrypt84} from '../../../../model84.mjs';
import {seedGym} from '../../../../gym84.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,m){for(let i=0;i<200;i++){if(fn())return;await sleep(100)}throw Error(m)}
export async function run(){
 const accountId='acct_'+'a'.repeat(32),csrf='a',policy=globalThis.asiaAccounts106,origin='https://asia-v1111-identity-staging.example.workers.dev',passphrase='frase sintética V11.41',sourcePhrase='frase sintética de origen',backupPhrase='frase sintética respaldo anterior';
 const repository=await openUnifiedRepository(),pending=await openOfflineRepository(),readSession=async()=>({accountId,csrf});let shell,panel,downloads=[];
 const fetcher=async(url)=>{const path=new URL(url).pathname;if(path==='/v11.11/auth/me')return new Response(JSON.stringify({ok:true,syntheticOnly:true,accountId,csrf}));if(path.endsWith('/health'))return new Response('{"ok":true,"syntheticOnly":true,"records":[]}');if(path.endsWith('/workouts'))return new Response('{"ok":true,"syntheticOnly":true,"workouts":[]}');throw Error('Ruta no permitida')};
 const raw={body:{},diet:{},work:{},photos:{},settings:{height:1.83}},records=Object.fromEntries(MODULES.map(name=>[name,{name,revision:name==='preferences'||name==='gym'?1:0,payload:name==='preferences'?empty84():name==='gym'?seedGym():{}}]));
 const storage={getItem:k=>k==='asia2027-v1'?JSON.stringify(raw):k==='asia-theme-v4'?'dark':null};
 const store={read:async k=>structuredClone(records[k]),readPair:async()=>({preferences:structuredClone(records.preferences),gym:structuredClone(records.gym)})};
 const archive=await captureFullArchive({storage,store,policy,passphrase:sourcePhrase,sourceContextConfirmed:true});
 const el=id=>document.getElementById(id),select=envelope=>{const d=new DataTransfer();d.items.add(new File([JSON.stringify(envelope)],'synthetic.json',{type:'application/json'}));el('archive1141').files=d.files;el('phrase1141').value=sourcePhrase;el('backupPhrase1141').value=backupPhrase};
 try{
 const c=await createController({origin,fetcher,repository,pending,policy,passphrase,mount:candidateMount({anchor:el('diary')}),onState:()=>{shell?.render();panel?.render()}});
 shell=mountShell({doc:document,anchor:el('shell'),controller:c,onRender:()=>panel?.render()});
 panel=mountMaintenance({doc:document,anchor:el('shell'),controller:c,onChange:()=>shell.render(),download:(e,o)=>downloads.push({e,o})});
 select(archive.envelope);el('import1141').click();await until(()=>c.hasPlan&&!el('cancel1141').disabled,'No preparó inventario');
 check(await repository.empty(accountId)&&el('confirm1141').disabled&&el('open1140').disabled,'Importación no segura');
 el('retained1141').click();el('reviewed1141').click();el('confirm1141').click();await until(()=>el('maintenanceStatus1141').textContent.includes('confirmada'),'No importó');
 el('open1140').click();await until(()=>c.state==='editing','No abrió original');check(document.querySelector('iframe').contentDocument.getElementById('height').value==='1.83','Altura perdida');check(el('restore1141').disabled,'Restauración con diario abierto');
 await until(()=>!el('close1140').disabled,'Cierre no disponible');el('close1140').click();await until(()=>c.state==='maintenance','No cerró');await c.reconcile(true);shell.render();
 const recovery=await encrypt84({format:'asia-v1131-pending-recovery-v1',accountId,capturedAt:new Date().toISOString(),entries:[['asia-theme-v4','light:ocean'],['asia2027-v1','{"bad":true}']]},sourcePhrase);
 select(recovery);el('restore1141').click();await until(()=>!el('download1141').disabled,'No comparó');
 const rows=[...el('inventory1141').querySelectorAll('input')],theme=rows.find(x=>x.value==='asia-theme-v4'),diary=rows.find(x=>x.value==='asia2027-v1');check(!theme.disabled&&diary.disabled,'Selección insegura');theme.click();el('retained1141').click();el('reviewed1141').click();check(el('confirm1141').disabled,'Falta descarga');el('download1141').click();await until(()=>!el('confirm1141').disabled,'No habilitó');el('confirm1141').click();await until(()=>el('maintenanceStatus1141').textContent.includes('confirmada'),'No restauró');
 const s=await openDeviceSession({readSession,repository:repository.local,passphrase,policy});check(s.storage.getItem('asia-theme-v4')==='light:ocean'&&JSON.parse(s.storage.getItem('asia2027-v1')).settings.height===1.83,'Diario alterado');await s.close();check(downloads.length===1&&downloads[0].e.format==='asia84-encrypted-v1','Respaldo inválido');
 return {ok:true,checks:'Importación integral con inventario y confirmación, exclusión de mantenimiento, original altura intacta, restauración selectiva y respaldo cifrado solicitado'};
 }finally{panel?.remove();shell?.remove();document.querySelector('iframe')?.remove();delete globalThis.__asiaCandidateFixture;repository.close();pending.close()}
}
