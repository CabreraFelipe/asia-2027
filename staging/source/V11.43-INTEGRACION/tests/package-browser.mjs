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
const A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32),ta='A'.repeat(43),tb='B'.repeat(43),db=new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
for(const n of ['0001_staging.sql','0006_identity_oidc.sql','0007_synthetic_journal_v115.sql','0009_large_sync.sql'])db.exec(readFileSync(root+'migrations/'+n,'utf8'));
for(const [id,t,email,csrf] of [[A,ta,'a@example.invalid','a'.repeat(43)],[B,tb,'b@example.invalid','b'.repeat(43)]]){
 db.prepare('INSERT INTO accounts_v11 VALUES(?,?,?,?)').run(id,'https://accounts.google.com',email,new Date().toISOString());
 db.prepare('INSERT INTO auth_oidc_sessions_v1111(token_digest,account_id,csrf,email_digest,created_at,expires_at) VALUES(?,?,?,?,?,?)').run(await digest(t),id,csrf,await digest(email),Date.now(),Date.now()+600000);
}
const objects=new Map(),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.css':'text/css; charset=utf-8'};
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_ALLOW_V1142_TESTS:'true',STAGING_ALLOW_V1138_TESTS:'true',STAGING_ALLOW_V1139_TESTS:'true',STAGING_GOOGLE_CLIENT_ID:'test.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-only',STAGING_ALLOWED_EMAILS:'a@example.invalid,b@example.invalid',
 STAGING_DB:{prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){return db.prepare(sql).run(...args)}}}},
 STAGING_SYNC_OBJECTS:{async put(k,v){objects.set(k,new Uint8Array(v))},async get(k){const v=objects.get(k);return v?{size:v.length,arrayBuffer:async()=>v.buffer.slice(0)}:null},async delete(k){objects.delete(k)}},
 STAGING_PWA_ASSETS:{async fetch(r){const p=new URL(r.url).pathname;try{return new Response(await readFile(root+'assets'+p),{headers:{'Content-Type':mime[extname(p)]||'application/octet-stream'}})}catch{return new Response(null,{status:404})}}}
};
const dir=await mkdtemp(join(tmpdir(),'asia-pwa-ci-'));let chrome,ws,server,offline=false,slowRequested=false,slowMode=process.env.ASIA_SLOW_DIARY==='1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(dir,'key.pem'),'-out',join(dir,'cert.pem'),'-days','1','-subj','/CN='+host,'-addext','subjectAltName=DNS:'+host],{stdio:'ignore'});
 server=createServer({key:readFileSync(join(dir,'key.pem')),cert:readFileSync(join(dir,'cert.pem'))},async(req,res)=>{
  try{
   if(offline){req.socket.destroy();return}
   const u=new URL(req.url,origin);
   if(['/__ci/a','/__ci/b'].includes(u.pathname)){res.writeHead(200,{'Set-Cookie':'__Host-asia1111_session='+(u.pathname.endsWith('/a')?ta:tb)+'; Path=/; Secure; HttpOnly; SameSite=Lax','Cache-Control':'no-store'});res.end('fixture');return}
   if(u.pathname==='/__ci/offline'){res.end('offline');offline=true;return}
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
  el('phrase').value=phrase;el('openAccount').click();await wait(()=>!!el('open1140'),'Shell no inicializado: '+el('entryStatus').textContent);
  el('open1140').click();await wait(()=>{if(el('message1140').textContent.startsWith('No se completó:'))throw Error(el('message1140').textContent);return document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!el('close1140').disabled},'Diario empaquetado no inició');
  check(!document.querySelector('iframe').inert,'Interacción no habilitada tras verificar Gym');
  if(document.querySelector('iframe').contentDocument.querySelector('img[src*="12345678"]'))check(document.querySelector('iframe').contentDocument.readyState!=='complete','La prueba no ejercitó apertura con carga secundaria pendiente');
  const d=document.querySelector('iframe').contentDocument;
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
  const profile=d.getElementById('profile100');profile.open=true;
  const name=d.getElementById('profile100-displayName'),form=d.getElementById('profileForm100');
  name.value='Usuario A <b>prueba</b>';name.dispatchEvent(new Event('input',{bubbles:true}));form.requestSubmit();
  await wait(()=>heading.textContent==='Usuario A <b>prueba</b>'&&el('status1140').textContent.includes('saved'),'No guardó nombre de perfil');
  check(heading.children.length===0,'Nombre interpretado como HTML');
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
  el('open1140').click();await wait(()=>document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!el('close1140').disabled,'No reabrió diario');
  if(document.querySelector('iframe').contentDocument.getElementById('height').value!=='1.86')throw Error('Registro perdido tras reinicio');
  if(document.querySelector('iframe').contentDocument.querySelector('header .brand h1').textContent!=='Usuario A')throw Error('Nombre perdido al reabrir');
  el('close1140').click();await wait(()=>!document.querySelector('iframe')&&!el('reconcile1140').disabled,'No cerró');
  el('reconcile1140').click();await wait(()=>!el('logout1140').disabled,'Conciliación no terminó');
  el('logout1140').click();return true;
 }.toString()+')()',true);assert.equal(wrongPhrase,true);
 await ready("document.readyState==='complete'&&typeof document.getElementById('openAccount')?.onclick==='function'&&!document.getElementById('shell1140')");
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sync_v1138_objects WHERE account_id=?').get(A).n,1);
 const isolation=await evalJS('('+async function(){
  const el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m+' | '+(el('message1140')?.textContent||'sin mensaje')+' | '+(el('status1140')?.textContent||'sin estado'))};
  if((await fetch('/v11.42/diary/index.html')).status!==401)throw Error('Logout no revocó acceso');
  await fetch('/__ci/b');el('phrase').value='frase sintética paquete completo';el('openAccount').click();await wait(()=>!!el('open1140'),'B no abrió shell');
  el('open1140').click();await wait(()=>document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!el('close1140').disabled,'B no abrió diario');
  if(document.querySelector('iframe').contentDocument.getElementById('height').value==='1.86')throw Error('Datos cruzados');
  if(document.querySelector('iframe').contentDocument.querySelector('header .brand h1').textContent!=='Mi progreso')throw Error('Nombre cruzado entre cuentas');
  if((await (await fetch('/v11.38/sync')).json()).head!==0)throw Error('Nube cruzada');
  return true;
 }.toString()+')()',true);assert.equal(isolation,true);
 await evalJS("fetch('/__ci/offline').then(r=>r.text())",true);await cmd('Page.navigate',{url:home});await ready("document.body?.textContent.includes('Volvé a conectarte para verificar tu cuenta')");
 console.log('Chrome paquete generado: autorización, diario, guardado, conciliación, Worker sync, logout, aislamiento, caché pública y fallback offline.');
}finally{ws?.close();chrome?.kill();if(chrome&&chrome.exitCode===null)await Promise.race([once(chrome,'exit'),sleep(3000)]);server?.closeAllConnections();server?.close();db.close();await rm(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
