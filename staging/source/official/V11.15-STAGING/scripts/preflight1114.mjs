// One-command verification. Strict allowlist, hash verification, Windows path safe.
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),parent=resolve(root,'../V11.13-STAGING');
const die=message=>{console.error('V11.14 PREFLIGHT ERROR: '+message);process.exit(1);};
const file=p=>readFileSync(join(root,p));const text=p=>file(p).toString('utf8');
const manifest=text('SHA256_V11.14.txt').split(/\r?\n/).filter(x=>x&&!x.startsWith('#'));const seen=new Set();
for(const entry of manifest){const p=entry.indexOf('  '),name=entry.slice(p+2),digest=entry.slice(0,p);if(p!==64||!/^[a-f0-9]{64}$/.test(digest)||!name||name.includes('..')||name.startsWith('/')||name.includes('\\')||seen.has(name))die('Manifiesto inseguro');seen.add(name);if(!existsSync(join(root,name))||createHash('sha256').update(file(name)).digest('hex')!==digest)die('Archivo incorrecto: '+name);}
const config=text('wrangler.preview.toml'),old=readFileSync(join(parent,'wrangler.safety.toml'),'utf8');
if(config!==old.replace('main = "src/worker1113.mjs"','main = "src/worker1114.mjs"'))die('El Worker o sus bindings fueron modificados');
if(!config.includes('name = "asia-v1111-identity-staging"')||!config.includes('database_name = "asia-v11-db-staging"')||config.includes('database_name = "asia2027db"'))die('El destino no es exclusivamente staging');
const original=text('web114/asia106-original.css');
// Compare against the pinned SHA-256 of the stylesheet extracted from the actual V10.6 index.
const cssSHA=createHash('sha256').update(original).digest('hex');
if(cssSHA!=='59cfe838b42212003bebe9dfc65a90831e2e222ab50b50775475079087b2e1ed')die('Se modificaron los estilos originales de V10.6');
const assets=text('src/assets1114.mjs');
for(const [token,path] of Object.entries({html114:'web114/index.html',app114:'web114/app.js',style114:'web114/stage114.css',original106Style:'web114/asia106-original.css'}))if(!assets.includes('export const '+token+' = '+JSON.stringify(text(path))+';'))die('Recurso embebido alterado: '+path);
const browser=text('web114/app.js');
if(!browser.includes("createObjectStore('account_keys')")||!browser.includes('onupgradeneeded')||browser.includes('innerHTML')||browser.includes('localStorage'))die('Protecciones de navegador ausentes');
for(const path of ['src/worker1114.mjs','src/assets1114.mjs','src/security1111.mjs','src/client1111.mjs','scripts/smoke1114.mjs','tests/test1114.mjs','web114/app.js']){
 const syntax=spawnSync(process.execPath,['--check',join(root,path)],{cwd:root,encoding:'utf8',timeout:25000});if(syntax.error||syntax.status!==0)die('Sintaxis '+path+': '+(syntax.stderr||syntax.error?.message));
}
function run(dir,script){const r=spawnSync(process.execPath,[join(dir,script)],{cwd:dir,encoding:'utf8',timeout:240000,env:{...process.env,NODE_NO_WARNINGS:'1'}});if(r.error||r.status!==0)die('Falló '+script+'\n'+(r.stdout||'')+'\n'+(r.stderr||'')+(r.error?.message||''));console.log((r.stdout||'').trim());}
console.log('V11.14: '+seen.size+' archivos SHA-256, estilos V10.6 preservados y Worker de staging aislado.');
run(parent,'scripts/preflight1113.mjs');
run(root,'tests/test1114.mjs');
console.log('V11.14 PREFLIGHT: VALIDADO OFFLINE.');
console.log('No se ha realizado ningún despliegue.');
