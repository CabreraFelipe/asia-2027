import {encrypt84,decrypt84,checksum84} from './model84.mjs';
const lists={
 'asia-layout-v51': ['day','dailyCoach','workout','recovery','weight','energy','advice','reminders','vacation','badges','coach','backup'],
 'asia-layout-v541-diet':['overview','daily','adaptive','foods','nutrition','water','measure','charts','history','compare','calendar','photos','weekly'],
 'asia-layout-v541-training':['work','strength','sessions','calendar','muscle'],
 'asia-layout-v541-health':['health','history','coach','daily','watch','transfer','sources'],
 'asia-layout-v541-progress54':['overview','stats','photos','report','simulator']};
export const keys830=['asia-theme-v4',...Object.keys(lists),'asia-layout-v822'];
const check=(x,m)=>{if(!x)throw Error(m)}, obj=x=>x&&typeof x==='object'&&!Array.isArray(x),exact=(x,ks)=>obj(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k));
const list=(a,ks)=>Array.isArray(a)&&a.length<=ks.length&&new Set(a).size===a.length&&a.every(k=>ks.includes(k));
function group(x,ks,folded){const props=folded?['order','hidden','folded']:['order','hidden'];check((exact(x,props)||(folded&&exact(x,[...props,'singleOpen'])&&typeof x.singleOpen==='boolean'))&&props.every(k=>list(x[k],ks)),'Preferencia de diseño incompatible');}
export function validPref830(key,raw){check(keys830.includes(key),'Clave de preferencia no permitida');if(raw===null)return raw;check(typeof raw==='string'&&raw.length<=4096,'Preferencia demasiado grande');if(key==='asia-theme-v4'){check(/^(dark|light)(?::(?:ocean|forest|graphite))?$/.test(raw),'Tema inválido');return raw;}const x=JSON.parse(raw);if(key==='asia-layout-v822'){check(exact(x,['metrics','shortcuts','compact'])&&typeof x.compact==='boolean','Preferencia de Inicio inválida');group(x.metrics,['weight','steps','kcal','protein'],false);group(x.shortcuts,['gym','diet','xiaomi','planner','reminders','progress','coach'],false);}else group(x,lists[key],true);return raw;}
export function snapshot830(storage){return Object.fromEntries(keys830.map(k=>[k,validPref830(k,storage.getItem(k))]));}
function validate(snapshot){check(exact(snapshot,keys830),'Copia de preferencias inválida');for(const k of keys830)validPref830(k,snapshot[k]);return snapshot;}
async function seal(payload,pass){return encrypt84({payload,sha256:await checksum84(payload)},pass);}
async function unseal(envelope,pass,format){check(JSON.stringify(envelope).length<=150000,'Archivo demasiado grande');const e=await decrypt84(envelope,pass);check(e?.payload?.format===format&&e.sha256===await checksum84(e.payload),'Copia incompatible o alterada');return e.payload;}
export async function export830(storage,pass){return seal({format:'asia84-preferences-r30',values:snapshot830(storage)},pass);}
export async function read830(envelope,pass){return validate((await unseal(envelope,pass,'asia84-preferences-r30')).values);}
export function plan830(storage,source,key){validate(source);const before=validPref830(key,storage.getItem(key)),after=validPref830(key,source[key]);check(before!==after,'Sin cambios en esta preferencia');return {key,before,after};}
export async function ticket830(plan,pass){validPref830(plan.key,plan.before);validPref830(plan.key,plan.after);check(plan.before!==plan.after,'Sin cambios');return seal({format:'asia84-prefs-rollback-r30',...plan},pass);}
async function ticketRead(envelope,pass){const p=await unseal(envelope,pass,'asia84-prefs-rollback-r30');validPref830(p.key,p.before);validPref830(p.key,p.after);check(p.before!==p.after,'Rollback inválido');return p;}
function commit(storage,key,before,after){check(storage.getItem(key)===before,'La preferencia cambió. Repetí la vista previa.');if(after===null)storage.removeItem(key);else storage.setItem(key,after);check(storage.getItem(key)===after,'No se pudo verificar el resultado');}
export async function apply830(storage,source,plan,envelope,pass){const p=await ticketRead(envelope,pass),next=plan830(storage,source,plan.key);check(['key','before','after'].every(k=>p[k]===plan[k]&&plan[k]===next[k]),'Cambió la fuente o la vista previa');commit(storage,p.key,p.before,p.after);}
export async function undo830(storage,envelope,pass){const p=await ticketRead(envelope,pass);commit(storage,p.key,p.after,p.before);}
