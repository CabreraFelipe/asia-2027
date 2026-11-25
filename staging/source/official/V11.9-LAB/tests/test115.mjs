// No network; no personal data. Test only synthetic account scopes, encrypted archives and permission gates.
import assert from 'node:assert/strict';
import {rehearsal115} from '../scripts/rehearsal115.mjs';
import {validateCoachState115,prepareCoachRequest115,approveMemory115,validateCoachEnvelope115,encryptCoachState115,decryptCoachState115,GRANTS115} from '../coach115-client.mjs';
let count=0;
const check=(x,l)=>{assert.ok(x,l);count++;};
const same=(x,y,l)=>{assert.deepEqual(x,y,l);count++;};
const bad=(fn,pattern)=>{assert.throws(fn,RegExp(pattern));count++;};
const reject=async(fn,pattern)=>{await assert.rejects(fn,RegExp(pattern));count++;};
const PHRASE='frase totalmente ficticia para pruebas de coach 115';
const msg=(id='message_115_1',text='Pregunta de prueba')=>({id,role:'user',text,at:'2026-11-23'});
const memory=(id='memory_115_1')=>({id,note:'Preferencia de prueba',approvedAt:'2026-11-23'});
const state={schema:115,messages:[msg()],memories:[memory()]};
check(validateCoachState115(state),'Estructura válida');
for(const v of [null,[],{},42,{...state,schema:114},{...state,unexpected:1},{...state,messages:'not-array'},{...state,memories:{}},{...state,messages:[msg(),msg()]},{...state,memories:[memory(),memory()]},{...state,messages:[{...msg(),role:'system'}]},{...state,messages:[{...msg(),text:''}]},{...state,messages:[{...msg(),text:'x'.repeat(1501)}]},{...state,messages:[{...msg(),at:'2026-02-30'}]},{...state,messages:[{...msg(),id:'!'}]},{...state,memories:[{...memory(),note:'x'.repeat(501)}]},{...state,memories:[{...memory(),approvedAt:'2025-02-30'}]},{...state,messages:Array(81).fill(msg()).map((x,i)=>({...x,id:'message_'+String(i).padStart(8,'0')}))},{...state,memories:Array(31).fill(memory()).map((x,i)=>({...x,id:'memory_'+String(i).padStart(8,'0')}))}])same(validateCoachState115(v),false,'Rechazo de estado malformado');
const valid=prepareCoachRequest115({question:'¿Cómo voy?'});
same(valid.context,{},'Permisos por defecto NO comparten');
same(valid.memory,[],'Memoria por defecto ausente');
same(valid.conversation,[],'Historial por defecto ausente');
same(valid.externalAIEnabled,false,'No hay OpenAI');
same(Object.keys(valid.permissions).sort(),[...GRANTS115].sort(),'Reporte de grants completo');
for(const x of ['', ' ',null,42, 'a'.repeat(1001), '\u0000bad'])bad(()=>prepareCoachRequest115({question:x}),'QUESTION_REQUIRED');
for(const g of [null,[],{health:'yes'},{unknown:true},{health:null}])bad(()=>prepareCoachRequest115({question:'x',grants:g}),'INVALID_PERMISSIONS');
for(const g of GRANTS115){const grants={[g]:true};check(prepareCoachRequest115({question:'x',grants}).permissions[g]===true,'Grant explícito '+g);}
const snapshot={
 nutrition:{day:'2026-11-23',kcal:1999,proteinG:150,complete:true,photo:'SECRET_PHOTO',token:'SECRET_TOKEN'},
 training:{day:'2026-11-23',completedSessions7d:2,validSets7d:34,trendPct:-8,location:'SECRET_GPS'},
 health:{day:'2026-11-23',sleepHours:6.5,restingHeartRate:62,hrvMs:42,energyRating:3,record:'SECRET_HEALTH'},
 goals:{energyTarget:2000,proteinTarget:150,stepsTarget:8000},secret:'SECRET_KEY'
};
const none=prepareCoachRequest115({question:'x',snapshot});
check(!JSON.stringify(none).includes('SECRET'),'Sin grants no filtra datos');
for(const category of ['nutrition','training','health','goals']){
 const result=prepareCoachRequest115({question:'x',snapshot,grants:{[category]:true}});
 same(Object.keys(result.context),[category],'Scope allowlist '+category);
 check(!JSON.stringify(result).includes('SECRET'),'Filtra columnas secretas de '+category);
}
const all=prepareCoachRequest115({question:'x',snapshot,grants:{health:true,training:true,nutrition:true,goals:true}});
same(Object.keys(all.context).sort(),['goals','health','nutrition','training'],'Todos los compartimientos');
const invalidContext={...snapshot,health:{...snapshot.health,sleepHours:99,hrvMs:-1,restingHeartRate:20000,day:'2026-02-30'}};
same(prepareCoachRequest115({question:'x',snapshot:invalidContext,grants:{health:true}}).context,{health:{energyRating:3}},'Ignora métricas inválidas y conserva válidas');
const history=[msg()];const memories=[memory()];
same(prepareCoachRequest115({question:'x',history,memories}).conversation,[],'Historia no implícita');
same(prepareCoachRequest115({question:'x',history,memories}).memory,[],'Memoria no implícita');
same(prepareCoachRequest115({question:'x',history,memories,grants:{chatHistory:true}}).conversation[0].text,'Pregunta de prueba','Historial con permiso');
same(prepareCoachRequest115({question:'x',history,memories,grants:{memory:true}}).memory[0].note,'Preferencia de prueba','Memoria con permiso');
for(const v of [{...msg(),role:'system'},{...msg(),text:'x'.repeat(1501)},{...msg(),foo:true}])bad(()=>prepareCoachRequest115({question:'x',history:[v],grants:{chatHistory:true}}),'INVALID_HISTORY');
bad(()=>prepareCoachRequest115({question:'x',history:Array(7).fill(msg()),grants:{chatHistory:true}}),'INVALID_HISTORY');
for(const v of [{...memory(),note:'x'.repeat(501)},{...memory(),secret:'hi'}])bad(()=>prepareCoachRequest115({question:'x',memories:[v],grants:{memory:true}}),'INVALID_MEMORY');
bad(()=>prepareCoachRequest115({question:'x',memories:Array(11).fill(memory()),grants:{memory:true}}),'INVALID_MEMORY');
bad(()=>approveMemory115('memoria',{id:'memory_115_99'}),'EXPLICIT_MEMORY_SAVE_REQUIRED');
same(approveMemory115('memoria',{id:'memory_115_99',approved:true}).note,'memoria','Memoria requiere confirmación');
bad(()=>approveMemory115('memoria',{id:'memory_115_99',approved:true,at:'2026-02-30'}),'INVALID_MEMORY');
const a=await encryptCoachState115(state,PHRASE),b=await encryptCoachState115(state,PHRASE);
check(validateCoachEnvelope115(a),'Sobre válido');check(validateCoachEnvelope115(b),'Segundo sobre válido');
check(a.cipher!==b.cipher&&a.salt!==b.salt&&a.iv!==b.iv,'Cifrado aleatorio');
same(await decryptCoachState115(a,PHRASE),state,'Descifrado AES-GCM');
for(const v of [{...a,format:'plaintext'},{...a,extra:1},{...a,cipher:'AAAA'},{...a,iv:'AAAA'},{...a,salt:'AAAA'},null,42])same(validateCoachEnvelope115(v),false,'Rechazo de formato');
await reject(()=>encryptCoachState115({schema:115,messages:[{...msg(),role:'system'}],memories:[]},PHRASE),'INVALID_COACH_STATE');
await reject(()=>encryptCoachState115(state,'short'),'LAB_PASSPHRASE_REQUIRED');
await reject(()=>decryptCoachState115(a,'otra frase diferente muy larga'),'COACH_DECRYPT_OR_INTEGRITY_FAILED');
await reject(()=>decryptCoachState115({...a,cipher:'AAAA'},PHRASE),'INVALID_COACH_ENVELOPE');
const tampered={...a,cipher:a.cipher.slice(0,12)+(a.cipher[12]==='A'?'B':'A')+a.cipher.slice(13)};
await reject(()=>decryptCoachState115(tampered,PHRASE),'COACH_DECRYPT_OR_INTEGRITY_FAILED');
const result=await rehearsal115({verbose:false});check(result.checks>=50,'E2E comprueba al menos 50 caminos');
console.log(`V11.5: ${count} pruebas unitarias + ${result.checks} comprobaciones E2E offline. Sin red, sin datos personales, sin despliegue.`);
