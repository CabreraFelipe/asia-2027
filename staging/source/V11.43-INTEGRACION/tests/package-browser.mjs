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
const dir=await mkdtemp(join(tmpdir(),'asia-pwa-ci-'));let chrome,ws,server,offline=false;
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
   res.writeHead(r.status,h);res.end(Buffer.from(await r.arrayBuffer()));
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
 const evalJS=async(expression,awaitPromise=false)=>(await cmd('Runtime.evaluate',{expression,awaitPromise,returnByValue:true})).result.value;
 async function ready(expr){for(let i=0;i<200;i++){try{if(await evalJS(expr))return}catch{}await sleep(100)}throw Error('Página no disponible: '+expr)}
 await ready("location.href==="+JSON.stringify(home)+"&&document.readyState==='complete'&&!!document.getElementById('openAccount')");
 const result=await evalJS('('+async function(){
  const check=(x,m)=>{if(!x)throw Error(m)},el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m)};
  const phrase='frase sintética paquete completo';
  check((await fetch('/v11.42/app.mjs')).status===401,'Asset anónimo');
  el('phrase').value=phrase;el('openAccount').click();await wait(()=>!el('openAccount').disabled,'Acceso anónimo no terminó');check(!el('shell1140'),'Shell anónimo');
  await fetch('/__ci/a');
  el('phrase').value=phrase;el('openAccount').click();await wait(()=>!!el('open1140'),'Shell no inicializado: '+el('entryStatus').textContent);
  el('open1140').click();await wait(()=>document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!el('close1140').disabled,'Diario empaquetado no inició');
  const d=document.querySelector('iframe').contentDocument;d.getElementById('height').value='1.86';d.getElementById('saveHeight').click();
  await wait(()=>el('status1140').textContent.includes('saved'),'No guardó');
  check(localStorage.getItem('asia2027-v1')===null,'Diario en almacenamiento nativo');
  el('close1140').click();await wait(()=>!document.querySelector('iframe')&&!el('reconcile1140').disabled,'No cerró');
  el('reconcile1140').click();await wait(()=>!el('reconcile1140').disabled,'No concilió');
  el('sync1140').click();await wait(()=>!el('apply1140').disabled,'Sync no preparado');el('apply1140').click();await wait(()=>el('message1140').textContent.includes('confirmada'),'Sync no completó');
  await navigator.serviceWorker.ready;await wait(()=>!!navigator.serviceWorker.controller,'SW sin control');
  const keys=await caches.keys();check(keys.length===1&&keys[0]==='asia-v1142-public-notice-v1','Caché inesperada');
  const entries=await (await caches.open(keys[0])).keys();check(entries.length===1&&new URL(entries[0].url).pathname==='/v11.42/offline.html','Caché privada');
  el('logout1140').click();return true;
 }.toString()+')()',true);assert.equal(result,true);
 await ready("!!document.getElementById('openAccount')&&!document.getElementById('shell1140')");
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sync_v1138_objects WHERE account_id=?').get(A).n,1);
 const isolation=await evalJS('('+async function(){
  const el=id=>document.getElementById(id),wait=async(f,m)=>{for(let i=0;i<200;i++){if(f())return;await new Promise(r=>setTimeout(r,100))}throw Error(m)};
  if((await fetch('/v11.42/diary/index.html')).status!==401)throw Error('Logout no revocó acceso');
  await fetch('/__ci/b');el('phrase').value='frase sintética paquete completo';el('openAccount').click();await wait(()=>!!el('open1140'),'B no abrió shell');
  el('open1140').click();await wait(()=>document.querySelector('iframe')?.contentWindow?.asiaGym84Ready===true&&!el('close1140').disabled,'B no abrió diario');
  if(document.querySelector('iframe').contentDocument.getElementById('height').value==='1.86')throw Error('Datos cruzados');
  if((await (await fetch('/v11.38/sync')).json()).head!==0)throw Error('Nube cruzada');
  return true;
 }.toString()+')()',true);assert.equal(isolation,true);
 await evalJS("fetch('/__ci/offline').then(r=>r.text())",true);await cmd('Page.navigate',{url:home});await ready("document.body?.textContent.includes('Volvé a conectarte para verificar tu cuenta')");
 console.log('Chrome paquete generado: autorización, diario, guardado, conciliación, Worker sync, logout, aislamiento, caché pública y fallback offline.');
}finally{ws?.close();chrome?.kill();if(chrome&&chrome.exitCode===null)await Promise.race([once(chrome,'exit'),sleep(3000)]);server?.closeAllConnections();server?.close();db.close();await rm(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100})}
