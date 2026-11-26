const $=id=>document.getElementById(id),status=t=>$('entryStatus').textContent=t;
if('serviceWorker' in navigator)navigator.serviceWorker.register('/v11.42/sw.js',{scope:'/v11.42/'}).catch(()=>status('No se pudo preparar el aviso offline.'));
$('openAccount').onclick=async()=>{
 const b=$('openAccount'),advanced=$('advancedUnlock'),p=$('phrase').value,maintenanceOnly=advanced.checked;$('phrase').value='';if(p.length<12){status('Ingresá una frase de al menos 12 caracteres.');return}b.disabled=advanced.disabled=true;status('Verificando tu cuenta…');
 try{
  const r=await fetch('/v11.11/auth/me',{credentials:'same-origin',cache:'no-store',redirect:'error'});if(!r.ok)throw Error('Sesión no disponible');const s=await r.json();if(s.ok!==true||s.syntheticOnly!==true)throw Error('Sesión inválida');
  const renewed=await fetch('/v11.11/auth/renew',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',headers:{'X-Asia-CSRF':s.csrf}});if(!renewed.ok||(await renewed.json()).ok!==true)throw Error('No se pudo renovar la sesión');
  const {start}=await import('./app.mjs');const state=await start(p,{maintenanceOnly});$('unlock').hidden=true;$('googleLogin').hidden=true;status(state==='editing'?'Cuenta verificada. Diario abierto.':state==='locked'?'Sesión bloqueada. Volvé a iniciar sesión.':maintenanceOnly?'Cuenta verificada. Herramientas avanzadas.':'Cuenta verificada. No se abrió el diario; revisá el mensaje y las herramientas avanzadas.');
 }catch{status('No se pudo abrir el candidato. Verificá sesión y frase.');b.disabled=advanced.disabled=false}
};
