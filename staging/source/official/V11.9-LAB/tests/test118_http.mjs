// V11.8 laboratory local HTTP contract: only connects to 127.0.0.1.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
const choosePort=()=>new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});});
const port=await choosePort();
const child=spawn(process.execPath,['scripts/serve118.mjs'],{env:{...process.env,ASIA117_PORT:String(port)},stdio:'ignore'});
let tests=0;const check=(condition,msg)=>{assert.ok(condition,msg);tests++;};
const base=`http://127.0.0.1:${port}`;
try{
 let ready=false;
 for(let attempt=0;attempt<70;attempt++){
  if(child.exitCode!==null)throw Error('Local server terminated unexpectedly');
  try{const r=await fetch(base+'/v118/');if(r.status===200){ready=true;break;}}catch{}
  await new Promise(r=>setTimeout(r,100));
 }
 if(!ready)throw Error('Local server did not start');
 for(const [path,expected] of [['/v118/',200],['/v118/index.html',200],['/v118/app.mjs',200],['/v118/vault117.mjs',200],['/v118/styles.css',200],['/v118/sw118.js',200],['/v118/manifest.webmanifest',200],['/web/',200],['/coach115-client.mjs',200],['/wellness116-client.mjs',200],['/v11/auth/login',404],['/v11/data/backup',404],['/asia2027db',404],['/v118/../guard.mjs',404],['/v118/sw117.js',404],['/v118/notfound',404],['/v118/?query=1',404]]){
  const res=await fetch(base+path,{redirect:'manual'});
  check(res.status===expected,`GET ${path} => ${expected}, got ${res.status}`);
  check(res.headers.get('Content-Security-Policy')?.includes("default-src 'self'"),'CSP present');
  check(res.headers.get('X-Content-Type-Options')==='nosniff','No sniffing');
 }
 for(const method of ['POST','PUT','DELETE','PATCH']){
  const res=await fetch(base+'/v118/',{method});check(res.status===405,method+' blocked');
 }
 const head=await fetch(base+'/v118/',{method:'HEAD'});check(head.status===200,'HEAD available');check((await head.text()).length===0,'HEAD has no body');
 const root=await fetch(base+'/',{redirect:'manual'});check(root.status===302,'Root redirects locally');check(root.headers.get('Location')==='/v118/','Root redirect target V11.8');
 const html=await (await fetch(base+'/v118/')).text();check(html.includes('v11.8'),'Visible version from actual server');
 const js=await (await fetch(base+'/v118/app.mjs')).text();check(js.includes('importEncrypted'),'File-import integration served');
 const css=await (await fetch(base+'/v118/styles.css')).text();check(css.includes('.grid.two'),'Existing layout stylesheet served');
 console.log(`V11.8 HTTP: ${tests} verificaciones loopback correctas; sin conexiones a Internet.`);
}finally{child.kill('SIGTERM');}
