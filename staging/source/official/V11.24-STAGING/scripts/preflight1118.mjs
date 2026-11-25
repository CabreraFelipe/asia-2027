// Full offline V11.18 release gate. No remote API calls, credentials, or Cloudflare mutation.
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),prev=resolve(root,'../V11.17-STAGING');
const stop=m=>{console.error('V11.18 PREFLIGHT ERROR: '+m);process.exit(1);};
const read=(r,p)=>readFileSync(join(r,p));const text=p=>read(root,p).toString('utf8');
const sha=x=>createHash('sha256').update(x).digest('hex');
const list=r=>{const names=[];const walk=p=>{for(const d of readdirSync(join(r,p),{withFileTypes:true})){const x=p?p+'/'+d.name:d.name;if(d.isDirectory())walk(x);else if(d.isFile())names.push(x);}};walk('');return names.sort();};
const lines=text('SHA256_V11.18.txt').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')),seen=new Set();
for(const line of lines){const idx=line.indexOf('  '),hash=line.slice(0,idx),p=line.slice(idx+2);if(idx!==64||!/^[a-f0-9]{64}$/.test(hash)||!p||p.includes('..')||p.includes('\\')||p.startsWith('/')||seen.has(p))stop('Manifiesto inválido');seen.add(p);if(!existsSync(join(root,p))||sha(read(root,p))!==hash)stop('Hash incorrecto: '+p);}
const files=list(root).filter(p=>p!=='SHA256_V11.18.txt');if(files.length!==seen.size||files.some(p=>!seen.has(p)))stop('Archivos agregados u omitidos del manifiesto');
for(const p of list(prev)){if(p==='wrangler.preview.toml')continue;if(!existsSync(join(root,p))||sha(read(root,p))!==sha(read(prev,p)))stop('Herencia V11.17 alterada: '+p);}
const cfg=text('wrangler.preview.toml'),before=read(prev,'wrangler.preview.toml').toString('utf8');
if(cfg!==before.replace('main = "src/worker1117.mjs"','main = "src/worker1118.mjs"')||!cfg.includes('name = "asia-v1111-identity-staging"')||!cfg.includes('database_name = "asia-v11-db-staging"')||!cfg.includes('database_id = "05420c2a-d083-48ee-bc4f-f644177875f9"'))stop('Wrangler destino alterado');
const s=text('src/assets1118.mjs');for(const [alias,name] of Object.entries({html118:'index.html',app118:'app.js',original118Style:'asia106-original.css',style115_118:'stage115.css',style116_118:'stage116.css',style117_118:'stage117.css',style118:'stage118.css',archive116_118:'archive116.js',bundle117_118:'bundle117.js',kit118:'kit118.js'}))if(!s.includes('export const '+alias+' = '+JSON.stringify(text('web118/'+name))+';'))stop('Asset byte-exact mismatch: '+name);
for(const f of ['asia106-original.css','stage115.css','stage116.css','stage117.css','archive116.js','bundle117.js'])if(sha(read(root,'web118/'+f))!==sha(read(prev,'web117/'+f)))stop('Legacy CSS/JS altered: '+f);
const worker=text('src/worker1118.mjs'),app=text('web118/app.js'),kit=text('web118/kit118.js'),html=text('web118/index.html');
if(!worker.includes("version:'11.18'")||!worker.includes("'/v11.18/kit118.js'")||!worker.includes('__Host-asia1118_return')||!html.includes('V11.18 · STAGING')||!app.includes('createRecoveryKit')||!app.includes('openRecoveryKit'))stop('Missing V11.18 contract');
if(!kit.includes('600000')||!kit.includes('additionalData:aad(owner)')||kit.includes('STAGING_DB')||kit.includes('localStorage')||!app.includes('verifyExistingKey'))stop('Recovery kit crypto contract invalid');
for(const code of [worker,app,kit,text('web118/index.html')])if(code.includes('innerHTML')||code.includes('localStorage')||code.includes('asia-2027-ai.workers.dev'))stop('Unsafe or production source');
const scripts=['src/worker1118.mjs','src/assets1118.mjs','web118/app.js','web118/kit118.js','scripts/preflight1118.mjs','scripts/precheck1118.mjs','scripts/smoke1118.mjs','tests/test1118.mjs'];
for(const f of scripts){const chk=spawnSync(process.execPath,['--check',join(root,f)],{cwd:root,encoding:'utf8',timeout:20000});if(chk.status!==0||chk.error)stop('Syntax '+f+': '+(chk.stderr||chk.error?.message));}
const run=(dir,script)=>{const r=spawnSync(process.execPath,[join(dir,script)],{cwd:dir,encoding:'utf8',timeout:240000,env:{...process.env,NODE_NO_WARNINGS:'1'}});if(r.status!==0||r.error)stop('Regression failed '+script+'\n'+r.stdout+'\n'+r.stderr);console.log((r.stdout||'').trim());};
console.log('V11.18: '+seen.size+' hashes y '+list(prev).length+' archivos V11.17 heredados sin modificar.');
run(prev,'scripts/preflight1117.mjs');run(root,'tests/test1118.mjs');
console.log('V11.18 PREFLIGHT: VALIDADO OFFLINE. No Cloudflare, no datos personales.');
