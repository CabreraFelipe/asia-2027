// CI: Chrome preinstalado, CDP local, no paquetes npm ni red externa.
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {resolve,join,extname} from 'node:path';
import {once} from 'node:events';
const dir=await mkdtemp(join(tmpdir(),'asia-chrome-'));
const root=process.cwd(),prefix=process.env.ASIA_BROWSER_PREFIX||'/staging/source/V11.26-INTEGRACION/tests';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/')||!mime[extname(file)])throw Error('path');
  let data=await readFile(file);
  if(process.env.ASIA_ORIGINAL==='1'&&path==='/index.html'){
   const original=data.toString('utf8');
   if(!original.startsWith('<!doctype html><html lang="es"><head>'))throw Error('HTML inesperado');
   data=original.replace('<head>','<head><script src="/staging/source/V11.27-INTEGRACION/tests/original-preload.js"></script>');
   res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'none'; worker-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'");
  }
  if(path==='/sw.js'||path.endsWith('/sw.js'))throw Error('SW deshabilitado en pruebas');
  res.writeHead(200,{'Content-Type':mime[extname(file)],'Cache-Control':'no-store'});res.end(data);
 }catch(e){console.log('CI HTTP 404:',req.url, e.code||e.message);res.writeHead(404);res.end()}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const url='http://127.0.0.1:'+server.address().port+prefix+'/browser.html';
let chrome,ws;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 chrome=spawn(process.env.CHROME_BIN||'google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+dir,url],{stdio:'ignore'});
 let spawnError;chrome.on('error',e=>{spawnError=e});
 let port;
 for(let i=0;i<150;i++){if(spawnError)throw spawnError;try{port=Number((await readFile(join(dir,'DevToolsActivePort'),'utf8')).split('\n')[0]);if(port)break}catch{}await sleep(100)}
 if(!port)throw Error('Chrome no inició CDP');
 let page;
 for(let i=0;i<100;i++){try{const pages=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();page=pages.find(x=>x.type==='page'&&x.url===url);if(page)break}catch{}await sleep(100)}
 if(!page)throw Error('Página de pruebas no disponible');
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true})});
 const result=await new Promise((ok,fail)=>{
  const timeout=setTimeout(()=>fail(Error('Timeout prueba navegador')),90000);
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id!==1)return;clearTimeout(timeout);if(m.error||m.result?.exceptionDetails)fail(Error(JSON.stringify(m.error||m.result.exceptionDetails)));else ok(m.result.result.value)});
  ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:"(async()=>{for(let i=0;i<150&&!globalThis.__asiaTestPromise;i++)await new Promise(r=>setTimeout(r,100));if(!globalThis.__asiaTestPromise)throw Error('Harness no inicializado: '+location.href+' '+document.title+' '+document.readyState);return await globalThis.__asiaTestPromise})()",awaitPromise:true,returnByValue:true}}));
 });
 if(!result?.ok)throw Error('Resultado inválido');
 console.log('Chrome real OK:',result.checks);
}finally{
 ws?.close();chrome?.kill();if(chrome&&chrome.exitCode===null&&chrome.signalCode===null)await Promise.race([once(chrome,'exit'),sleep(3000)]);
 server.close();await rm(dir,{recursive:true,force:true,maxRetries:3,retryDelay:200});
}
