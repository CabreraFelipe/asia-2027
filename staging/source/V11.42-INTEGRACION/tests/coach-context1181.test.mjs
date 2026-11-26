import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import {validateInput,validateReply} from '../src/coach-inference1181.mjs';
const dir=new URL('../dist/assets/v11.42/diary/',import.meta.url).pathname,ctx=createContext({module:{exports:{}}});
for(const n of ['core105.js','extras830.js','gym826.js','schedule829.js','training102.js','coach-context1181.js']){ctx.module.exports={};runInContext(readFileSync(dir+n,'utf8'),ctx,{filename:n});}
const C=ctx.asiaCoachContext1181,api={A:ctx.asiaCoachActions1179,Gym:ctx.asiaGym826,S:ctx.asiaSchedule829,T:ctx.asiaTraining102,R:ctx.asiaRunning1174,Sport:ctx.asiaSport1177},plain=x=>JSON.parse(JSON.stringify(x)),today='2026-11-26',date='2026-12-01',pid='prog-'+'a'.repeat(32),id='coachchange-'+'b'.repeat(32);
const original={body:{'2026-11-20':{weight:80}},diet:{},work:{'2026-11-24_4':{ex:{}}},photos:{},journal96:{'2026-11-20':'No enviar nota privada'},settings:{goals101:{version:2,primary:'',items:[]},personalCalendar1173:today,customUnknown:{keep:true},routines826:[{name:'Rutina previa',entries:[{exercise:'Press banca con barra',sets:3,min:8,max:10,rest:90}]},{name:'Otra rutina',entries:[{exercise:'Sentadilla con barra',sets:3,min:8,max:10,rest:90}]}],programmes102:[{id:pid,name:'Mi programa',start:today,end:'2026-12-15',objective:'Fuerza',equipment:'Gimnasio completo',minutes:60,days:[{weekday:2,slot:4},{weekday:4,slot:5}],cancelled:false}]}};
const selection={day:date,scope:'future',question:'Agregar espalda',goal:'Fuerza',availableExercises:['Remo con pecho apoyado']};
const local=plain(C.preview(original,selection,today,api)),input=local.input;
assert.doesNotThrow(()=>validateInput(input));assert.deepEqual(Object.keys(input).sort(),['availableMinutes','choices','goal','question','routine','scope','version']);for(const secret of [pid,'No enviar nota privada','customUnknown','2026-12-01'])assert.ok(!JSON.stringify(input).includes(secret));
const reply={kind:'proposal',answer:'Agregar remo',questions:[],operations:[{type:'add',at:1,to:null,choice:'e1',sets:2,min:8,max:10,rest:90}]};
validateReply(reply,input);
const before=JSON.stringify(original);assert.throws(()=>C.toNative(original,local,reply,false,id,today,api));assert.throws(()=>C.toNative(original,local,{...reply,operations:[{...reply.operations[0],choice:'e99'}]},true,id,today,api));
assert.throws(()=>C.toNative({...original,settings:{...original.settings,customUnknown:{keep:false}}},local,reply,true,id,today,api));
const p=plain(C.toNative(original,local,reply,true,id,today,api));assert.equal(JSON.stringify(original),before);assert.equal(p.view.dates.length,3);const next=plain(api.A.apply(original,p,today,api));assert.deepEqual(next.work,original.work);assert.deepEqual(next.journal96,original.journal96);assert.deepEqual(next.settings.routines826.slice(0,2),original.settings.routines826);assert.equal(api.S.planned(date,next.settings),6);
console.log('Coach context: data minimization, local review and native execution, account-local identifiers not transmitted PASS');
