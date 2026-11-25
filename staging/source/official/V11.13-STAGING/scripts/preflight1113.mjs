// V11.13: offline preflight; fail-closed and Windows-safe.
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const prior=resolve(root,'../V11.12-STAGING');
const die=m=>{console.error('V11.13 PREFLIGHT ERROR:',m);process.exit(1);};
const read=file=>readFileSync(file,'utf8');
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const manifest=read(join(root,'SHA256_V11.13.txt')).split(/\r?\n/).filter(x=>x&&!x.startsWith('#'));
const seen=new Set();
for(const line of manifest){
 const pos=line.indexOf('  ');if(pos!==64)die('Entrada de manifiesto inválida');
 const expected=line.slice(0,64),name=line.slice(66);
 if(!/^[0-9a-f]{64}$/.test(expected)||!name||name.includes('..')||name.startsWith('/')||name.includes('\\')||seen.has(name))die('Ruta insegura del manifiesto');
 seen.add(name);const full=join(root,name);if(!existsSync(full)||hash(full)!==expected)die('Archivo ausente o alterado: '+name);
}
const own=read(join(root,'wrangler.safety.toml'));
const previous=read(join(prior,'wrangler.integrated.toml'));
const expected=previous.replace('main = "src/worker1112.mjs"','main = "src/worker1113.mjs"');
if(own!==expected||!own.includes('main = "src/worker1113.mjs"'))die('Configuración del Worker diferente a V11.12 staging');
if(!own.includes('name = "asia-v1111-identity-staging"')||!own.includes('database_name = "asia-v11-db-staging"')||!own.includes('STAGING_ALLOW_SYNTHETIC_SNAPSHOTS = "true"'))die('Bindings de staging no autorizados');
const css=read(join(root,'web1113/styles.css'));
if(css!==read(resolve(root,'../V11.12-STAGING/web1112/styles.css'))||css!==read(resolve(root,'../V11.9-LAB/v119/styles.css')))die('Diseño visual inesperadamente modificado');
const assets=read(join(root,'src/assets1113.mjs'));
for(const [id,file] of Object.entries({html113:'index.html',css113:'styles.css',app113:'app.js',crypto113:'crypto.js',sync113:'sync113.js'})){
 if(!assets.includes('export const '+id+' = '+JSON.stringify(read(join(root,'web1113',file)))+';'))die('Archivo embebido inconsistente: '+file);
}
for(const file of ['src/worker1113.mjs','src/security1111.mjs','src/assets1112.mjs','src/assets1113.mjs','src/client1111.mjs','web1113/app.js','web1113/crypto.js','web1113/sync113.js','scripts/smoke1113.mjs','tests/test1113.mjs']){
 const result=spawnSync(process.execPath,['--check',join(root,file)],{cwd:root,encoding:'utf8',timeout:25000});if(result.error||result.status!==0)die('Sintaxis inválida '+file+' '+result.stderr);
}
function run(folder,script){
 const r=spawnSync(process.execPath,[join(folder,script)],{cwd:folder,encoding:'utf8',timeout:180000,env:{...process.env,NODE_NO_WARNINGS:'1'}});
 if(r.error||r.status!==0)die(`${script}: ${r.stdout||''}\n${r.stderr||''}\n${r.error?.message||''}`);
 console.log((r.stdout||'').trim());
}
console.log(`V11.13: ${seen.size} archivos SHA-256, Worker aislado, CSS idéntico y rutas con espacios soportadas.`);
run(prior,'scripts/preflight1112.mjs');
run(root,'tests/test1113.mjs');
console.log('V11.13 PREFLIGHT: VALIDADO OFFLINE.');
console.log('Permitido: desplegar solo asia-v1111-identity-staging. NUNCA producción.');
