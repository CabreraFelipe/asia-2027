const $=id=>document.getElementById(id),status=t=>$('entryStatus').textContent=t;
async function refreshSessionNotice(){
 try{
  const r=await fetch('/v11.11/auth/me',{credentials:'same-origin',cache:'no-store',redirect:'error'});
  if(!r.ok)return;
  const s=await r.json();
  if(s.ok===true&&s.syntheticOnly===true&&!$('unlock').hidden&&!$('openAccount').disabled){
   status('Sesión de Google verificada. Ingresá tu frase de cifrado para abrir el candidato.');
   $('googleLogin').hidden=true;
  }
 }catch{}
}
refreshSessionNotice();
if('serviceWorker' in navigator)navigator.serviceWorker.register('/v11.42/sw.js',{scope:'/v11.42/'}).catch(()=>status('No se pudo preparar el aviso offline.'));
$('openAccount').onclick=async()=>{
 const b=$('openAccount'),p=$('phrase').value;$('phrase').value='';if(p.length<12){status('Ingresá una frase de al menos 12 caracteres.');return}b.disabled=true;
 try{
  const r=await fetch('/v11.11/auth/me',{credentials:'same-origin',cache:'no-store',redirect:'error'});if(!r.ok)throw Error('Sesión no disponible');const s=await r.json();if(s.ok!==true||s.syntheticOnly!==true)throw Error('Sesión inválida');
  const {start}=await import('./app.mjs');await start(p);$('unlock').hidden=true;$('googleLogin').hidden=true;status('Cuenta de prueba verificada.');
 }catch{status('No se pudo abrir el candidato. Verificá sesión y frase.');b.disabled=false}
};
