// Deterministic local preflight: hash every V11.16 file, compare all preserved source files to V11.15,
// verify Cloudflare destination and run all previous version tests + recovery-specific new tests.
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),previous=resolve(root,'../V11.15-STAGING');
const stop=s=>{console.error('V11.16 PREFLIGHT ERROR: '+s);process.exit(1);};
const bytes=(base,path)=>readFileSync(join(base,path));
const text=path=>bytes(root,path).toString('utf8');
const hash=b=>createHash('sha256').update(b).digest('hex');
const lines=text('SHA256_V11.16.txt').split(/\r?\n/).filter(s=>s&&!s.startsWith('#'));
const seen=new Set();
for(const line of lines){
 const k=line.indexOf('  '),digest=line.slice(0,k),path=line.slice(k+2);
 if(k!==64||!/^[a-f0-9]{64}$/.test(digest)||!path||path.startsWith('/')||path.includes('..')||path.includes('\\')||seen.has(path))stop('Manifiesto no confiable');
 seen.add(path);
 if(!existsSync(join(root,path))||hash(bytes(root,path))!==digest)stop('Hash inválido: '+path);
}
const files=[];
const visit=path=>{for(const d of readdirSync(join(root,path),{withFileTypes:true})){const rel=path?path+'/'+d.name:d.name;if(d.isDirectory())visit(rel);else if(d.isFile()&&rel!=='SHA256_V11.16.txt')files.push(rel);}};
visit('');
if(files.some(p=>!seen.has(p))||files.length!==seen.size)stop('Archivos omitidos o inesperados en V11.16');
const prevFiles=[];
const visitPrevious=path=>{for(const d of readdirSync(join(previous,path),{withFileTypes:true})){const rel=path?path+'/'+d.name:d.name;if(d.isDirectory())visitPrevious(rel);else if(d.isFile())prevFiles.push(rel);}};
visitPrevious('');
for(const path of prevFiles){
 if(path==='wrangler.preview.toml')continue;
 if(!existsSync(join(root,path))||hash(bytes(root,path))!==hash(bytes(previous,path)))stop('Se alteró el archivo heredado '+path);
}
const cfg=text('wrangler.preview.toml'),old=bytes(previous,'wrangler.preview.toml').toString();
if(cfg!==old.replace('main = "src/worker1115.mjs"','main = "src/worker1116.mjs"')||!cfg.includes('name = "asia-v1111-identity-staging"')||!cfg.includes('database_name = "asia-v11-db-staging"')||!cfg.includes('database_id = "05420c2a-d083-48ee-bc4f-f644177875f9"'))stop('Destino de Wrangler adulterado');
for(const p of ['migrations/0006_identity_oidc.sql','migrations/0007_synthetic_journal_v115.sql'])if(hash(bytes(root,p))!==hash(bytes(previous,p)))stop('Migración previa alterada');
if(hash(bytes(root,'web116/asia106-original.css'))!==hash(bytes(previous,'web115/asia106-original.css'))||hash(bytes(root,'web116/asia106-original.css'))!=='59cfe838b42212003bebe9dfc65a90831e2e222ab50b50775475079087b2e1ed')stop('CSS original cambiado');
for(const [alias,path] of Object.entries({html116:'web116/index.html',app116:'web116/app.js',original116Style:'web116/asia106-original.css',style115_116:'web116/stage115.css',style116:'web116/stage116.css',archive116:'web116/archive116.js'}))if(!text('src/assets1116.mjs').includes('export const '+alias+' = '+JSON.stringify(text(path))+';'))stop('Asset empaquetado no coincide: '+alias);
const worker=text('src/worker1116.mjs'),app=text('web116/app.js');
if(!worker.includes("version:'11.16'")||!worker.includes('NUBE_DIVERGENTE')&&(!app.includes('restoreArchive'))||!app.includes('await refresh()')||!app.includes('await putDraft')||!app.includes("'asia-v1112-demo-keys'"))stop('Contrato de interfaz no preservado');
if(app.includes('innerHTML')||app.includes('localStorage')||app.includes('console.log')||app.includes('document.cookie'))stop('Cliente incompatible con aislamiento');
for(const path of ['src/assets1116.mjs','src/worker1116.mjs','web116/app.js','web116/archive116.js','scripts/precheck1116.mjs','scripts/smoke1116.mjs','scripts/preflight1116.mjs','tests/test1116.mjs']){
 const check=spawnSync(process.execPath,['--check',join(root,path)],{cwd:root,encoding:'utf8',timeout:30000});
 if(check.status!==0||check.error)stop('Error JS '+path+' '+(check.stderr||check.error?.message));
}
function run(folder,script){const result=spawnSync(process.execPath,[join(folder,script)],{cwd:folder,encoding:'utf8',timeout:240000,env:{...process.env,NODE_NO_WARNINGS:'1'}});if(result.status!==0||result.error)stop('Pruebas fallidas: '+script+'\n'+result.stdout+'\n'+result.stderr);console.log((result.stdout||'').trim());}
console.log('V11.16: '+seen.size+' hashes verificados, '+prevFiles.length+' archivos heredados idénticos, Worker/D1 exclusivos de staging.');
run(previous,'scripts/preflight1115.mjs');
run(root,'tests/test1116.mjs');
console.log('V11.16 PREFLIGHT: VALIDADO OFFLINE. SIN despliegue, SIN datos personales.');
