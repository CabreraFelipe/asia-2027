// Full offline quality gate and SHA-256 manifest; compare V11.16 source and execute all tests.
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),prev=resolve(root,'../V11.16-STAGING');
const stop=m=>{console.error('V11.17 PREFLIGHT ERROR: '+m);process.exit(1);};
const read=(r,p)=>readFileSync(join(r,p));const text=p=>read(root,p).toString('utf8');
const sha=x=>createHash('sha256').update(x).digest('hex');
const list=r=>{const names=[];const walk=p=>{for(const d of readdirSync(join(r,p),{withFileTypes:true})){const x=p?p+'/'+d.name:d.name;if(d.isDirectory())walk(x);else if(d.isFile())names.push(x);}};walk('');return names;};
const parts=text('SHA256_V11.17.txt').split(/\r?\n/).filter(x=>x&&!x.startsWith('#'));const seen=new Set();
for(const line of parts){const idx=line.indexOf('  '),digest=line.slice(0,idx),p=line.slice(idx+2);if(idx!==64||!/^[a-f0-9]{64}$/.test(digest)||!p||p.includes('..')||p.includes('\\')||p.startsWith('/')||seen.has(p))stop('Manifiesto inválido');seen.add(p);if(!existsSync(join(root,p))||sha(read(root,p))!==digest)stop('Hash incorrecto: '+p);}
const files=list(root).filter(p=>p!=='SHA256_V11.17.txt');if(files.length!==seen.size||files.some(p=>!seen.has(p)))stop('Archivos agregados u omitidos en manifiesto');
for(const p of list(prev)){if(p==='wrangler.preview.toml')continue;if(!existsSync(join(root,p))||sha(read(root,p))!==sha(read(prev,p)))stop('Archivo heredado cambiado: '+p);}
const cfg=text('wrangler.preview.toml'),before=read(prev,'wrangler.preview.toml').toString();
if(cfg!==before.replace('main = "src/worker1116.mjs"','main = "src/worker1117.mjs"')||!cfg.includes('name = "asia-v1111-identity-staging"')||!cfg.includes('database_name = "asia-v11-db-staging"')||!cfg.includes('database_id = "05420c2a-d083-48ee-bc4f-f644177875f9"'))stop('Wrangler destino no permitido');
if(sha(read(root,'web117/asia106-original.css'))!==sha(read(prev,'web116/asia106-original.css')))stop('CSS original V10.6 alterado');
for(const [alias,name] of Object.entries({html117:'index.html',app117:'app.js',original117Style:'asia106-original.css',style115_117:'stage115.css',style116_117:'stage116.css',style117:'stage117.css',archive116_117:'archive116.js',bundle117:'bundle117.js'}))if(!text('src/assets1117.mjs').includes('export const '+alias+' = '+JSON.stringify(text('web117/'+name))+';'))stop('Assets no coinciden: '+name);
const worker=text('src/worker1117.mjs'),app=text('web117/app.js');
if(!worker.includes("version:'11.17'")||!worker.includes("/v11.17/")||!worker.includes("__Host-asia1117_return")||!app.includes('restoreFullBundle')||!app.includes('downloadFullBundle')||!app.includes('checkNoDrafts'))stop('Contratos V11.17 incorrectos');
for(const code of [worker,app,text('web117/bundle117.js')])if(code.includes('innerHTML')||code.includes('localStorage')||code.includes('asia-2027-ai.workers.dev'))stop('Código peligroso o productivo');
for(const file of ['src/worker1117.mjs','src/assets1117.mjs','web117/app.js','web117/bundle117.js','scripts/precheck1117.mjs','scripts/smoke1117.mjs','scripts/preflight1117.mjs','tests/test1117.mjs']){
 const check=spawnSync(process.execPath,['--check',join(root,file)],{cwd:root,encoding:'utf8',timeout:30000});if(check.status!==0||check.error)stop('Syntax '+file+' '+(check.stderr||check.error?.message));
}
const run=(dir,script)=>{const r=spawnSync(process.execPath,[join(dir,script)],{cwd:dir,encoding:'utf8',timeout:240000,env:{...process.env,NODE_NO_WARNINGS:'1'}});if(r.status!==0||r.error)stop('Regression failed '+script+'\n'+r.stdout+'\n'+r.stderr);console.log((r.stdout||'').trim());};
console.log('V11.17: '+seen.size+' hashes; '+list(prev).length+' archivos V11.16 heredados sin alterar; staging D1 exclusivo.');
run(prev,'scripts/preflight1116.mjs');run(root,'tests/test1117.mjs');
console.log('V11.17 PREFLIGHT: VALIDADO OFFLINE. SIN despliegue ni datos personales.');
