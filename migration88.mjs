import './extras830.js';
import './gym826.js';
import './schedule829.js';
// Revision 08: local-only portable backup and conservative V6 -> PRO migration.
import {dayOK,validate84,empty84,checksum84,encrypt84,decrypt84} from './model84.mjs';
import {validateGym,seedGym} from './gym84.mjs';
import {clonePayload} from './store84.mjs';
import {importFoods84,history84} from './integration84.mjs';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const image=x=>typeof x==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(x);
const badKey=k=>['__proto__','constructor','prototype'].includes(k)||/token|secret|password|api.?key|authorization|vapid|credential/i.test(k);
const size=x=>new TextEncoder().encode(JSON.stringify(x)).length;
const check=(yes,message)=>{if(!yes)throw Error(message)};
export const MAX_V6_BYTES=25_000_000;
export const MAX_ENVELOPE_BYTES=42_000_000;
// Accept the actual V6.0.1 local or downloaded cloud JSON structure. Never sanitize
// silently: reject invalid/credential-containing backups and preserve all accepted fields.
export function inspectLegacy88(x){
 check(object(x)&&['body','diet','work'].every(k=>object(x[k]))&&(!Object.hasOwn(x,'settings')||object(x.settings))&&(!Object.hasOwn(x,'photos')||object(x.photos)),'No es un respaldo V6.0.1 válido.');
 const stack=[[x,0]],seen=new WeakSet();let n=0;
 while(stack.length){const [v,d]=stack.pop();check(++n<=300000&&d<=24,'Respaldo demasiado complejo.');if(v===null||typeof v==='string'||typeof v==='boolean'||finite(v))continue;check((object(v)||Array.isArray(v))&&!seen.has(v),'Valor no permitido.');seen.add(v);for(const [k,a] of Object.entries(v)){check(!badKey(k),'El respaldo contiene un campo no permitido; no se copió nada.');stack.push([a,d+1])}}
 check(size(x)<=MAX_V6_BYTES,'Respaldo superior a 25 MB.');
 for(const [d,b] of Object.entries(x.body)){check(dayOK(d)&&object(b)&&finite(b.weight)&&b.weight>=20&&b.weight<=300,'Medición anterior inválida.');check(b.photo==null||b.photo===''||image(b.photo),'Foto Xiaomi inválida.');}
 for(const [d,r] of Object.entries(x.diet)){check(dayOK(d)&&object(r),'Día anterior inválido.');for(const k of ['foods52','substitutions44'])if(Object.hasOwn(r,k))check(Array.isArray(r[k])&&r[k].every(object),'Detalle anterior inválido.');}
 if(x.settings?.routines826!==undefined)globalThis.asiaGym826.templates(x.settings);
 if(x.settings?.schedule829!==undefined)globalThis.asiaSchedule829.clean(x.settings);
 for(const [k,w] of Object.entries(x.work)){check((x.settings?.routines826!==undefined?globalThis.asiaGym826.slotOK(k,x.settings):/^\d{4}-\d{2}-\d{2}_[0-3]$/.test(k))&&dayOK(k.slice(0,10))&&object(w)&&object(w.ex),'Sesión anterior inválida.');for(const sets of Object.values(w.ex)){check(Array.isArray(sets)&&sets.length<=30,'Series anteriores inválidas.');for(const a of sets)check(object(a)&&(a.kg==null||finite(a.kg)&&a.kg>=0)&&(a.reps==null||finite(a.reps)&&a.reps>=0)&&(!Object.hasOwn(a,'done')||typeof a.done==='boolean')&&(!Object.hasOwn(a,'rir828')||Number.isInteger(a.rir828)&&a.rir828>=0&&a.rir828<=10),'Serie anterior inválida.');}}
 for(const [k,p] of Object.entries(x.photos||{}))check(object(p)&&dayOK(p.date)&&['Frente','Perfil','Espalda','Otra'].includes(p.view)&&k===p.date+'_'+p.view&&image(p.img),'Foto de evolución inválida.');
 globalThis.asiaExtras830.diary(x);
 const photos=Object.keys(x.photos||{}).length+Object.values(x.body).filter(b=>b.photo).length;
 return {measurements:Object.keys(x.body).length,dietDays:Object.keys(x.diet).length,foodRows:Object.values(x.diet).reduce((n,r)=>n+(r.foods52?.length||0),0),workouts:Object.keys(x.work).length,photos,favorites:Array.isArray(x.settings?.favorites52)?x.settings.favorites52.length:0,recipes:Array.isArray(x.settings?.recipes52)?x.settings.recipes52.length:0};
}
function pairData88(pair){check(pair&&['preferences','gym'].every(k=>Number.isSafeInteger(pair[k]?.revision)&&pair[k].revision>=0),'Revisiones locales inválidas.');const preferences=pair.preferences.revision?structuredClone(pair.preferences.payload):empty84(),gym=pair.gym.revision?structuredClone(pair.gym.payload):seedGym();clonePayload(preferences);clonePayload(gym);validate84(preferences);validateGym(gym);check(!gym.active,'Finalizá la sesión PRO antes de continuar.');return {preferences,gym};}
// Preview is side-effect free, and a day is copied entirely or not at all.
export async function planMigration88(legacy,pair){
 const inventory=inspectLegacy88(legacy),original=pairData88(pair);let next=original.preferences;const days=[];
 for(const [day,r] of Object.entries(legacy.diet).sort(([a],[b])=>a.localeCompare(b))){const rows=r.foods52;if(!rows?.length)continue;let status='pendiente';
  if(Object.hasOwn(next.legacyMigration84||{},day))status='ya importado';
  else if(next.foods.some(f=>f.day===day)||next.trash.some(t=>t.area==='foods'&&t.item.day===day))status='conflicto diario/papelera';
  else try{next=importFoods84(next,day,rows);status='copiable'}catch{status='detalle inválido o límite de almacenamiento'}
  days.push({day,count:rows.length,status});
 }
 return {inventory,days,copyDays:days.filter(d=>d.status==='copiable').length,copyRows:days.filter(d=>d.status==='copiable').reduce((n,d)=>n+d.count,0),next,sourceHash:await checksum84(legacy),beforeHash:await checksum84(original),expected:{preferences:pair.preferences.revision,gym:pair.gym.revision},history:history84(legacy.work,original.gym)};
}
// Recompute at application time; callers must explicitly confirm after backup download.
export async function applyMigration88(store,legacy,preview){check(preview?.copyRows>0,'No hay días nuevos para copiar.');const pair=await store.readPair(),actual=await planMigration88(legacy,pair);check(actual.sourceHash===preview.sourceHash&&actual.beforeHash===preview.beforeHash&&actual.expected.preferences===preview.expected.preferences&&actual.expected.gym===preview.expected.gym&&JSON.stringify(actual.days)===JSON.stringify(preview.days),'Cambió el archivo o los registros. Repetí la vista previa.');const original=pairData88(pair);return store.replacePair(actual.expected,{preferences:actual.next,gym:original.gym});}
// The V6 source is kept intact, including optional photos and legacy fields. Only
// encrypted archives are exported. The archive is not a server-side sync payload.
export async function makePortable88(legacy,pair,pass){inspectLegacy88(legacy);const {preferences,gym}=pairData88(pair);const payload={format:'asia84-portable-v1',created:new Date().toISOString(),legacy:structuredClone(legacy),preferences,gym};return encrypt84({payload,sha256:await checksum84(payload)},pass);}
export async function readPortable88(envelope,pass){check(object(envelope)&&envelope.format==='asia84-encrypted-v1'&&size(envelope)<=MAX_ENVELOPE_BYTES,'Se requiere un respaldo portátil cifrado.');const x=await decrypt84(envelope,pass);check(x?.payload?.format==='asia84-portable-v1'&&x.sha256===await checksum84(x.payload),'Integridad inválida o tipo de respaldo incorrecto.');const p=x.payload;inspectLegacy88(p.legacy);clonePayload(p.preferences);clonePayload(p.gym);validate84(p.preferences);validateGym(p.gym);check(!p.gym.active,'El archivo contiene una sesión activa.');return p;}
