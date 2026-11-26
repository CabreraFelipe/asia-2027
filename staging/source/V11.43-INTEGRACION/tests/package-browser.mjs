// Real package Worker and browser over loopback HTTPS. No production network or credentials.
import assert from 'node:assert/strict';
import {createServer} from 'node:https';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,extname} from 'node:path';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import worker from '../../V11.42-INTEGRACION/dist/server/index.mjs';
import {digest} from '../../V11.42-INTEGRACION/dist/server/staging/source/official/V11.24-STAGING/src/security1111.mjs';
const host='asia-v1142-candidate-staging.example.workers.dev',origin='https://'+host,home=origin+'/v11.42/index.html',root=new URL('../../V11.42-INTEGRACION/dist/',import.meta.url).pathname;
const A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),C='acct_'+'c'.repeat(32),ta='A'.repeat(43),tb='B'.repeat(43),tc='C'.repeat(43),db=new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
for(const n of ['0001_staging.sql','0006_identity_oidc.sql','0007_synthetic_journal_v115.sql','0009_large_sync.sql'])db.exec(readFileSync(root+'migrations/'+n,'utf8'));
db.exec(readFileSync(new URL('../../V11.42-INTEGRACION/migrations/0010_managed_keys.proposed.sql',import.meta.url),'utf8'));
for(const [id,t,email,csrf] of [[A,ta,'a@example.invalid','a'.repeat(43)],[B,tb,'b@example.invalid','b'.repeat(43)],[C,tc,'c@example.invalid','c'.repeat(43)]]){
 db.prepare('INSERT INTO accounts_v11 VALUES(?,?,?,?)').run(id,'https://accounts.google.com',email,new Date().toISOString());
 db.prepare('INSERT INTO auth_oidc_sessions_v1111(token_digest,account_id,csrf,email_digest,created_at,expires_at) VALUES(?,?,?,?,?,?)').run(await digest(t),id,csrf,await digest(email),Date.now(),Date.now()+600000);
}
db.prepare('INSERT INTO managed_account_keys_v1152(account_id,enrollment_kind) VALUES(?,\'new\')').run(C);
const objects=new Map(),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.css':'text/css; charset=utf-8'};
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_ALLOW_V1142_TESTS:'true',STAGING_ALLOW_V1138_TESTS:'true',STAGING_ALLOW_V1139_TESTS:'true',STAGING_GOOGLE_CLIENT_ID:'test.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-only',STAGING_ALLOWED_EMAILS:'a@example.invalid,b@example.invalid,c@example.invalid',STAGING_ALLOW_MANAGED_KEYS_1152:'true',STAGING_MANAGED_KEK_ID_1152:'ci-v1',STAGING_MANAGED_KEK_1152:Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url'),
 STAGING_DB:{prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){return db.prepare(sql).run(...args)}}}},
 STAGING_SYNC_OBJECTS:{async put(k,v){objects.set(k,new Uint8Array(v))},async get(k){const v=objects.get(k);return v?{size:v.length,arrayBuffer:async()=>v.buffer.slice(0)}:null},async delete(k){objects.delete(k)}},
 STAGING_PWA_ASSETS:{async fetch(r){const p=new URL(r.url).pathname;try{return new Response(await readFile(root+'assets'+p),{headers:{'Content-Type':mime[extname(p)]||'application/octet-stream'}})}catch{return new Response(null,{status:404})}}}
};
const dir=await mkdtemp(join(tmpdir(),'asia-pwa-ci-'));let chrome,ws,server,offline=false,slowRequested=false,failHead=false,slowMode=process.env.ASIA_SLOW_DIARY==='1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(dir,'key.pem'),'-out',join(dir,'cert.pem'),'-days','1','-subj','/CN='+host,'-addext','subjectAltName=DNS:'+host],{stdio:'ignore'});
 server=createServer({key:readFileSync(join(dir,'key.pem')),cert:readFileSync(join(dir,'cert.pem'))},async(req,res)=>{
  try{
   if(offline){req.socket.destroy();return}
   const u=new URL(req.url,origin);
   if(['/__ci/a','/__ci/b','/__ci/c'].includes(u.pathname)){res.writeHead(200,{'Set-Cookie':'__Host-asia1111_session='+(u.pathname.endsWith('/a')?ta:u.pathname.endsWith('/b')?tb:tc)+'; Path=/; Secure; HttpOnly; SameSite=Lax','Cache-Control':'no-store'});res.end('fixture');return}
   if(u.pathname==='/__ci/offline'){res.end('offline');offline=true;return}
   if(u.pathname==='/__ci/head-fail'){failHead=true;res.end('fixture');return}
   if(u.pathname==='/__ci/head-resume'){failHead=false;res.end('fixture');return}
   if(failHead&&u.pathname==='/v11.38/sync'&&req.method==='GET'){res.writeHead(503);res.end('fixture');return}
   const chunks=[];for await(const x of req)chunks.push(x);
   const r=await worker.fetch(new Request(u,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:chunks.length?{body:Buffer.concat(chunks)}:{})}),env);
   const h=Object.fromEntries(r.headers);if(r.headers.getSetCookie().length)h['set-cookie']=r.headers.getSetCookie();
   let body=Buffer.from(await r.arrayBuffer());
   if(slowMode&&!slowRequested&&u.pathname==='/v11.42/diary/index.html'&&r.ok){body=Buffer.from(body.toString('utf8').replace(/<\/body>/i,'<img alt="" src="/v11.42/diary/asia-icon-v4-192.png?v=12345678" style="width:1px;height:1px"></body>'));delete h['content-length'];}
   if(slowMode&&u.pathname==='/v11.42/diary/asia-icon-v4-192.png'&&u.search==='?v=12345678'){slowRequested=true;console.log('CI secondary image delayed');await sleep(20000);}
   if(r.status>=400&&r.status!==401)console.log('CI HTTP',r.status,u.pathname);res.writeHead(r.status,h);res.end(body);
  }catch(e){console.error('CI server',e.message);res.writeHead(500);res.end()}
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');
 let port=0;
 for(let attempt=0;attempt<3;attempt++){
  const profile=join(dir,'profile-'+attempt);
  chrome=spawn(process.env.CHROME_BIN||'google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--disable-background-networking','--ignore-certificate-errors','--host-resolver-rules=MAP '+host+' 127.0.0.1:'+server.address().port+', MAP * ~NOTFOUND, EXCLUDE localhost','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
  let log='';chrome.stderr.on('data',b=>log=(log+b).slice(-3000));chrome.on('error',e=>log+=e.message);
  for(let i=0;i<200;i++){if(chrome.exitCode!==null)break;try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);if(port&&(await fetch('http://127.0.0.1:'+port+'/json/version',{signal:AbortSignal.timeout(1000)})).ok)break;port=0}catch{port=0}await sleep(100)}
  if(port)break;console.log('Chrome startup:',log);chrome.kill();await sleep(1000)
 }
 assert.ok(port,'Chrome CDP no disponible');
 const page=await (await fetch('http://127.0.0.1:'+port+'/json/new?'+encodeURIComponent(home),{method:'PUT'})).json();
 ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true})});
 let seq=0;function cmd(method,params={}){return new Promise((ok,fail)=>{const id=++seq,t=setTimeout(()=>{ws.removeEventListener('message',listen);fail(Error('CDP timeout '+method))},120000);function listen(e){const m=JSON.parse(e.data);if(m.id!==id)return;clearTimeout(t);ws.removeEventListener('message',listen);if(m.error||m.result?.exceptionDetails)fail(Error(JSON.stringify(m.error||m.result.exceptionDetails)));else ok(m.result)}ws.addEventListener('message',listen);ws.send(JSON.stringify({id,method,params}))})}
 // Only log failed network paths and browser diagnostic errors from this synthetic fixture.
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Network.responseReceived'&&m.params.response.status>=400){const u=new URL(m.params.response.url);console.log('Browser HTTP',m.params.response.status,u.pathname)}if(m.method==='Runtime.exceptionThrown')console.log('Browser exception',m.params.exceptionDetails.exception?.description?.slice(0,500)||m.params.exceptionDetails.text);if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')console.log('Browser error',m.params.entry.text.slice(0,500))});
 await cmd('Network.enable');await cmd('Runtime.enable');await cmd('Log.enable');
 // Intercept only the original photo origin inside isolated Chrome. Use a valid
 // local PNG for decoding; the original URL and CSP must still be exercised.
 const photoSource='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/',photoRequests=new Set(),unexpectedPhotoRequests=[];
 const fixturePhoto=readFileSync(root+'assets/v11.42/asia-icon-v4-192.png').toString('base64');
 ws.addEventListener('message',async e=>{
  const m=JSON.parse(e.data);if(m.method!=='Fetch.requestPaused')return;
  const {requestId,request,resourceType}=m.params;
  const url=request.url;
  try{
   if(resourceType==='Image'&&url.startsWith(photoSource)&&/^[A-Za-z0-9_-]+\/[01]\.jpg$/.test(url.slice(photoSource.length))){
    photoRequests.add(url);await cmd('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'image/png'},{name:'Cache-Control',value:'no-store'}],body:fixturePhoto});
   }else{unexpectedPhotoRequests.push(url);await cmd('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'})}
  }catch(e){console.log('CI photo interception error',e.message)}
 });
 await cmd('Fetch.enable',{patterns:[{urlPattern:'https://raw.githubusercontent.com/*'}]});
 const evalJS=async(expression,awaitPromise=false)=>(await cmd('Runtime.evaluate',{expression,awaitPromise,returnByValue:true})).result.value;
 async function ready(expr){for(let i=0;i<200;i++){try{if(await evalJS(expr))return}catch{}await sleep(100)}throw Error('Página no disponible: '+expr)}
 await ready("location.href==="+JSON.stringify(home)+"&&document.readyState==='complete'&&typeof document.getElementById('openAccount')?.onclick==='function'");
 const result=await evalJS('('+async function(){
  const check=(x,m)=>{if(!x)throw Error(m)},el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m+' | '+(el('message1140')?.textContent||'sin mensaje')+' | '+(el('status1140')?.textContent||'sin estado'))};
  const phrase='frase sintética paquete completo';
  check((await fetch('/v11.42/app.mjs')).status===401,'Asset anónimo');
  el('phrase').value=phrase;el('openAccount').click();await wait(()=>!el('openAccount').disabled,'Acceso anónimo no terminó');check(!el('shell1140'),'Shell anónimo');
  await fetch('/__ci/a');check((await fetch('/v11.11/auth/me')).ok,'Cookie sintética no disponible');
  check(!el('advancedUnlock').checked,'Herramientas avanzadas activadas por defecto');
  el('phrase').value=phrase;el('openAccount').click();await wait(()=>!!el('open1140'),'Shell no inicializado: '+el('entryStatus').textContent);
  await wait(()=>{if(el('message1140').textContent.startsWith('No se completó:'))throw Error(el('message1140').textContent);return document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!el('close1140').disabled},'Diario empaquetado no inició');
  check(!document.querySelector('iframe').inert,'Interacción no habilitada tras verificar Gym');
  if(document.querySelector('iframe').contentDocument.querySelector('img[src*="12345678"]'))check(document.querySelector('iframe').contentDocument.readyState!=='complete','La prueba no ejercitó apertura con carga secundaria pendiente');
  const d=document.querySelector('iframe').contentDocument;
  check(!d.getElementById('pilotGoals1149').hidden,'Alta local vacía sin opción explícita de metas');
  const routine=d.getElementById('routine');routine.value='0';routine.dispatchEvent(new Event('change'));
  const reference=d.querySelector('.gymPhoto571[data-photo="Barbell_Bench_Press_-_Medium_Grip"]');
  check(reference,'Referencia original de press banca no disponible');
  reference.open=true;
  await wait(()=>{const images=[...reference.querySelectorAll('.gymPhotoGrid571 img')];return images.length===2&&images.every(x=>x.complete&&x.naturalWidth>0)},'No cargaron las dos posiciones de Gym');
  const tiles=[...reference.querySelectorAll('.gymPhotoTile571')];check(tiles.length===2&&tiles.every(x=>!x.disabled),'No se habilitó ampliación de fotos');
  check(tiles[0].querySelector('img').src.endsWith('/Barbell_Bench_Press_-_Medium_Grip/0.jpg'),'Se cambió URL original');
  tiles[0].click();const dialog=d.querySelector('.gymPhotoDialog571');check(dialog.open,'No se amplió la foto original');dialog.close();reference.open=false;
  // A different path on the same origin must remain blocked by both CSPs.
  const forbidden=d.createElement('img');forbidden.hidden=true;
  const violation=new Promise(resolve=>{d.addEventListener('securitypolicyviolation',e=>{if(e.effectiveDirective==='img-src')resolve(true)},{once:true})});
  forbidden.src='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/README.md';d.body.append(forbidden);
  check(await Promise.race([violation,new Promise(r=>setTimeout(()=>r(false),3000))]),'No se bloqueó ruta externa ajena a fotos');forbidden.remove();
  d.getElementById('height').value='1.86';d.getElementById('saveHeight').click();
  await wait(()=>el('status1140').textContent.includes('saved'),'No guardó');
  const heading=d.querySelector('header .brand h1');check(heading.textContent==='Mi progreso','Cuenta sin nombre no conserva título');
  const profile=d.getElementById('profile100'),welcome=d.getElementById('pilotWelcome1146');
  check(welcome&&!welcome.hidden,'Cuenta nueva sin invitación a personalizar nombre');
  d.getElementById('pilotName1146').click();check(profile.open&&d.activeElement===d.getElementById('profile100-displayName'),'Acceso inicial a perfil no funcional');
  const name=d.getElementById('profile100-displayName'),form=d.getElementById('profileForm100');
  name.value='Usuario A <b>prueba</b>';name.dispatchEvent(new Event('input',{bubbles:true}));form.requestSubmit();
  await wait(()=>heading.textContent==='Usuario A <b>prueba</b>'&&el('status1140').textContent.includes('saved'),'No guardó nombre de perfil');
  check(heading.children.length===0,'Nombre interpretado como HTML');check(welcome.hidden,'Invitación sigue visible con nombre guardado');
  name.value='Usuario A';name.dispatchEvent(new Event('input',{bubbles:true}));form.requestSubmit();
  await wait(()=>heading.textContent==='Usuario A'&&el('status1140').textContent.includes('saved'),'No actualizó nombre');

  // Exercise real classic and Gym PRO timers in the actual candidate DOM.
  // Fake only time and the remote scheduling callback: no historic push service.
  const w=d.defaultView,realNow=w.Date.now,realHook=w.asiaRestWatch533,realConfirm=w.confirm;
  let offset=0;const restCalls=[];
  const click=id=>d.getElementById(id).click(),clock=id=>d.getElementById(id).textContent;
  const advance=ms=>{offset+=ms;d.dispatchEvent(new Event('visibilitychange'))};
  try{
   w.Date.now=()=>realNow()+offset;w.confirm=()=>true;w.asiaRestWatch533=due=>restCalls.push(due);
   d.querySelector('#timerBlock button[data-rest="60"]').click();
   check(restCalls.at(-1)>w.Date.now()&&clock('restClock')!=='00:00','Descanso clásico no programó');
   advance(61000);
   check(clock('restClock')==='00:00'&&d.getElementById('toast').textContent==='Descanso terminado','No avisó fin de descanso clásico');
   d.querySelector('#timerBlock button[data-rest="60"]').click();click('stopRest');
   check(restCalls.at(-1)===0&&clock('restClock')==='00:00','Cancelación clásica no propagada');
   click('gymStart53');click('gymBegin53');
   check(w.asiaGymHasSession532(),'Gym PRO no inició');
   check(w.asiaGymRest532(30)&&restCalls.at(-1)>w.Date.now(),'Gym PRO no programó descanso');
   click('gymPause53');check(restCalls.at(-1)===0&&clock('gymPause53')==='Reanudar','Pausa PRO no canceló aviso');
   advance(35000);check(clock('gymRestClock53')!=='00:00','Descanso pausado venció');
   click('gymPause53');const resumed=restCalls.at(-1);check(resumed>w.Date.now(),'Reanudación no reprogramó aviso');
   click('gymAdd53');check(restCalls.at(-1)===resumed+30000,'Ampliación no reprogramó aviso');
   click('gymSkip53');check(restCalls.at(-1)===0&&clock('gymRestClock53')==='00:00','Omitir no canceló aviso');
   w.asiaGymRest532(30);advance(31000);
   check(clock('gymRestClock53')==='00:00'&&d.getElementById('toast').textContent==='Descanso terminado','No avisó fin de descanso PRO');
   click('gymDiscard53');check(!w.asiaGymHasSession532()&&restCalls.at(-1)===0,'Sesión descartada conserva aviso');
   if(!d.getElementById('gymExit53').hidden)click('gymExit53');
  }finally{w.Date.now=realNow;w.confirm=realConfirm;w.asiaRestWatch533=realHook}
  await wait(()=>el('status1140').textContent.includes('saved'),'Temporizadores no se guardaron');
  check(d.getElementById('reminders821')&&d.getElementById('reminderConfig821')&&d.getElementById('pushReminders845'),'Paneles originales de recordatorios ausentes');
  const reminder=w.asiaReminders821,initial=reminder.clean();
  check(Object.values(initial.enabled).every(x=>x===false)&&Object.values(initial.cloudEnabled).every(x=>x===false),'Cuenta nueva hereda avisos activos');
  check(reminder.clean({enabled:{weight:true},cloudEnabled:{weight:false},times:{weight:'06:35'}}).enabled.weight===true&&!reminder.clean({enabled:{weight:true},cloudEnabled:{weight:false}}).cloudEnabled.weight,'Preferencia explícita no preservada');
  const cfg=d.getElementById('reminderConfig821');cfg.open=true;
  await new Promise(r=>setTimeout(r,100));
  for(const c of cfg.querySelectorAll('input[id^="reminderEnabled821_"],input[id^="reminderCloud95_"]'))check(!c.checked,'Aviso preactivado en la interfaz');
  d.getElementById('reminderEnabled821_weight').checked=true;
  d.getElementById('reminderCloud95_weight').checked=true;
  d.getElementById('reminderTime821_weight').value='06:35';
  d.getElementById('reminderSave821').click();
  await wait(()=>el('status1140').textContent.includes('saved'),'Preferencias de avisos no guardadas');
  check(d.getElementById('reminderTime821_weight').value==='06:35','Horario personalizado perdido');

  check(localStorage.getItem('asia2027-v1')===null,'Diario en almacenamiento nativo');
  el('close1140').click();await wait(()=>!document.querySelector('iframe')&&!el('reconcile1140').disabled,'No cerró');
  el('reconcile1140').click();await wait(()=>!el('reconcile1140').disabled,'No concilió');
  el('sync1140').click();await wait(()=>!el('apply1140').disabled,'Sync no preparado');el('apply1140').click();await wait(()=>el('message1140').textContent.includes('confirmada'),'Sync no completó');
  await navigator.serviceWorker.ready;await wait(()=>!!navigator.serviceWorker.controller,'SW sin control');
  const keys=await caches.keys();check(keys.length===1&&keys[0]==='asia-v1142-public-notice-v1','Caché inesperada');
  const entries=await (await caches.open(keys[0])).keys();check(entries.length===1&&new URL(entries[0].url).pathname==='/v11.42/offline.html','Caché privada');
  return true;
 }.toString()+')()',true);assert.equal(result,true);assert.ok(photoRequests.has(photoSource+'Barbell_Bench_Press_-_Medium_Grip/0.jpg'));assert.ok(photoRequests.has(photoSource+'Barbell_Bench_Press_-_Medium_Grip/1.jpg'));assert.deepEqual(unexpectedPhotoRequests,[],'Se permitió tráfico no autorizado a proveedor de fotos');if(slowMode)assert.ok(slowRequested,'Recurso lento no solicitado');
 await cmd('Page.navigate',{url:home});await ready("document.readyState==='complete'&&typeof document.getElementById('openAccount')?.onclick==='function'&&!document.getElementById('shell1140')");
 const wrongPhrase=await evalJS('('+async function(){
  const el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m+' | '+(el('message1140')?.textContent||'sin mensaje')+' | '+(el('status1140')?.textContent||'sin estado'))};
  el('phrase').value='frase sintética incorrecta';el('openAccount').click();await wait(()=>!el('openAccount').disabled,'Frase incorrecta no rechazó');if(el('shell1140'))throw Error('Frase incorrecta abrió la bóveda');
  el('phrase').value='frase sintética paquete completo';el('openAccount').click();await wait(()=>!!el('open1140'),'Frase correcta no abrió');
  await wait(()=>document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!el('close1140').disabled,'No reabrió diario');
  if(document.querySelector('iframe').contentDocument.getElementById('height').value!=='1.86')throw Error('Registro perdido tras reinicio');
  if(document.querySelector('iframe').contentDocument.querySelector('header .brand h1').textContent!=='Usuario A')throw Error('Nombre perdido al reabrir');
  const diaryA=document.querySelector('iframe').contentDocument;
  if(!diaryA.getElementById('pilotWelcome1146').hidden)throw Error('Invitación reaparece con perfil persistente');
  if(!diaryA.getElementById('pilotGoals1149').hidden||!diaryA.getElementById('goalBrand101').textContent.includes('Asia 2027'))throw Error('Cuenta existente reinterpretada como nueva');
  if(diaryA.getElementById('reminderTime821_weight').value!=='06:35'||!diaryA.getElementById('reminderEnabled821_weight').checked||!diaryA.getElementById('reminderCloud95_weight').checked)throw Error('Preferencias de avisos perdidas al reabrir');

  el('close1140').click();await wait(()=>!document.querySelector('iframe')&&!el('reconcile1140').disabled,'No cerró');
  el('reconcile1140').click();await wait(()=>!el('logout1140').disabled,'Conciliación no terminó');
  // Simulate a new device in this disposable CI browser ONLY: remove the
  // synthetic confirmed A row after proving its cloud copy exists. No app
  // code deletes any local record and the remote fixture remains intact.
  if((await (await fetch('/v11.38/sync')).json()).head!==1)throw Error('Falta copia remota sintética');
  const fixtureDb=await new Promise((ok,fail)=>{const q=indexedDB.open('asia-v1134-unified-synthetic-staging',1);q.onsuccess=()=>ok(q.result);q.onerror=()=>fail(q.error)});
  try{await new Promise((ok,fail)=>{const t=fixtureDb.transaction('accounts','readwrite');t.objectStore('accounts').delete('acct_'+'a'.repeat(32));t.oncomplete=ok;t.onabort=()=>fail(t.error)})}finally{fixtureDb.close()}
  await fetch('/__ci/head-fail');return true;
 }.toString()+')()',true);assert.equal(wrongPhrase,true);
 await cmd('Page.navigate',{url:home});await ready("document.readyState==='complete'&&typeof document.getElementById('openAccount')?.onclick==='function'&&!document.getElementById('shell1140')");
 const freshDevice=await evalJS('('+async function(){
  const el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m+' | '+(el('message1140')?.textContent||'sin mensaje'))};
  el('phrase').value='frase sintética paquete completo';el('openAccount').click();await wait(()=>el('unlock').hidden&&!!el('open1140')&&!el('open1140').disabled,'No terminó preflight');
  if(document.querySelector('iframe')||!el('message1140').textContent.includes('No se pudo verificar'))throw Error('Red no verificada abrió diario');
  await fetch('/__ci/head-resume');el('open1140').click();await wait(()=>!el('open1140').disabled,'No terminó segundo preflight');
  if(document.querySelector('iframe')||!el('message1140').textContent.includes('ya tiene una copia'))throw Error('Copia existente no protegida');
  const {openOfflineRepository}=await import('/v11.42/staging/source/V11.37-INTEGRACION/src/offline-repository.mjs');const pending=await openOfflineRepository();try{if(await pending.inspect('acct_'+'a'.repeat(32)))throw Error('Se inicializó una rama antes de recuperar')}finally{pending.close()}
  el('sync1140').click();await wait(()=>!el('apply1140').disabled,'No preparó recuperación');el('apply1140').click();await wait(()=>el('message1140').textContent.includes('confirmada'),'Recuperación explícita no completó');
  el('open1140').click();await wait(()=>document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!el('close1140').disabled,'No abrió copia recuperada');
  const d=document.querySelector('iframe').contentDocument;if(d.getElementById('height').value!=='1.86'||d.querySelector('header .brand h1').textContent!=='Usuario A'||d.getElementById('reminderTime821_weight').value!=='06:35')throw Error('Datos remotos no preservados');
  el('close1140').click();await wait(()=>!document.querySelector('iframe')&&!el('reconcile1140').disabled,'No cerró');el('reconcile1140').click();await wait(()=>!el('logout1140').disabled,'No concilió');el('logout1140').click();return true;
 }.toString()+')()',true);assert.equal(freshDevice,true);
 await ready("document.readyState==='complete'&&typeof document.getElementById('openAccount')?.onclick==='function'&&!document.getElementById('shell1140')");
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sync_v1138_objects WHERE account_id=?').get(A).n,1);
 const isolation=await evalJS('('+async function(){
  const el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m+' | '+(el('message1140')?.textContent||'sin mensaje')+' | '+(el('status1140')?.textContent||'sin estado'))};
  if((await fetch('/v11.42/diary/index.html')).status!==401)throw Error('Logout no revocó acceso');
  await fetch('/__ci/b');el('phrase').value='frase sintética paquete completo';el('openAccount').click();await wait(()=>!!el('open1140'),'B no abrió shell');
  await wait(()=>document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!el('close1140').disabled,'B no abrió diario');
  if(document.querySelector('iframe').contentDocument.getElementById('height').value==='1.86')throw Error('Datos cruzados');
  if(document.querySelector('iframe').contentDocument.querySelector('header .brand h1').textContent!=='Mi progreso')throw Error('Nombre cruzado entre cuentas');
  const diaryB=document.querySelector('iframe').contentDocument;
  if(diaryB.getElementById('pilotWelcome1146').hidden)throw Error('Cuenta B hereda personalización de A');
  if(diaryB.getElementById('reminderTime821_weight').value==='06:35'||[...diaryB.querySelectorAll('input[id^="reminderEnabled821_"],input[id^="reminderCloud95_"]')].some(x=>x.checked))throw Error('Horario o preferencias cruzadas entre cuentas');

  if((await (await fetch('/v11.38/sync')).json()).head!==0)throw Error('Nube cruzada');
  const w=diaryB.defaultView,setup=diaryB.getElementById('pilotGoals1149'),own=diaryB.getElementById('pilotOwnGoals1149');if(setup.hidden)throw Error('B no tiene alta explícita');
  const oldConfirm=w.confirm;try{w.confirm=()=>false;own.click();if(setup.hidden||!diaryB.getElementById('goalBrand101').textContent.includes('Asia 2027'))throw Error('Cancelar modificó las metas');w.confirm=()=>true;own.click()}finally{w.confirm=oldConfirm}
  await wait(()=>setup.hidden&&diaryB.getElementById('goalBrand101').textContent==='Sin meta principal'&&el('status1140').textContent.includes('saved'),'Libro vacío no guardado');
  for(const [k,v] of Object.entries({title:'Mi meta B',kind:'Fuerza',target:'5 dominadas',motivation:'Constancia',deadline:'2027-08-01'}))diaryB.getElementById('goal101-'+k).value=v;
  diaryB.getElementById('goalForm101').requestSubmit();await wait(()=>diaryB.getElementById('goalBrand101').textContent==='Meta principal · Mi meta B'&&el('status1140').textContent.includes('saved'),'Primera meta propia no guardada');
  const training=diaryB.getElementById('training102');training.open=true;diaryB.getElementById('goalPlanning1173').click();await wait(()=>!diaryB.getElementById('personalPlanning1173').hidden,'Calendario personal no disponible');
  const personal=diaryB.getElementById('activatePersonal1173'),dateInput=diaryB.getElementById('personalStart1173');const originalConfirm=w.confirm;
  try{w.confirm=()=>false;personal.click();if(personal.hidden)throw Error('Cancelación activó calendario');w.confirm=()=>true;personal.click()}finally{w.confirm=originalConfirm}
  await wait(()=>personal.hidden&&el('status1140').textContent.includes('saved'),'Calendario personal no guardado');
  if(diaryB.getElementById('programStart102').value!==dateInput.value)throw Error('Inicio propio no aplicado');
  diaryB.getElementById('programGenerate102').click();if(!diaryB.getElementById('programActivate102'))throw Error('Borrador no disponible');
  try{w.confirm=()=>true;diaryB.getElementById('programActivate102').click()}finally{w.confirm=originalConfirm}
  await wait(()=>diaryB.getElementById('programList102').textContent.includes('Mi próximo programa')&&el('status1140').textContent.includes('saved'),'Programa personal no guardado');
  // Freeze a real B pending branch through the existing repository API. This
  // exercises the recovery gate, not a fabricated successful reconciliation.
  el('close1140').click();await wait(()=>!document.querySelector('iframe')&&!el('reconcile1140').disabled,'B no cerró');
  const {openOfflineRepository}=await import('/v11.42/staging/source/V11.37-INTEGRACION/src/offline-repository.mjs');
  const repo=await openOfflineRepository();try{await repo.freeze('acct_'+'b'.repeat(32));}finally{repo.close()}
  return true;
 }.toString()+')()',true);assert.equal(isolation,true);
 await cmd('Page.navigate',{url:home});await ready("document.readyState==='complete'&&typeof document.getElementById('openAccount')?.onclick==='function'&&!document.getElementById('shell1140')");
 const recovery=await evalJS('('+async function(){
  const el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m+' | '+(el('message1140')?.textContent||'sin mensaje'))};
  el('phrase').value='frase sintética paquete completo';el('openAccount').click();await wait(()=>el('unlock').hidden&&!!el('reconcile1140')&&!el('reconcile1140').disabled,'Recuperación no disponible');
  if(document.querySelector('iframe')||!el('message1140').textContent.includes('Rama en conciliación'))throw Error('Rama congelada abrió o perdió diagnóstico');
  const {openOfflineRepository}=await import('/v11.42/staging/source/V11.37-INTEGRACION/src/offline-repository.mjs');
  const repo=await openOfflineRepository();try{if((await repo.inspect('acct_'+'b'.repeat(32)))?.phase!=='frozen')throw Error('Rama congelada perdida')}finally{repo.close()}
  el('reconcile1140').click();await wait(()=>!el('open1140').disabled,'Conciliación explícita no terminó');
  if(el('message1140').textContent.startsWith('No se completó:'))throw Error(el('message1140').textContent);
  el('sync1140').click();await wait(()=>!el('apply1140').disabled,'No preparó sync de metas v2');el('apply1140').click();await wait(()=>el('message1140').textContent.includes('confirmada'),'Sync v2 no confirmado');
  if((await (await fetch('/v11.38/sync')).json()).head!==1)throw Error('Copia v2 ausente');
  return true;
 }.toString()+')()',true);assert.equal(recovery,true);
 await cmd('Page.navigate',{url:home});await ready("document.readyState==='complete'&&typeof document.getElementById('openAccount')?.onclick==='function'&&!document.getElementById('shell1140')");
 const advanced=await evalJS('('+async function(){
  const el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m)};
  el('advancedUnlock').checked=true;el('phrase').value='frase sintética paquete completo';el('openAccount').click();await wait(()=>el('unlock').hidden&&!!el('open1140')&&!el('open1140').disabled,'Herramientas avanzadas no disponibles');
  if(document.querySelector('iframe')||!el('maintenance1141')||!el('import1141')||!el('restore1141')||!el('review1167')||el('review1167').disabled||!el('reviewFile1167').disabled||!el('recover1169')||el('recover1169').disabled||!el('reload1169').hidden)throw Error('Apertura avanzada no preservó recuperación');
  el('open1140').click();await wait(()=>document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!el('close1140').disabled,'Apertura manual no disponible');
  const d=document.querySelector('iframe').contentDocument;d.getElementById('goals101').open=true;await wait(()=>d.getElementById('goalActive101').textContent.includes('Constancia'),'Motivación no persistió');
  if(!d.getElementById('pilotGoals1149').hidden||d.getElementById('goalBrand101').textContent!=='Meta principal · Mi meta B'||d.getElementById('goalActive101').textContent.includes('Asia 2027'))throw Error('Meta v2 perdida o heredada');d.getElementById('training102').open=true;await wait(()=>d.getElementById('programList102').textContent.includes('Mi próximo programa')&&d.getElementById('activatePersonal1173').hidden,'Calendario propio no persistió');return true;
 }.toString()+')()',true);assert.equal(advanced,true);
 const finishB=await evalJS('('+async function(){
  const el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m)};
  el('close1140').click();await wait(()=>!document.querySelector('iframe')&&!el('reconcile1140').disabled,'B no cerró');el('reconcile1140').click();await wait(()=>!el('logout1140').disabled,'B no concilió');el('logout1140').click();return true;
 }.toString()+')()',true);assert.equal(finishB,true);
 await ready("document.readyState==='complete'&&typeof document.getElementById('openAccount')?.onclick==='function'&&!document.getElementById('shell1140')");
 await evalJS("fetch('/__ci/c').then(r=>r.text())",true);await cmd('Page.navigate',{url:home});
 await ready("document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!document.getElementById('close1140').disabled");
 const managed=await evalJS('('+async function(){
  const el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m)};
  if(!el('unlock').hidden||el('phrase').value)throw Error('C solicitó frase');
  const {acquireAccountWriter1171}=await import('/v11.42/staging/source/V11.40-INTEGRACION/src/account-writer1171.mjs');
  let refused=false;try{const unexpected=await acquireAccountWriter1171('acct_'+'c'.repeat(32));await unexpected.release()}catch(e){refused=e.code==='WRITER_BUSY'}
  if(!refused)throw Error('Otra pestaña podría escribir la misma cuenta');
  const other=await acquireAccountWriter1171('acct_'+'d'.repeat(32));await other.release();
  const reopened=await acquireAccountWriter1171('acct_'+'d'.repeat(32));await reopened.release();
  let unsupported=false;try{await acquireAccountWriter1171('acct_'+'d'.repeat(32),{})}catch(e){unsupported=e.code==='WRITER_UNAVAILABLE'}
  if(!unsupported)throw Error('No se bloqueó navegador sin coordinación');
  const d=document.querySelector('iframe').contentDocument;if(d.getElementById('height').value==='1.86'||d.getElementById('goalBrand101').textContent.includes('Mi meta B'))throw Error('Datos cruzados C');
  d.getElementById('pilotName1146').click();const name=d.getElementById('profile100-displayName');name.value='Usuario C';name.dispatchEvent(new Event('input',{bubbles:true}));d.getElementById('profileForm100').requestSubmit();
  await wait(()=>d.querySelector('header .brand h1').textContent==='Usuario C'&&el('status1140').textContent.includes('saved'),'C no guardó nombre');
  if(el('saveSync1170').hidden||el('saveSync1170').disabled)throw Error('Guardado gestionado no disponible');el('saveSync1170').click();await wait(()=>!document.querySelector('iframe')&&el('message1140').textContent.includes('confirmada'),'C no confirmó guardado y sincronización');if(!el('syncStatus1170').textContent.includes('revisión 1'))throw Error('Revisión no confirmada');return true;
 }.toString()+')()',true);assert.equal(managed,true);
 const managedRow=db.prepare('SELECT envelope FROM managed_account_keys_v1152 WHERE account_id=?').get(C).envelope;assert.ok(managedRow);
 await cmd('Page.navigate',{url:home});await ready("document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!document.getElementById('close1140').disabled");
 assert.equal(await evalJS("document.querySelector('iframe').contentDocument.querySelector('header .brand h1').textContent"),'Usuario C');
 assert.equal(await evalJS("document.getElementById('unlock').hidden&&document.getElementById('phrase').value===''"),true);
 assert.equal(db.prepare('SELECT envelope FROM managed_account_keys_v1152 WHERE account_id=?').get(C).envelope,managedRow);
 const remoteC=db.prepare('SELECT * FROM sync_v1138_objects WHERE account_id=?').all(C);assert.equal(remoteC.length,1);
 const cloudC=Buffer.from(objects.get(remoteC[0].object_key));
 const newManagedDevice=await evalJS('('+async function(){
  const el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m)};
  el('close1140').click();await wait(()=>!document.querySelector('iframe')&&!el('reconcile1140').disabled,'C no cerró');el('reconcile1140').click();await wait(()=>!el('logout1140').disabled,'C no concilió');
  // Only disposable test IndexedDB. Never remove local records in application code.
  const fixtureDb=await new Promise((ok,fail)=>{const q=indexedDB.open('asia-v1134-unified-synthetic-staging',1);q.onsuccess=()=>ok(q.result);q.onerror=()=>fail(q.error)});
  try{await new Promise((ok,fail)=>{const t=fixtureDb.transaction('accounts','readwrite');t.objectStore('accounts').delete('acct_'+'c'.repeat(32));t.oncomplete=ok;t.onabort=()=>fail(t.error)})}finally{fixtureDb.close()}
  await fetch('/__ci/head-fail');return true;
 }.toString()+')()',true);assert.equal(newManagedDevice,true);
 await cmd('Page.navigate',{url:home});await ready("document.getElementById('message1140')?.textContent.includes('No se pudo verificar')&&!document.getElementById('open1140').disabled");
 const recoveredManaged=await evalJS('('+async function(){
  const el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m+' | '+el('message1140')?.textContent)};
  const id='acct_'+'c'.repeat(32);
  const {openUnifiedRepository}=await import('/v11.42/staging/source/V11.34-INTEGRACION/src/unified-repository.mjs');
  const {openOfflineRepository}=await import('/v11.42/staging/source/V11.37-INTEGRACION/src/offline-repository.mjs');
  const repo=await openUnifiedRepository(),pending=await openOfflineRepository();
  try{
   if(document.querySelector('iframe')||!el('unlock').hidden||!await repo.empty(id)||await pending.inspect(id))throw Error('Fallo remoto inicializó datos C');
   await fetch('/__ci/head-resume');el('open1140').click();
   await wait(()=>document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!el('close1140').disabled,'Recuperación gestionada no abrió');
   const d=document.querySelector('iframe').contentDocument,row=await repo.readSync(id);
   if(d.querySelector('header .brand h1').textContent!=='Usuario C'||!d.getElementById('pilotGoals1149').hidden||!el('unlock').hidden||!row.local||!row.modules||row.baseline?.remote!==1)throw Error('C no recuperó la copia confirmada');
   if((await (await fetch('/v11.38/sync')).json()).head!==1)throw Error('Recuperación hizo escritura remota');
   return true;
  }finally{repo.close();pending.close()}
 }.toString()+')()',true);assert.equal(recoveredManaged,true);
 assert.deepEqual(db.prepare('SELECT * FROM sync_v1138_objects WHERE account_id=?').all(C),remoteC);
 assert.deepEqual(Buffer.from(objects.get(remoteC[0].object_key)),cloudC);
 // Internal client migration test on isolated fixture accounts in real
 // Chromium IndexedDB. No production endpoint or real account is created.
 const localRekey=await evalJS('('+async function(){
  const {prepareLocalCommit1158}=await import('/v11.42/staging/source/V11.42-INTEGRACION/src/local-rekey1158.mjs');
  const {openUnifiedRepository}=await import('/v11.42/staging/source/V11.34-INTEGRACION/src/unified-repository.mjs');
  const {openOfflineRepository}=await import('/v11.42/staging/source/V11.37-INTEGRACION/src/offline-repository.mjs');
  const {encrypt84,decrypt84,checksum84}=await import('/v11.42/model84.mjs');
  const {hashBytes}=await import('/v11.42/staging/source/V11.38-INTEGRACION/src/large-sync.mjs');
  const repo=await openUnifiedRepository(),pending=await openOfflineRepository(),oldPhrase='frase anterior sintética browser',newSecret='X'.repeat(43);
  const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),check=(x,m)=>{if(!x)throw Error(m)};
  const rejects=async(fn,m)=>{let failed=false;try{await fn()}catch{failed=true}check(failed,m)};
  try{
   for(const [letter,scenario] of [['d','success'],['e','dirty'],['f','pending'],['1','stale'],['2','remote-change']]){
    const id='acct_'+letter.repeat(32),identity={accountId:id,csrf:'z'.repeat(43)},readSession=async()=>identity;
    const diary={body:{'2026-11-26':{weight:81}},diet:{},work:{},settings:{},photos:{}};
    const entries=[['asia2027-v1',JSON.stringify(diary)]],modules={coach:{history:['preservar']},visual:{photos:['referencia']}};
    const localPlain={format:'asia-v1126-local-vault-v1',accountId:id,revision:1,entries:[...entries,['asia-timers-v4','null']]};
    const modulesPlain={format:'asia-v1128-modules-v1',accountId:id,revision:1,modules:Object.fromEntries(Object.entries(modules).map(([name,payload])=>[name,{name,revision:1,payload}]))};
    await repo.initialize(id,{revision:1,envelope:await encrypt84(localPlain,oldPhrase)},{revision:1,envelope:await encrypt84(modulesPlain,oldPhrase)});
    const source=await repo.readSync(id);
    const plain={format:'asia-v1136-sync-v1',accountId:id,payload:{entries,modules:scenario==='dirty'?{...modules,coach:{history:['otra rama']}}:modules}};
    const old=await encrypt84(plain,oldPhrase),next=await encrypt84(plain,newSecret);
    const sha=x=>hashBytes(new TextEncoder().encode(JSON.stringify(x)));
    const receipt={operationId:crypto.randomUUID(),phase:'committed',sourceRevision:1,sourceSha:await sha(old),revision:2,targetSha:await sha(next)};
    let head=2;const request=async(method,body,revision)=>{check(method==='GET','Escritura remota no permitida');return revision?{ok:true,revision,envelope:revision===1?old:next}:{ok:true,head,versions:[{revision:head,bytes:100,created_at:new Date().toISOString()}]}};
    const options={readSession,repository:repo,pending,policy:globalThis.asiaAccounts106,oldPhrase,newSecret,operationId:receipt.operationId,readReceipt:async()=>receipt,request,maintenanceConfirmed:true};
    if(scenario==='pending'){await pending.begin(id,source,crypto.randomUUID());await rejects(()=>prepareLocalCommit1158(options),'Rama pendiente no bloqueó');check(eq(await repo.readSync(id),source)&&await pending.inspect(id),'Rama perdida');continue}
    const plan=await prepareLocalCommit1158(options);
    if(scenario==='dirty'){check(plan.kind==='conflict'&&eq(await repo.readSync(id),source)&&!await repo.readRekey(id),'Divergencia reemplazada');continue}
    check(plan.kind==='ready','Plan no disponible');
    if(scenario==='stale'){await repo.local.compareAndSwap(id,1,{revision:2,envelope:await encrypt84({...localPlain,revision:2},oldPhrase)});const changed=await repo.readSync(id);await rejects(()=>plan.apply({confirmed:true}),'CAS local no bloqueó');check(eq(await repo.readSync(id),changed)&&!await repo.readRekey(id),'Cambios concurrentes perdidos');continue}
    if(scenario==='remote-change'){head=3;await rejects(()=>plan.apply({confirmed:true}),'CAS remoto no bloqueó');check(eq(await repo.readSync(id),source)&&!await repo.readRekey(id),'Cambio remoto ignorado');continue}
    check((await plan.apply({confirmed:true})).kind==='applied','No confirmó local');
    const row=await repo.readSync(id),backup=await repo.readRekey(id);
    check(row.local.revision===2&&row.modules.revision===2&&row.baseline.remote===2&&eq(backup.source,source)&&eq(backup.receipt,receipt),'Transacción o respaldo incorrecto');
    check(await checksum84(await decrypt84(row.local.envelope,newSecret))===await checksum84({...localPlain,revision:2})&&await checksum84(await decrypt84(row.modules.envelope,newSecret))===await checksum84({...modulesPlain,revision:2}),'Contenido local cambiado');
    await rejects(()=>repo.local.compareAndSwap(id,1,{revision:2,envelope:source.local.envelope}),'Escritor antiguo no bloqueado');
    check((await prepareLocalCommit1158(options)).kind==='already-applied','No recuperó comprobante local');
    check(eq(await repo.readRekey(id),backup),'Respaldo sobrescrito');
   }
   return true;
  }finally{repo.close();pending.close()}
 }.toString()+')()',true);assert.equal(localRekey,true);
 // Real IndexedDB recovery CAS and immutable backup, no production network.
 const recoveryCAS=await evalJS('('+async function(){
  const {openUnifiedRepository}=await import('/v11.42/staging/source/V11.34-INTEGRACION/src/unified-repository.mjs');
  const {encrypt84,decrypt84}=await import('/v11.42/model84.mjs');
  const repo=await openUnifiedRepository(),phrase='frase sintética recuperación CAS';
  const check=(ok,m)=>{if(!ok)throw Error(m)},eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const rejects=async f=>{try{await f()}catch{return true}return false};
  try{
   for(const [letter,stale] of [['3',false],['4',true]]){
    const id='acct_'+letter.repeat(32),localPlain={format:'asia-v1126-local-vault-v1',accountId:id,revision:1,entries:[]},modulesPlain={format:'asia-v1128-modules-v1',accountId:id,revision:1,modules:{}};
    await repo.initialize(id,{revision:1,envelope:await encrypt84(localPlain,phrase)},{revision:1,envelope:await encrypt84(modulesPlain,phrase)});
    const source=await repo.readSync(id),target={local:{revision:2,envelope:await encrypt84({...localPlain,revision:2},phrase)},modules:{revision:2,envelope:await encrypt84({...modulesPlain,revision:2},phrase)},baseline:{remote:3,local:2,modules:2,namespace:'objects-v1138'}};
    const proof={format:'asia-v1162-additive-recovery-v1',archiveSha:'a'.repeat(64),remoteSha:'b'.repeat(64),remoteRevision:3};
    if(stale){
     await repo.local.compareAndSwap(id,1,target.local);const changed=await repo.readSync(id);
     check(await rejects(()=>repo.commitRecovery(id,source,target,proof))&&eq(await repo.readSync(id),changed)&&!await repo.readRecovery(id),'CAS de recuperación ignorado');
     continue;
    }
    check(await repo.commitRecovery(id,source,target,proof)==='applied','No confirmó recuperación');
    const backup=await repo.readRecovery(id);
    check(eq(backup,{source,proof})&&eq(await repo.readSync(id),target),'Respaldo o transacción incorrecta');
    check(await repo.commitRecovery(id,source,target,proof)==='already-applied','Repetición local no idempotente');
    check(await rejects(()=>repo.local.compareAndSwap(id,1,target.local)),'Escritor viejo no rechazado');
    check(await rejects(()=>repo.commitRecovery(id,source,target,{...proof,archiveSha:'c'.repeat(64)})),'Reemplazó respaldo');
    check(eq(await repo.readRecovery(id),backup),'Respaldo alterado');
    check(eq(await decrypt84((await repo.readSync(id)).local.envelope,phrase),{...localPlain,revision:2}),'Bóveda inválida');
   }
   return true;
  }finally{repo.close()}
 }.toString()+')()',true);assert.equal(recoveryCAS,true);
 const pendingCAS=await evalJS('('+async function(){
  const {openUnifiedRepository}=await import('/v11.42/staging/source/V11.34-INTEGRACION/src/unified-repository.mjs');
  const {openOfflineRepository}=await import('/v11.42/staging/source/V11.37-INTEGRACION/src/offline-repository.mjs');
  const {encrypt84}=await import('/v11.42/model84.mjs');
  const repo=await openUnifiedRepository(),pending=await openOfflineRepository(),phrase='frase sintética pending CAS';
  const check=(ok,m)=>{if(!ok)throw Error(m)},eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),rejects=async f=>{try{await f()}catch{return true}return false};
  try{
   const id='acct_'+'5'.repeat(32),localPlain={format:'asia-v1126-local-vault-v1',accountId:id,revision:1,entries:[]},modulesPlain={format:'asia-v1128-modules-v1',accountId:id,revision:1,modules:{}};
   const local=async revision=>({revision,envelope:await encrypt84({...localPlain,revision},phrase)}),modules=async revision=>({revision,envelope:await encrypt84({...modulesPlain,revision},phrase)});
   await repo.initialize(id,await local(1),await modules(1));
   const source=await repo.readSync(id),adapters=await pending.begin(id,source,crypto.randomUUID()),inspected=await pending.inspect(id);
   const next=await local(2);await adapters.local.compareAndSwap(id,1,next);
   check(await rejects(()=>pending.freezeReviewed(id,inspected)),'Congeló una rama cambiada');
   const frozen=await pending.freezeReviewed(id,await pending.inspect(id));
   check(frozen.phase==='frozen'&&eq(frozen.working.local,next),'Rama no congelada');
   const third=await local(3);check(await rejects(()=>adapters.local.compareAndSwap(id,2,third)),'Lease antiguo escribió tras congelar');
   const target={local:third,modules:await modules(2),baseline:{remote:3,local:3,modules:2,namespace:'objects-v1138'}},proof={format:'asia-v1163-pending-recovery-v1',archiveSha:'a'.repeat(64),remoteSha:'b'.repeat(64),remoteRevision:3};
   check(await repo.commitPendingRecovery(id,source,target,proof,frozen,null)==='applied','No confirmó rama');
   const backup=await repo.readRecovery(id);
   check(eq(backup,{source,proof,branch:frozen})&&eq(await repo.readSync(id),target)&&eq(await pending.inspect(id),frozen),'Respaldo/commit incorrecto');
   check(await repo.commitPendingRecovery(id,source,target,proof,frozen,null)==='already-applied','Commit no idempotente');
   check(await rejects(()=>pending.finish(id,{base:source,working:source})),'Finalizó rama incorrecta');
   await pending.finish(id,{base:frozen.base,working:frozen.working});
   check(!await pending.inspect(id)&&eq(await repo.readRecovery(id),backup),'Rama archivada perdida');
   check(await rejects(()=>repo.commitPendingRecovery(id,source,target,{...proof,archiveSha:'c'.repeat(64)},frozen,null)),'Respaldo reemplazado');
   return true;
  }finally{repo.close();pending.close()}
 }.toString()+')()',true);assert.equal(pendingCAS,true);


 db.prepare('DELETE FROM auth_oidc_sessions_v1111 WHERE account_id=?').run(C);
 await evalJS("window.dispatchEvent(new Event('focus'));true",true);await ready("document.getElementById('status1140')?.textContent==='Sesión bloqueada'&&document.querySelector('iframe')?.hidden===true&&!document.getElementById('unlock1172').hidden");
 assert.equal(await evalJS("(()=>{try{globalThis.__asiaCandidateFixture.storage.getItem('asia2027-v1');return false}catch{return true}})()"),true);
 await evalJS("fetch('/__ci/offline').then(r=>r.text())",true);await cmd('Page.navigate',{url:home});await ready("document.body?.textContent.includes('Volvé a conectarte para verificar tu cuenta')");
 console.log('Chrome paquete generado: autorización, diario, guardado, conciliación, Worker sync, logout, aislamiento, caché pública y fallback offline.');
}finally{ws?.close();chrome?.kill();if(chrome&&chrome.exitCode===null)await Promise.race([once(chrome,'exit'),sleep(3000)]);server?.closeAllConnections();server?.close();db.close();await rm(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
