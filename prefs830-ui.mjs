import {keys830,export830,read830,plan830,ticket830,apply830,undo830} from './prefs830.mjs';
const e=id=>document.getElementById(id),status=t=>e('status').textContent=t,pass=()=>e('pass').value;
const labels=['Tema','Inicio · tarjetas','Dieta · tarjetas','Gym · tarjetas','Salud · tarjetas','Progreso · tarjetas','Inicio · indicadores y accesos'];
let source=null,plan=null,busy=false;
for(const [i,k] of keys830.entries())e('key').add(new Option(labels[i],k));
function keyDisplay(v){try{return JSON.parse(v)}catch{return v}}
function clear(){plan=null;e('diff').textContent='';e('ack').checked=false;}
function download(x,name){const u=URL.createObjectURL(new Blob([JSON.stringify(x)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
async function file(id){const f=e(id).files[0];if(!f||f.size>150000)throw Error('Elegí un archivo válido.');return JSON.parse(await f.text());}
function action(id,fn){e(id).onclick=async()=>{if(busy)return;busy=true;try{if(location.protocol!=='https:'||location.hostname!=='cabrerafelipe.github.io')throw Error('Solo el origen HTTPS de Asia 2027.');await fn();}catch(err){status('No se completó: '+err.message);}finally{busy=false;}};}
action('export',async()=>{download(await export830(localStorage,pass()),'asia84-preferencias-cifradas.json');status('Copia preparada; verificá la descarga.');});
action('read',async()=>{source=null;clear();source=await read830(await file('file'),pass());status('Copia verificada. Elegí una preferencia.');});e('file').onchange=()=>{source=null;clear();};e('key').onchange=clear;
action('preview',()=>{clear();if(!source)throw Error('Abrí una copia primero');plan=plan830(localStorage,source,e('key').value);e('diff').replaceChildren();for(const [label,value] of [['Actual',plan.before],['Copia',plan.after]]){const p=document.createElement('p');p.textContent=label+': '+(value===null?'Predeterminado':JSON.stringify(keyDisplay(value)));e('diff').append(p);}status('Vista previa sin cambios guardados.');});
action('ticket',async()=>{if(!plan)throw Error('Prepará una vista previa');download(await ticket830(plan,pass()),'asia84-preferencias-rollback.json');status('Volvé a seleccionar el rollback descargado.');});
action('apply',async()=>{if(!plan||!e('ack').checked)throw Error('Revisá la vista previa y confirmá');await apply830(localStorage,source,plan,await file('rollback'),pass());clear();status('Preferencia restaurada. Reabrí la app para verla.');});
action('undo',async()=>{if(!e('ack').checked||!confirm('¿Deshacer esta preferencia si no cambió desde la restauración?'))return;await undo830(localStorage,await file('rollback'),pass());clear();status('Preferencia anterior recuperada.');});
