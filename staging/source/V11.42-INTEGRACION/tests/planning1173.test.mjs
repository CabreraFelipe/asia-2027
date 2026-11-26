import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
const dir=new URL('../dist/assets/v11.42/diary/',import.meta.url).pathname;
assert.equal(readFileSync(dir+'schedule829.js','utf8'),readFileSync(dir+'../schedule829.js','utf8'));
assert.equal(readFileSync(dir+'schedule829.js','utf8'),readFileSync(new URL('../dist/server/schedule829.js',import.meta.url),'utf8'));
const ctx=createContext({module:{exports:{}}});
// The original planner's CommonJS branch imports its already loaded schedule.
// Permit only this exact dependency; never execute an unpatched root module.
ctx.require=specifier=>{assert.equal(specifier,'./schedule829.js');return ctx.asiaSchedule829};
for(const n of ['core105.js','gym826.js','schedule829.js','training102.js','planner820.js']){ctx.module.exports={};runInContext(readFileSync(dir+n,'utf8'),ctx,{filename:n})}
const s=ctx.asiaSchedule829,t=ctx.asiaTraining102,p=ctx.module.exports;
const today='2026-11-26',prior='2026-11-23',future='2026-11-30',legacy={};
const cfg={name:'Plan personal',objective:'Fuerza',equipment:'Mancuernas y banco',minutes:45,start:today,end:'2027-01-20',days:[1,4]};
assert.equal(s.planned(prior,legacy),0);assert.equal(s.planned(future,legacy),0);
assert.throws(()=>t.generate(cfg,legacy));
const personal=JSON.parse(JSON.stringify({goals101:{version:2,primary:'',items:[]},personalCalendar1173:today}));
assert.equal(s.planned(prior,personal),0);assert.equal(s.planned(future,personal),null);
assert.throws(()=>s.programmes({personalCalendar1173:today}));
assert.throws(()=>s.programmes({...personal,personalCalendar1173:'2026-02-30'}));
const draft=t.generate(cfg,personal);const next=t.activate(personal,draft,today,'prog-'+'a'.repeat(32));
assert.equal(s.planned(prior,next),0);assert.equal(s.planned(today,next),5);assert.equal(s.planned(future,next),4);
assert.equal(s.programmeAt(today,next).name,'Plan personal');assert.equal(s.planned('2026-12-26',next),null);
assert.equal(s.planned('2026-12-28',next),4);assert.equal(s.planned('2027-01-25',next),null);
assert.throws(()=>s.move({settings:next,work:{}},today,'2026-11-27',today));
assert.equal(personal.routines826,undefined);assert.equal(next.routines826.length,2);
const agenda=p.agenda({settings:next,work:{},diet:{},body:{}},future,today);assert.equal(agenda.planned,2);assert.equal(agenda.days[0].control,false);
console.log('Personal planning: legacy preserved, opt-in dates, early programme, independent holiday calendar, stable slots and weekly agenda PASS');
