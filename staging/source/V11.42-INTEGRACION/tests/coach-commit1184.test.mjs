import assert from 'node:assert/strict';
import {createCoachCommit1184,guardProPlan1195,createLocalPlanningFence1195} from '../dist/assets/v11.42/staging/source/V11.42-INTEGRACION/src/coach-commit1184.mjs';
import {seedGym,applyGym} from '../dist/assets/v11.42/gym84.mjs';
const today='2026-11-26',accountId='acct_'+'a'.repeat(32),id='coachchange-'+'b'.repeat(32),pid='prog-'+'c'.repeat(32);
const api={A:globalThis.asiaCoachActions1179,Gym:globalThis.asiaGym826,S:globalThis.asiaSchedule829,T:globalThis.asiaTraining102,R:globalThis.asiaRunning1174,Sport:globalThis.asiaSport1177,N:globalThis.asiaNutrition103,G:globalThis.asiaExtras830.goals101};
const base={body:{'2026-11-20':{weight:80}},diet:{},work:{'2026-11-24_4':{ex:{}}},photos:{},journal96:{'2026-11-20':'Histórico'},settings:{goals101:{version:2,primary:'',items:[]},personalCalendar1173:today,routines826:[{name:'Fuerza A',entries:[{exercise:'Press banca con barra',sets:3,min:8,max:10,rest:90}]},{name:'Fuerza B',entries:[{exercise:'Sentadilla con barra',sets:3,min:8,max:10,rest:90}]}],programmes102:[{id:pid,name:'Fuerza',start:today,end:'2026-12-15',objective:'Fuerza',equipment:'Gimnasio completo',minutes:60,days:[{weekday:2,slot:4},{weekday:4,slot:5}],cancelled:false}]}};
const raw={day:'2026-12-01',scope:'future',reason:'Agregar espalda',availableExercises:['Remo con pecho apoyado'],operations:[{type:'add',at:1,entry:{exercise:'Remo con pecho apoyado',sets:2,min:8,max:10,rest:90}}]},p=api.A.review(base,raw,id,today,api);
let snap={accountId,revision:1,proRevision:1,diary:JSON.stringify(base)},gym={revision:1,payload:seedGym()},writes=0;
const copy=x=>JSON.parse(JSON.stringify(x)),editing={coachSnapshot:async()=>copy(snap),moduleStore:{read:async()=>copy(gym)},async commitCoachDiary(expected,diary){assert.deepEqual(expected,snap);snap={...snap,revision:snap.revision+1,diary};writes++;return {accountId,revision:snap.revision,proRevision:snap.proRevision}}};
const c=createCoachCommit1184({editing,verify:async()=>{},today:()=>today,canUse:()=>true}),before=snap.diary;
await c.review('strength',p,before);assert.equal(writes,0);
await assert.rejects(()=>c.apply('strength',{...p,view:{...p.view,dates:[]}},before));assert.equal(writes,0);
await c.review('strength',p,before);snap.proRevision++;await assert.rejects(()=>c.apply('strength',p,before));assert.equal(writes,0);
gym={revision:2,payload:applyGym(seedGym(),{type:'plan',id:'synthetic-plan',date:'2026-12-01',routineId:seedGym().routines[0].id})};await assert.rejects(()=>c.review('strength',p,before));assert.equal(writes,0);gym={revision:3,payload:seedGym()};snap.proRevision++;
await c.review('strength',p,before);const r=await c.apply('strength',p,before);assert.equal(r.localOnly,true);assert.equal(writes,1);const next=JSON.parse(r.diary);assert.deepEqual(next.work,base.work);assert.deepEqual(next.journal96,base.journal96);assert.deepEqual(next.settings.routines826.slice(0,2),base.settings.routines826);assert.deepEqual(next.body,base.body);assert.deepEqual(next.diet,base.diet);assert.deepEqual(next.photos,base.photos);assert.equal(api.S.planned('2026-12-01',next.settings),6);await assert.rejects(()=>c.apply('strength',p,before));
const rawBundle={version:1,strength:null,running:null,sport:null,nutrition:{confirmedValues:true,apply:false,plan:{name:'Prueba',kind:'Mantenimiento',review:'',calories:2300,protein:120,fat:65,shares:[20,30,20,30]}}},ids={strength:null,running:null,sport:null,nutrition:'nut-'+'d'.repeat(32)},bundle=globalThis.asiaCoachBundle1180.review(next,rawBundle,ids,today,api,{calories:2000,protein:150});
await c.review('bundle',bundle,snap.diary);const saved=await c.apply('bundle',bundle,snap.diary);assert.equal(writes,2);assert.equal(JSON.parse(saved.diary).settings.nutrition103.plans[0].name,'Prueba');assert.deepEqual(JSON.parse(saved.diary).work,base.work);console.log('Coach UI commit: native recompute, PRO conflict, duplicate, historical preservation and bundle PASS (injected encrypted commit boundary)');

 // V11.94: manual sport / reduction uses the same encrypted commit boundary.
 const goal='goal-'+'1'.repeat(32),profile='sportprofile-'+'2'.repeat(32),sportPlan='sportplan-'+'3'.repeat(32),reductionPlan='sportplan-'+'4'.repeat(32);
 const original=JSON.parse(snap.diary),goals={version:2,primary:goal,items:[{id:goal,title:'Fútbol',kind:'Rendimiento deportivo',target:'Mejorar',motivation:'',start:today,deadline:'',status:'Activa',closedOn:'',result:''}]};
 const prof={id:profile,goalId:goal,created:today,sport:'Fútbol',other:'',position:'Extremo',level:'Habitual',strength:'Habitual',plyometrics:'Habitual',context:'Recreativo',priorities:['Aceleración','Cambios de dirección','Equilibrio','Potencia'],location:'Cancha',surface:'Césped',inventory:['Conos','Tapas o discos','Mancuernas'],minutes:40,symptoms:'Sin síntomas preocupantes',safeSpace:true};
 const sporty={...original,settings:{...original.settings,goals101:goals},sport1177:api.Sport.put(undefined,'profiles',prof,goals,today)};
 snap={...snap,revision:snap.revision+1,diary:JSON.stringify(sporty)};
 const draft=api.Sport.draft({profileId:profile,start:'2026-12-16',end:'2026-12-29',days:[2,4],replaces:null},sporty.sport1177,goals,sporty.settings,sporty.running1174,today,api.S,api.R,sporty.work);
 const request={draft,key:sportPlan,view:{rows:draft.rows}},sportBefore=snap.diary;
 await c.review('sport',request,sportBefore);assert.equal(writes,2);
 await assert.rejects(()=>c.apply('sport',{...request,view:{rows:[]}},sportBefore));assert.equal(writes,2);
 await c.review('sport',request,sportBefore);snap.proRevision++;await assert.rejects(()=>c.apply('sport',request,sportBefore));assert.equal(writes,2);
 await c.review('sport',request,sportBefore);const sportSaved=await c.apply('sport',request,sportBefore);assert.equal(writes,3);
 const afterSport=JSON.parse(sportSaved.diary);assert.deepEqual(afterSport.work,sporty.work);assert.deepEqual(afterSport.settings,sporty.settings);assert.deepEqual(afterSport.sport1177.plans[sportPlan].rows,draft.rows);
 const reduction=api.Sport.draftReduction({planId:sportPlan,start:'2026-12-18',days:[2],lowOnly:false},afterSport.sport1177,goals,afterSport.settings,afterSport.running1174,today,api.S,api.R,afterSport.work);
 const reductionRequest={draft:reduction,key:reductionPlan,view:{rows:reduction.plan.rows}},reductionBefore=snap.diary;
 await c.review('sportReduction',reductionRequest,reductionBefore);c.discard();await assert.rejects(()=>c.apply('sportReduction',reductionRequest,reductionBefore));assert.equal(writes,3);
 await c.review('sportReduction',reductionRequest,reductionBefore);const reducedSaved=await c.apply('sportReduction',reductionRequest,reductionBefore);assert.equal(writes,4);
 const reducedSport=JSON.parse(reducedSaved.diary);assert.deepEqual(reducedSport.sport1177.plans[sportPlan],afterSport.sport1177.plans[sportPlan]);assert.deepEqual(reducedSport.sport1177.plans[reductionPlan].rows,reduction.plan.rows);assert.deepEqual(reducedSport.work,sporty.work);console.log('Sport coordinated commit: exact review, stale revision, discard and preserved original PASS');

 // V11.95: inverse ordinary PRO planning guard. Unchanged conflicts do not block history.
 const originalGym=seedGym(),sportDay=draft.rows[0].day;
 const planGym=(state,date,id='new-plan')=>applyGym(state,{type:'plan',id,date,routineId:state.routines[0].id});
 const conflictGym=planGym(originalGym,sportDay);
 assert.throws(()=>guardProPlan1195(sportSaved.diary,originalGym,conflictGym,today),/Coincidencia/);
 assert.doesNotThrow(()=>guardProPlan1195(sportSaved.diary,conflictGym,conflictGym,today));
 assert.doesNotThrow(()=>guardProPlan1195(sportSaved.diary,conflictGym,originalGym,today));
 assert.doesNotThrow(()=>guardProPlan1195(sportSaved.diary,originalGym,planGym(originalGym,'2026-11-20'),today));
 const moderateRow=draft.rows.find(r=>r.drills.some(d=>api.Sport.find(d.exerciseId).impact==='moderada'));
 assert.ok(moderateRow);assert.throws(()=>guardProPlan1195(sportSaved.diary,originalGym,planGym(originalGym,api.Sport.add(moderateRow.day,1)),today),/moderada|Coincidencia/);
 assert.doesNotThrow(()=>guardProPlan1195(JSON.stringify(original),originalGym,conflictGym,today));
 const fence=createLocalPlanningFence1195();let release;const hold=fence(()=>new Promise(r=>{release=r}));await assert.rejects(()=>fence(async()=>{}),/curso/);release();await hold;assert.equal(await fence(async()=>42),42);await assert.rejects(()=>fence(async()=>{throw Error('test')}));assert.equal(await fence(async()=>43),43);
 console.log('Inverse sports PRO planning guard and local write fence PASS');

 // V11.99.3 onboarding uses the same reviewed encrypted write boundary.
 assert.equal(typeof globalThis.asiaGoals101?.validate,'function','El módulo puro de metas debe exponer su API incluso en CommonJS');
 assert.equal(typeof globalThis.asiaGoals101?.upsert,'function');
 assert.equal(typeof globalThis.asiaGoals101?.select,'function');
 const onboardApi={G:globalThis.asiaGoals101,S:api.S,T:api.T,R:api.R,N:api.N,gym:api.Gym},O=globalThis.asiaOnboard1176;
 const obData=JSON.parse(snap.diary),obIds={goal:'goal-'+'5'.repeat(32),program:'prog-'+'6'.repeat(32),running:'runplan-'+'7'.repeat(32),nutrition:'nut-'+'8'.repeat(32)};
 const obRaw={goal:{title:'Carrera de prueba',kind:'Running',target:'10K',motivation:'',start:'2027-02-01',deadline:'2027-03-01'},primary:false,personalStart:null,strength:{config:{name:'Fuerza febrero',objective:'Bienestar general',equipment:'Mancuernas y banco',minutes:45,start:'2027-02-01',end:'2027-02-21',days:[1,4]},templates:null},running:{distanceM:10000,targetSeconds:null,raceDate:'2027-03-01',start:'2027-02-01',end:'2027-02-21',days:[3,6],weeklyMinutes:90,longestMinutes:40,profile:{level:'Habitual',surface:'Cinta',availableMinutes:40,progress:false,symptoms:'Sin síntomas preocupantes'}},nutrition:null};
 const ob=O.review(obData,obRaw,obIds,today,onboardApi,{calories:2000,protein:150}),obBefore=snap.diary,obWrites=writes;
 gym={revision:gym.revision+1,payload:planGym(seedGym(),'2027-02-01')};snap.proRevision++;
 await assert.rejects(()=>c.review('onboard',ob,obBefore),/PRO|ocupadas/);assert.equal(writes,obWrites);
 gym={revision:gym.revision+1,payload:seedGym()};snap.proRevision++;
 await c.review('onboard',ob,obBefore);assert.equal(writes,obWrites);c.discard();await assert.rejects(()=>c.apply('onboard',ob,obBefore));assert.equal(writes,obWrites);
 await c.review('onboard',ob,obBefore);snap.proRevision++;await assert.rejects(()=>c.apply('onboard',ob,obBefore));
 await c.review('onboard',ob,obBefore);const obSaved=await c.apply('onboard',ob,obBefore);assert.equal(writes,obWrites+1);const obAfter=JSON.parse(obSaved.diary);
 assert.deepEqual(obAfter,O.apply(obData,ob,today,onboardApi,{calories:2000,protein:150}));assert.deepEqual(obAfter.work,obData.work);assert.deepEqual(obAfter.sport1177,obData.sport1177);assert.ok(obAfter.running1174.plans[obIds.running]);await assert.rejects(()=>c.apply('onboard',ob,obBefore));
 console.log('Coordinated onboarding: native proposal, PRO collision, discard, stale revision, historical preservation PASS');
