/* V10.5 — shared, pure domain policy. No storage, DOM or network. */
(function(root){'use strict';
const asia=Object.freeze({id:'asia-2027',title:'Asia 2027',kind:'weight',targetKg:72,preparation:'2026-11-16',start:'2026-11-23',deadline:'2027-03-08',vacationStart:'2026-12-26',vacationEnd:'2027-01-07'});
const day=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const vacation=d=>day(d)&&d>=asia.vacationStart&&d<=asia.vacationEnd;
const active=d=>day(d)&&d>=asia.start&&d<asia.deadline&&!vacation(d);
const manual=Object.freeze({calories:Object.freeze([1200,4500]),protein:Object.freeze([40,250])});
const coach=Object.freeze({calories:Object.freeze([1900,2300,100]),protein:Object.freeze([130,170,10]),steps:Object.freeze([1000,12000,1000])});
const defaults=Object.freeze({calories:2000,protein:150});
const inRange=(value,b)=>typeof value==='number'&&Number.isFinite(value)&&value>=b[0]&&value<=b[1];
const valid=(value,k)=>Object.hasOwn(manual,k)&&inRange(value,manual[k]);
const manualTarget=g=>Number.isInteger(g?.calories)&&Number.isInteger(g?.protein)&&valid(g.calories,'calories')&&valid(g.protein,'protein')&&g.protein*4<=g.calories;
const recordedTarget=g=>valid(g?.calories,'calories')&&valid(g?.protein,'protein')&&g.protein*4<=g.calories;
const coachTarget=g=>Number.isInteger(g?.calories)&&Number.isInteger(g?.protein)&&inRange(g.calories,coach.calories)&&inRange(g.protein,coach.protein);
const api=Object.freeze({asia,day,vacation,active,manual,coach,defaults,valid,manualTarget,recordedTarget,coachTarget});root.asiaCore105=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
