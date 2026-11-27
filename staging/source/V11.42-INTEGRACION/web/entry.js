import {discoverAccess1153,renewAccess1153,requestFreshPilotProfile} from './managed-entry1153.mjs';
const $=id=>document.getElementById(id),status=t=>$('entryStatus').textContent=t;
if('serviceWorker' in navigator)navigator.serviceWorker.register('/v11.42/sw.js',{scope:'/v11.42/'}).catch(()=>{});
let busy=false,freshAccess=null;
const controls=disabled=>{$('openAccount').disabled=$('advancedUnlock').disabled=$('retryAccess1153').disabled=$('freshPilotProfile').disabled=disabled};
async function open(access,phrase,maintenanceOnly){
 await renewAccess1153(access.identity);
 const {start}=await import('./app.mjs');const state=await start(phrase,{maintenanceOnly,expectedIdentity:access.identity,managedRecovery:access.mode==='managed'});
 $('unlock').hidden=true;$('freshPilotProfile').hidden=true;freshAccess=null;$('retryAccess1153').hidden=true;$('googleLogin').hidden=true;
 status(state==='editing'?'Cuenta verificada. Diario abierto.':state==='locked'?'Sesión bloqueada. Volvé a iniciar sesión.':maintenanceOnly?'Cuenta verificada. Herramientas avanzadas.':'Cuenta verificada. No se abrió el diario; revisá el mensaje y las herramientas avanzadas.');
}
async function attempt({manual=false}={}){
 if(busy||$('shell1140'))return;
 busy=true;controls(true);freshAccess=null;$('freshPilotProfile').hidden=true;let phrase=manual?$('phrase').value:'';const advanced=manual&&$('advancedUnlock').checked;$('phrase').value='';$('retryAccess1153').hidden=true;status('Verificando tu cuenta…');
 try{
  const access=await discoverAccess1153();
  if(access.mode==='anonymous'){$('unlock').hidden=true;status('Iniciá sesión con Google.');return}
  if(access.mode==='legacy'){
   $('unlock').hidden=false;
   if(access.freshProfileAvailable===true){freshAccess=access;$('freshPilotProfile').hidden=false;}
   if(!manual){status('Cuenta verificada. Ingresá la frase anterior mientras se completa la migración.');return}
   if(phrase.length<12){status('Ingresá una frase de al menos 12 caracteres.');return}
   await open(access,phrase,advanced);return;
  }
  $('unlock').hidden=true;
  await open(access,access.secret,advanced);
 }catch(e){
  status(e?.code==='WRITER_BUSY'?'La cuenta está abierta en otra pestaña. Cerrala y reintentá.':e?.code==='WRITER_UNAVAILABLE'?'Este navegador no permite coordinar la edición segura. Usá un navegador compatible.':'No se pudo verificar el acceso o abrir los registros. No se reemplazó la clave. Reintentá o verificá tu cuenta.');
  $('retryAccess1153').hidden=false;
 }finally{phrase='';busy=false;controls(false)}
}
$('freshPilotProfile').onclick=async()=>{
 if(busy||!freshAccess||$('shell1140'))return;
 if(!confirm('¿Empezar con un perfil de prueba vacío? Los registros anteriores seguirán cifrados y separados. Esta acción no afecta V10.6.'))return;
 busy=true;controls(true);$('phrase').value='';status('Preparando tu nuevo perfil de prueba…');
 try{await requestFreshPilotProfile(freshAccess);location.replace('/v11.11/auth/start');}
 catch{status('No se pudo confirmar el perfil nuevo. Volvé a iniciar sesión con Google antes de reintentar.');$('googleLogin').hidden=false;$('unlock').hidden=true;$('freshPilotProfile').hidden=true;$('retryAccess1153').hidden=false;freshAccess=null;}
 finally{busy=false;controls(false)}
};
await attempt();
$('openAccount').onclick=()=>attempt({manual:true});
$('retryAccess1153').onclick=()=>attempt();
