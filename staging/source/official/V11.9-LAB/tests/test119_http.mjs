// V11.9 local HTTP server: security headers, strict allowlist and no write/remote access.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
const port=await new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const child=spawn(process.execPath,['scripts/serve119.mjs'],{env:{...process.env,ASIA117_PORT:String(port)},stdio:'ignore'});
let n=0;const check=(ok,msg)=>{assert.ok(ok,msg);n++;};const base=`http://127.0.0.1:${port}`;
try{
 let ready=false;for(let i=0;i<65;i++){
  if(child.exitCode!==null)throw Error('SERVER_EXIT');
  try{const r=await fetch(base+'/v119/');if(r.status===200){ready=true;break;}}catch{}
  await new Promise(ok=>setTimeout(ok,80));
 }
 check(ready,'Loopback server starts');
 const paths=[
  ['/v119/',200],['/v119/index.html',200],['/v119/app.mjs',200],['/v119/vault117.mjs',200],['/v119/styles.css',200],['/v119/sw119.js',200],['/v119/manifest.webmanifest',200],['/v119/icon.svg',200],
  ['/v118/',200],['/web/',200],['/coach115-client.mjs',200],['/wellness116-client.mjs',200],
  ['/v11/auth/login',404],['/v11/data/snapshots',404],['/cloud-bridge119.mjs',404],['/guard.mjs',404],['/v119/notfound',404],['/v119/sw118.js',404],['/v119/?x=1',404],['/v119/..%2fguard.mjs',404],['/v119/%2e%2e/guard.mjs',404],['/wrangler.api.toml',404],['/migrations/0002_auth_staging.sql',404]
 ];
 for(const [path,status]of paths){const res=await fetch(base+path,{redirect:'manual'});check(res.status===status,`GET ${path}: ${res.status} expected ${status}`);check(res.headers.get('Content-Security-Policy')?.includes("default-src 'self'"),'CSP');check(res.headers.get('X-Content-Type-Options')==='nosniff','MIME sniffing disabled');check(res.headers.get('Referrer-Policy')==='no-referrer','Referrer restricted');}
 for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS']){const r=await fetch(base+'/v119/',{method});check(r.status===405,`${method} blocked`);}
 const root=await fetch(base+'/',{redirect:'manual'});check(root.status===302,'Root redirect');check(root.headers.get('Location')==='/v119/','Root version target');
 const head=await fetch(base+'/v119/',{method:'HEAD'});check(head.status===200,'HEAD allowed');check((await head.text())==='','HEAD no body');
 const html=await (await fetch(base+'/v119/')).text();check(html.includes('v11.9'),'Version v11.9 visible');check(!html.includes('v11.8</span>'),'No stale header');
 const sw=await (await fetch(base+'/v119/sw119.js')).text();check(sw.includes('asia-v119-lab-static-1'),'Fresh service worker scope');
 console.log(`V11.9 HTTP: ${n} verificaciones locales sin conexión externa.`);
}finally{child.kill('SIGTERM');}
