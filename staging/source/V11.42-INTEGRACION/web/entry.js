import {discoverAccess1153,renewAccess1153} from './managed-entry1153.mjs';
const $=id=>document.getElementById(id),status=t=>$('entryStatus').textContent=t;
if('serviceWorker' in navigator)navigator.serviceWorker.register('/v11.42/sw.js',{scope:'/v11.42/'}).catch(()=>{});
let busy=false;
const controls=disabled=>{$('openAccount').disabled=$('advancedUnlock').disabled=$('retryAccess1153').disabled=disabled};
async function open(access,phrase,maintenanceOnly){
 await renewAccess1153(access.identity);
 const {start}=await import('./app.mjs');const state=await start(phrase,{maintenanceOnly,expectedIdentity:access.identity});
 $('unlock').hidden=true;$('retryAccess1153').hidden=true;$('googleLogin').hidden=true;
 status(state==='editing'?'Cuenta verificada. Diario abierto.':state==='locked'?'Sesión bloqueada. Volvé a iniciar sesión.':maintenanceOnly?'Cuenta verificada. Herramientas avanzadas.':'Cuenta verificada. No se abrió el diario; revisá el mensaje y las herramientas avanzadas.');
}
async function attempt({manual=false}={}){
 if(busy||$('shell1140'))return;
 busy=true;controls(true);let phrase=manual?$('phrase').value:'';const advanced=manual&&$('advancedUnlock').checked;$('phrase').value='';$('retryAccess1153').hidden=true;status('Verificando tu cuenta…');
 try{
  const access=await discoverAccess1153();
  if(access.mode==='anonymous'){$('unlock').hidden=false;status('Iniciá sesión con Google.');return}
  if(access.mode==='legacy'){
   $('unlock').hidden=false;
   if(!manual){status('Cuenta verificada. Ingresá la frase anterior mientras se completa la migración.');return}
   if(phrase.length<12){status('Ingresá una frase de al menos 12 caracteres.');return}
   await open(access,phrase,advanced);return;
  }
  $('unlock').hidden=true;
  await open(access,access.secret,advanced);
 }catch{
  status('No se pudo verificar el acceso o abrir los registros. No se reemplazó la clave. Reintentá o verificá tu cuenta.');
  $('retryAccess1153').hidden=false;
 }finally{phrase='';busy=false;controls(false)}
}
await attempt();
$('openAccount').onclick=()=>attempt({manual:true});
$('retryAccess1153').onclick=()=>attempt();
