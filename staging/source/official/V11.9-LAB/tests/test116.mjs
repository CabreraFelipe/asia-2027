// V11.6 offline unit + E2E regression. No external network, no actual health or push data.
import assert from 'node:assert/strict';
import {
 freshDeviceId116,freshReminderId116,validateHealthState116,encryptHealth116,decryptHealth116,
 encryptSyntheticPush116,decryptSyntheticPush116,fakePushSubscription116,
 validateEnvelope116,HEALTH_FORMAT116,PUSH_FORMAT116,DEVICE_RE116,REMINDER_RE116
} from '../wellness116-client.mjs';
import {rehearsal116} from '../scripts/rehearsal116.mjs';
let count=0;
const check=(c,label)=>{assert.ok(c,label);count++;};
const same=(a,b,label)=>{assert.deepEqual(a,b,label);count++;};
const reject=async(fn,reason)=>{await assert.rejects(fn,new RegExp(reason));count++;};
const phrase='frase de prueba larga, artificial, sin información de personas';
const device=freshDeviceId116(),other=freshDeviceId116();
const sample=(day='2026-11-23')=>({day,source:'synthetic-healthkit',steps:1234,sleepMinutes:450,restingHeartRate:60,hrvMs:35.25});
const health={schema:116,samples:[sample()]};
check(DEVICE_RE116.test(device),'ID aleatorio de dispositivo sintético');
check(DEVICE_RE116.test(other),'Otro ID válido');
check(device!==other,'ID de dispositivo impredecible');
check(REMINDER_RE116.test(freshReminderId116()),'ID aleatorio de recordatorio');
check(freshReminderId116()!==freshReminderId116(),'IDs de recordatorios distintos');
for(const id of ['', 'dev_short','dev_'+ 'f'.repeat(31),'dev_'+ 'g'.repeat(32),'Dev_'+ 'a'.repeat(32),'dev_'+ 'a'.repeat(33),'account_name',null,{},123])same(DEVICE_RE116.test(id),false,'ID de dispositivo rechazado');
for(const id of ['rem_1','rem_'+ 'z'.repeat(24),'rem_'+ 'a'.repeat(23),'rem_'+ 'a'.repeat(25),null,{}])same(REMINDER_RE116.test(id),false,'ID de recordatorio rechazado');
check(validateHealthState116(health),'Salud sintética válida');
check(validateHealthState116({schema:116,samples:[]}), 'Estado vacío permitido');
check(validateHealthState116({schema:116,samples:[sample('2026-11-21'),sample('2026-11-22')]}),'Múltiples fechas válidas');
for(const s of [null,{},[],false,10,{schema:115,samples:[]},{schema:116,samples:{}},{schema:116,samples:[sample()],accountId:'fake'},{schema:116,samples:[sample(),sample()]},{schema:116,samples:Array.from({length:32},(_,i)=>sample('2026-11-'+String(i+1).padStart(2,'0')))}])same(validateHealthState116(s),false,'Validación de estructura estricta');
for(const [field,value] of [
 ['day','2026-02-30'],['day','wrong'],['day','2026-11-23T02:00:00Z'],['source','Apple Health REAL'],['source','unknown'],
 ['steps',-1],['steps',100001],['steps',2.2],['steps','1234'],['sleepMinutes',1500],['sleepMinutes',-1],
 ['sleepMinutes',0.5],['restingHeartRate',24],['restingHeartRate',221],['restingHeartRate',NaN],
 ['hrvMs',-1],['hrvMs',401],['hrvMs',Infinity],['hrvMs','35']
])same(validateHealthState116({schema:116,samples:[{...sample(),[field]:value}]}),false,'Rechazo de campo fuera de contrato');
for(const o of [{...sample(),note:'NO_FREE_TEXT'}, {...sample(),gps:{lat:0}}, {...sample(),token:'SECRET'}, {...sample(),accountId:'other'}, {...sample(),steps:undefined}])same(validateHealthState116({schema:116,samples:[o]}),false,'No incluye columnas sensibles inesperadas');
const e1=await encryptHealth116(health,device,phrase),e2=await encryptHealth116(health,device,phrase);
check(validateEnvelope116(e1,HEALTH_FORMAT116),'Sobre Health válido');
check(validateEnvelope116(e2,HEALTH_FORMAT116),'Sobre Health aleatorio válido');
check(e1.salt!==e2.salt,'Salt aleatoria por cifrado');
check(e1.iv!==e2.iv,'IV aleatorio por cifrado');
check(e1.cipher!==e2.cipher,'Cifrado no determinista');
check(!JSON.stringify(e1).includes('1234'),'No hay pasos en claro');
check(!JSON.stringify(e1).includes('restingHeartRate'),'No hay nombres de métricas en claro');
same(await decryptHealth116(e1,device,phrase),health,'Cifrado y descifrado simétrico');
await reject(()=>decryptHealth116(e1,other,phrase),'DECRYPT_OR_INTEGRITY_FAILED');
await reject(()=>decryptHealth116(e1,device,'frase equivocada pero con longitud suficiente'),'DECRYPT_OR_INTEGRITY_FAILED');
await reject(()=>encryptHealth116({schema:116,samples:[{...sample(),photo:'SECRET'}]},device,phrase),'INVALID_HEALTH_STATE');
await reject(()=>encryptHealth116(health,'dev_invalid',phrase),'INVALID_DEVICE_ID');
await reject(()=>encryptHealth116(health,device,'short'),'LAB_PASSPHRASE_REQUIRED');
for(const e of [null,false,0,[],{}, {...e1,format:'plaintext'}, {...e1,format:PUSH_FORMAT116}, {...e1,salt:'BAD'}, {...e1,iv:'BAD'}, {...e1,cipher:'AAAA'}, {...e1,extra:true}, {...e1,salt:e1.salt.slice(1)}, {...e1,iv:e1.iv+'='}])same(validateEnvelope116(e,HEALTH_FORMAT116),false,'Rechazo de sobre malformado');
check(!validateEnvelope116(e1,PUSH_FORMAT116),'Format binding no confunde Health/Push');
const mod=(s)=>{const i=5;return s.slice(0,i)+(s[i]==='A'?'B':'A')+s.slice(i+1);};
await reject(()=>decryptHealth116({...e1,cipher:mod(e1.cipher)},device,phrase),'DECRYPT_OR_INTEGRITY_FAILED');
await reject(()=>decryptHealth116({...e1,salt:mod(e1.salt)},device,phrase),'DECRYPT_OR_INTEGRITY_FAILED');
await reject(()=>decryptHealth116({...e1,iv:mod(e1.iv)},device,phrase),'DECRYPT_OR_INTEGRITY_FAILED');
await reject(()=>decryptHealth116({...e1,cipher:'AAAA'},device,phrase),'INVALID_ENVELOPE');
await reject(()=>decryptHealth116(e1,device,'tiny'),'DECRYPT_OR_INTEGRITY_FAILED');
const sub=fakePushSubscription116(device);
check(sub.endpoint.startsWith('https://push.example.invalid/'),'Endpoint reservado e inerte');
check(!sub.endpoint.includes('localhost')&&!sub.endpoint.includes('workers.dev'),'No apunta a servidor real');
const sealed=await encryptSyntheticPush116(sub,device,phrase);
check(validateEnvelope116(sealed.envelope,PUSH_FORMAT116),'Sobre push válido');
check(/^[0-9a-f]{64}$/.test(sealed.fingerprint),'Huella de endpoint válida');
check(!JSON.stringify(sealed).includes('push.example.invalid'),'No hay endpoint en claro');
same(await decryptSyntheticPush116(sealed.envelope,device,phrase),sub,'Descifrar push solo con clave');
await reject(()=>decryptSyntheticPush116(sealed.envelope,other,phrase),'DECRYPT_OR_INTEGRITY_FAILED');
await reject(()=>decryptSyntheticPush116(sealed.envelope,device,'frase incorrecta de prueba muy larga'),'DECRYPT_OR_INTEGRITY_FAILED');
for(const v of [null,{}, {...sub,endpoint:'https://example.com/real'}, {...sub,endpoint:'http://push.example.invalid/synthetic/fake'}, {...sub,endpoint:'https://push.example.invalid/synthetic/abc?secret=x'}, {...sub,endpoint:'https://push.example.invalid/synthetic/abc#token'}, {...sub,endpoint:'https://user:pass@push.example.invalid/synthetic/abc'}, {...sub,endpoint:'https://push.example.invalid/real/abc'}, {...sub,auth:'tiny'}, {...sub,p256dh:0}, {...sub,token:'SECRET'}])await reject(()=>encryptSyntheticPush116(v,device,phrase),'INVALID_SYNTHETIC_SUBSCRIPTION');
assert.throws(()=>fakePushSubscription116('real'),/INVALID_DEVICE_ID/);count++;
await reject(()=>encryptSyntheticPush116(sub,device,'a'),'LAB_PASSPHRASE_REQUIRED');
const e3=await encryptHealth116({schema:116,samples:[{...sample(),source:'synthetic-healthconnect'}]},device,phrase);
check(validateEnvelope116(e3,HEALTH_FORMAT116),'Fuente Health Connect ficticia aceptada');
const e2e=await rehearsal116();check(e2e.checks>=100,'E2E cubre más de cien comprobaciones');
console.log(`V11.6: ${count} pruebas unitarias + ${e2e.checks} comprobaciones E2E offline. Sin red, sin datos personales, sin despliegue.`);
