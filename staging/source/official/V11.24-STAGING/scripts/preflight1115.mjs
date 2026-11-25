// V11.15 deterministic preflight: verify exact destination, previous version, assets, source and Windows-compatible paths.
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),previous=resolve(root,'../V11.14-STAGING');
const stop=m=>{console.error('V11.15 PREFLIGHT ERROR: '+m);process.exit(1);};
const read=p=>readFileSync(join(root,p));
const string=p=>read(p).toString('utf8');
const manifest=string('SHA256_V11.15.txt').split(/\r?\n/).filter(x=>x&&!x.startsWith('#'));
const seen=new Set();
for(const line of manifest){
 const pos=line.indexOf('  '),path=line.slice(pos+2),expected=line.slice(0,pos);
 if(pos!==64||!/^[a-f0-9]{64}$/.test(expected)||!path||path.includes('..')||path.startsWith('/')||path.includes('\\')||seen.has(path))stop('Manifiesto inválido');
 seen.add(path);
 if(!existsSync(join(root,path))||createHash('sha256').update(read(path)).digest('hex')!==expected)stop('Archivo modificado o faltante: '+path);
}
const config=string('wrangler.preview.toml');
const old=readFileSync(join(previous,'wrangler.preview.toml'),'utf8');
if(config!==old.replace('main = "src/worker1114.mjs"','main = "src/worker1115.mjs"'))stop('El destino de Cloudflare fue alterado');
if(!config.includes('name = "asia-v1111-identity-staging"')||!config.includes('database_name = "asia-v11-db-staging"')||!config.includes('database_id = "05420c2a-d083-48ee-bc4f-f644177875f9"')||config.includes('database_name = "asia2027db"')||config.includes('asia-2027-rest'))stop('Solo staging autorizado');
const oldMig=readFileSync(join(previous,'migrations/0006_identity_oidc.sql'),'utf8');
if(string('migrations/0006_identity_oidc.sql')!==oldMig)stop('La migración anterior fue modificada');
const mig=string('migrations/0007_synthetic_journal_v115.sql');
if(!mig.includes('CREATE TABLE IF NOT EXISTS synthetic_journal_v115')||!/CREATE INDEX IF NOT EXISTS synthetic_journal_recent_v115/.test(mig)||/^\s*(?:DROP|ALTER|UPDATE|DELETE|INSERT|TRUNCATE)\b/im.test(mig.replace(/--[^\n]*/g,''))||mig.includes('asia2027db'))stop('Migración insegura o distinta');
if(!existsSync(join(root,'src/worker1115.mjs')))stop('No existe Worker V11.15');
const original=string('web115/asia106-original.css');
if(original!==string('web114/asia106-original.css')||createHash('sha256').update(original).digest('hex')!=='59cfe838b42212003bebe9dfc65a90831e2e222ab50b50775475079087b2e1ed')stop('No se conserva el diseño original');
const source=string('src/assets1115.mjs');
for(const [name,path] of Object.entries({html115:'web115/index.html',app115:'web115/app.js',style115:'web115/stage115.css',original115Style:'web115/asia106-original.css',crypto115:'web115/crypto115.js',journal115:'web115/journal115.js'}))if(!source.includes('export const '+name+' = '+JSON.stringify(string(path))+';'))stop('Recurso empaquetado no coincide: '+path);
const browser=string('web115/app.js');
if(browser.includes('innerHTML')||browser.includes('localStorage')||browser.includes('console.log')||!browser.includes('await putDraft')||!browser.includes('await commit')||!browser.includes("'asia-v1112-demo-keys'"))stop('Control de seguridad del cliente inválido');
const paths=['src/worker1115.mjs','src/assets1115.mjs','web115/app.js','web115/crypto115.js','web115/journal115.js','scripts/smoke1115.mjs','scripts/preflight1115.mjs','tests/test1115.mjs'];
for(const p of paths){const c=spawnSync(process.execPath,['--check',join(root,p)],{cwd:root,encoding:'utf8',timeout:25000});if(c.status!==0||c.error)stop('Error de sintaxis: '+p+' '+(c.stderr||c.error?.message));}
function run(folder,script){const result=spawnSync(process.execPath,[join(folder,script)],{cwd:folder,encoding:'utf8',timeout:240000,env:{...process.env,NODE_NO_WARNINGS:'1'}});if(result.error||result.status!==0)stop('Falló '+script+'\n'+result.stdout+'\n'+result.stderr+(result.error?.message||''));console.log((result.stdout||'').trim());}
console.log(`V11.15: ${seen.size} archivos verificados, destino Cloudflare restringido y CSS V10.6 intacto.`);
run(previous,'scripts/preflight1114.mjs');
run(root,'tests/test1115.mjs');
console.log('V11.15 PREFLIGHT: VALIDADO OFFLINE.');
console.log('Sin Google real, sin despliegue y sin tocar V10.6.');
