// V8.4.6: explicit whole-snapshot restore, recoverable cross-store writes.
import {read844,COACH_KEYS844} from './backup844.mjs';
import {keys830,snapshot830,validPref830} from './prefs830.mjs';
import {safePair84} from './sync84.mjs';
import {inspectLegacy88,MAX_ENVELOPE_BYTES} from './migration88.mjs';
import {checksum84,encrypt84,decrypt84,validate84} from './model84.mjs';
import {validateGym} from './gym84.mjs';
import {clonePayload} from './store84.mjs';
const keys=['asia2027-v1',...keys830,...COACH_KEYS844];
const modules=['preferences','gym'];
const check=(x,m)=>{if(!x)throw Error(m)};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const empty=()=>({body:{},diet:{},work:{},settings:{}});
export function idle846(storage,session){
 for(const s of [storage,session].filter(Boolean)){
  check(JSON.parse(s.getItem('asia-gym-active53')||'null')===null,'Finalizá o descartá la sesión de Gym.');
  const t=JSON.parse(s.getItem('asia-timers-v4')||'null');check(!t||(!t.start&&!t.elapsed&&!t.rest),'Finalizá los temporizadores.');
 }
 const b=JSON.parse(storage.getItem('asia-backup-v42')||'null');check(!b||b.auto===false,'Pausá primero las copias automáticas anteriores desde Inicio.');
}
const rawSnapshot=s=>Object.fromEntries(keys.map(k=>[k,s.getItem(k)]));
const revisions=p=>Object.fromEntries(modules.map(k=>[k,p[k].revision]));
function validateState(s){
 check(s&&s.raw&&Object.keys(s.raw).length===keys.length&&keys.every(k=>Object.hasOwn(s.raw,k)),'Copia local incompleta');
 if(s.raw[keys[0]]!==null){check(typeof s.raw[keys[0]]==='string','Diario inválido');inspectLegacy88(JSON.parse(s.raw[keys[0]]));}
 for(const k of keys830)validPref830(k,s.raw[k]);
 for(const k of COACH_KEYS844)if(s.raw[k]!==null){check(typeof s.raw[k]==='string'&&s.raw[k].length<=400000,'Coach inválido');clonePayload({value:JSON.parse(s.raw[k])});}
 clonePayload(s.pair.preferences);clonePayload(s.pair.gym);validate84(s.pair.preferences);validateGym(s.pair.gym);check(!s.pair.gym.active,'Hay una sesión PRO activa');
 return s;
}
export async function capture846(storage,store,session){idle846(storage,session);const raw=rawSnapshot(storage),p=await store.readPair(),r=revisions(p),{local,gym}=safePair84(p);check(modules.every(k=>Number.isSafeInteger(r[k])&&r[k]>=0&&r[k]<Number.MAX_SAFE_INTEGER-3),'Revisión inválida');idle846(storage,session);check(eq(raw,rawSnapshot(storage)),'Los datos cambiaron durante la lectura');return {state:validateState({raw,pair:{preferences:local,gym}}),r};}
export function target846(p){return validateState({raw:{[keys[0]]:JSON.stringify(p.legacy),...p.presentation844,...p.coach844},pair:{preferences:p.preferences,gym:p.gym}})}
function counts(s){let d=inspectLegacy88(s.raw[keys[0]]===null?empty():JSON.parse(s.raw[keys[0]]));return {...d,proSessions:s.pair.gym.sessions.length,proFoods:s.pair.preferences.foods.length,proMeasures:s.pair.preferences.measurements.length,proWellness:s.pair.preferences.wellness.length,preferences:keys830.filter(k=>s.raw[k]!==null).length,coach:COACH_KEYS844.filter(k=>s.raw[k]!==null).length}}
export async function plan846(storage,store,session,source){const before=await capture846(storage,store,session),after=target846(source);const a=before.state.raw[keys[0]]===null?empty():JSON.parse(before.state.raw[keys[0]]),b=source.legacy;let differences=[];for(const area of new Set([...Object.keys(a),...Object.keys(b)])){const x=a[area],y=b[area];if(x&&y&&typeof x==='object'&&typeof y==='object'&&!Array.isArray(x)&&!Array.isArray(y)){for(const k of new Set([...Object.keys(x),...Object.keys(y)]))if(!eq(x[k],y[k]))differences.push({area,key:k,action:!Object.hasOwn(y,k)?'quitar':!Object.hasOwn(x,k)?'agregar':'reemplazar'});}else if(!eq(x,y))differences.push({area,key:'',action:y===undefined?'quitar':x===undefined?'agregar':'reemplazar'});}
 return {before:before.state,r:before.r,after,beforeHash:await checksum84(before.state),afterHash:await checksum84(after),beforeCounts:counts(before.state),afterCounts:counts(after),differences,changedKeys:keys.filter(k=>before.state.raw[k]!==after.raw[k]),pairChanged:!eq(before.state.pair,after.pair)};}
export async function ticket846(plan,pass){const p={format:'asia84-integral-rollback-v846',before:plan.before,r:plan.r,afterRawHashes:Object.fromEntries(await Promise.all(keys.map(async k=>[k,await checksum84(plan.after.raw[k])]))),afterPairHash:await checksum84(plan.after.pair),beforeHash:plan.beforeHash,afterHash:plan.afterHash};return encrypt84({payload:p,sha256:await checksum84(p)},pass);}
async function readTicket(e,pass){check(e?.format==='asia84-encrypted-v1'&&JSON.stringify(e).length<=MAX_ENVELOPE_BYTES,'Archivo de vuelta atrás inválido');const v=await decrypt84(e,pass),p=v?.payload;check(p?.format==='asia84-integral-rollback-v846'&&v.sha256===await checksum84(p),'Archivo alterado o incompatible');validateState(p.before);check(p.beforeHash===await checksum84(p.before)&&modules.every(k=>Number.isSafeInteger(p.r[k])&&p.r[k]>=0&&p.r[k]<Number.MAX_SAFE_INTEGER-3)&&keys.every(k=>/^[0-9a-f]{64}$/.test(p.afterRawHashes[k]))&&/^[0-9a-f]{64}$/.test(p.afterPairHash)&&/^[0-9a-f]{64}$/.test(p.afterHash),'Archivo de vuelta atrás inválido');return p;}
function writeRaw(storage,before,after){for(const k of keys){check(storage.getItem(k)===before[k],'Otra ventana modificó '+k);if(before[k]===after[k])continue;if(after[k]===null)storage.removeItem(k);else storage.setItem(k,after[k]);check(storage.getItem(k)===after[k],'No se verificó '+k);}}
async function undoWith(storage,store,session,p){const now=await capture846(storage,store,session),h=await checksum84(now.state.pair),old=await checksum84(p.before.pair);const isBefore=h===old,isAfter=h===p.afterPairHash;check((isBefore&&modules.every(k=>now.r[k]===p.r[k]||now.r[k]===p.r[k]+2|| (isAfter&&now.r[k]===p.r[k]+1)))||(isAfter&&modules.every(k=>now.r[k]===p.r[k]+1)),'Los registros PRO tienen cambios posteriores; no se deshizo nada.');for(const k of keys)check(now.state.raw[k]===p.before.raw[k]||await checksum84(now.state.raw[k])===p.afterRawHashes[k],'Hay cambios posteriores en '+k+'; no se deshizo nada.');idle846(storage,session);check(eq(rawSnapshot(storage),now.state.raw),'Cambió el diario');if(!isBefore)await store.replacePair(now.r,p.before.pair);idle846(storage,session);writeRaw(storage,now.state.raw,p.before.raw);const final=await capture846(storage,store,session);check(await checksum84(final.state)===p.beforeHash,'No se pudo verificar la vuelta atrás. Conservá el archivo.');return final;}
export async function undo846(storage,store,session,envelope,pass){return undoWith(storage,store,session,await readTicket(envelope,pass));}
export async function apply846(storage,store,session,source,preview,envelope,pass){const p=await readTicket(envelope,pass),plan=await plan846(storage,store,session,source);check(plan.beforeHash===preview.beforeHash&&plan.afterHash===preview.afterHash&&plan.beforeHash===p.beforeHash&&plan.afterHash===p.afterHash&&eq(plan.r,preview.r)&&eq(plan.r,p.r),'Los datos o la copia cambiaron. Repetí el análisis.');check(plan.beforeHash!==plan.afterHash,'No hay cambios para aplicar');idle846(storage,session);check(eq(rawSnapshot(storage),plan.before.raw),'Cambió el diario');let wrote=false;try{await store.replacePair(plan.r,plan.after.pair);wrote=true;idle846(storage,session);writeRaw(storage,plan.before.raw,plan.after.raw);const after=await capture846(storage,store,session);check(await checksum84(after.state)===plan.afterHash&&modules.every(k=>after.r[k]===plan.r[k]+1),'No se pudo verificar la recuperación');return after;}catch(e){if(!wrote)throw e;try{await undoWith(storage,store,session,p);}catch{throw Error('Restauración interrumpida: no se pudo confirmar la vuelta atrás. Conservá el archivo y usá Deshacer antes de volver a Inicio.');}throw Error('Restauración cancelada; se verificó la vuelta atrás. '+e.message);}}
export const open846=read844;
