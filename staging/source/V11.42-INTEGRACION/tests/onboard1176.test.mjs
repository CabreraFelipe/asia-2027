import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import {makePortable88,readPortable88,inspectLegacy88} from '../dist/assets/v11.42/migration88.mjs';
const dir=new URL('../dist/assets/v11.42/diary/',import.meta.url).pathname,ctx=createContext({module:{exports:{}}});
for(const n of ['core105.js','extras830.js','gym826.js','schedule829.js','goals101.js','training102.js','nutrition103.js','onboard1176.js']){
 ctx.module.exports={};runInContext(readFileSync(dir+n,'utf8'),ctx,{filename:n});if(n==='goals101.js')ctx.goalApi=ctx.module.exports;
}
const api={G:ctx.goalApi,S:ctx.asiaSchedule829,T:ctx.asiaTraining102,R:ctx.asiaRunning1174,N:ctx.asiaNutrition103,gym:ctx.asiaGym826},O=ctx.asiaOnboard1176;
const plain=x=>JSON.parse(JSON.stringify(x)),today='2026-11-26',ids={goal:'goal-'+'a'.repeat(32),program:'prog-'+'b'.repeat(32),running:'runplan-'+'c'.repeat(32),nutrition:'nut-'+'d'.repeat(32)};
const original={body:{'2026-11-20':{weight:80}},diet:{'2026-11-20':{}},work:{},settings:{goals101:{version:2,primary:'',items:[]}},photos:{},journal96:{'2026-11-20':'Histórico'}};
const raw={goal:{title:'Mi carrera',kind:'Running',target:'10K',motivation:'Bienestar',start:today,deadline:'2027-01-07'},primary:true,personalStart:today,strength:{config:{name:'Mi fuerza',objective:'Bienestar general',equipment:'Mancuernas y banco',minutes:45,start:today,end:'2027-01-06',days:[1,4]},templates:null},running:{distanceM:10000,targetSeconds:null,raceDate:'2027-01-07',start:today,end:'2027-01-06',days:[3,6],weeklyMinutes:90,longestMinutes:40,profile:{level:'Habitual',surface:'Cinta',availableMinutes:40,progress:false,symptoms:'Sin síntomas preocupantes'}},nutrition:{apply:true,plan:{name:'Mi estrategia',kind:'Rendimiento deportivo',review:'',calories:2400,protein:120,fat:70,shares:[20,30,20,30]}}};
const current={calories:2000,protein:150},before=JSON.stringify(original);
const p=plain(O.review(original,raw,ids,today,api,current));assert.equal(JSON.stringify(original),before);assert.ok(p.view.training&&p.view.run&&p.view.nutrition);
const next=plain(O.apply(original,p,today,api,current));assert.equal(JSON.stringify(original),before);
for(const k of ['body','diet','work','photos','journal96'])assert.deepEqual(next[k],original[k]);
assert.equal(next.settings.goals101.primary,ids.goal);assert.equal(next.settings.programmes102.length,1);assert.equal(next.settings.coachKcal50,2400);assert.equal(next.settings.nutrition103.history.length,1);assert.ok(next.running1174.plans[ids.running]);
assert.throws(()=>O.apply(next,p,today,api,current));assert.throws(()=>O.apply(original,{...p,view:{...p.view,run:null}},today,api,current));
assert.throws(()=>O.apply({...original,settings:{...original.settings,other:1}},p,today,api,current));
assert.throws(()=>O.review(original,{...raw,running:{...raw.running,days:[1,4]}},ids,today,api,current));
assert.throws(()=>O.review(original,{...raw,running:{...raw.running,profile:{...raw.running.profile,symptoms:'Sí / no estoy seguro'}}},ids,today,api,current));
assert.throws(()=>O.review({...original,settings:{}},raw,ids,today,api,current));
assert.throws(()=>O.review({...original,work:{[today+'_0']:{ex:{}}}},raw,ids,today,api,current));
inspectLegacy88(next);
const pair={preferences:{revision:0,payload:{}},gym:{revision:0,payload:{}}},phrase='frase sintetica onboarding';
assert.deepEqual((await readPortable88(await makePortable88(next,pair,phrase),phrase)).legacy,next);
console.log('Manual onboarding: review/reject, atomic diary proposal, stable goal/program/run IDs, nutrition, stale and duplicate rejection, hybrid and archive PASS');

const ids2={goal:'goal-'+'e'.repeat(32),program:'prog-'+'f'.repeat(32),running:'runplan-'+'1'.repeat(32),nutrition:'nut-'+'2'.repeat(32)};
const onlyGoal={goal:{title:'Hábitos propios',kind:'Hábitos',target:'',motivation:'',start:today,deadline:''},primary:false,personalStart:null,strength:null,running:null,nutrition:null};
const goalOnly=plain(O.apply(original,O.review(original,onlyGoal,ids2,today,api,current),today,api,current));
assert.equal(Object.hasOwn(goalOnly,'running1174'),false);assert.equal(Object.hasOwn(goalOnly.settings,'nutrition103'),false);assert.equal(Object.hasOwn(goalOnly.settings,'programmes102'),false);assert.equal(goalOnly.settings.goals101.primary,ids2.goal);
const nextGoal=plain(O.apply(next,O.review(next,onlyGoal,ids2,today,api,{calories:2400,protein:120}),today,api,{calories:2400,protein:120}));
assert.equal(nextGoal.settings.goals101.primary,ids.goal);assert.deepEqual(nextGoal.settings.goals101.items[0],next.settings.goals101.items[0]);assert.deepEqual(nextGoal.running1174,next.running1174);assert.deepEqual(nextGoal.settings.nutrition103,next.settings.nutrition103);assert.deepEqual(nextGoal.settings.programmes102,next.settings.programmes102);
console.log('Optional goal-only onboarding does not create unused modules or change prior goals and plans PASS');
