// V11.12: offline integrity and comprehensive regression gate (Windows paths with spaces supported).
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const prior=resolve(root,'../V11.11-STAGING');
function fail(message){console.error('V11.12 ERROR:',message);process.exit(1);}
function sha(file){return createHash('sha256').update(readFileSync(file)).digest('hex');}
const manifest=readFileSync(join(root,'SHA256_V11.12.txt'),'utf8').split('\n').filter(x=>x.trim()&&!x.startsWith('#'));
let count=0;
for(const line of manifest){const pos=line.indexOf('  ');if(pos!==64)fail('Manifiesto SHA-256 inválido');const expected=line.slice(0,64),name=line.slice(66);if(!/^[0-9a-f]{64}$/.test(expected)||!name||name.includes('..')||name.startsWith('/')||name.includes('\\'))fail('Ruta de archivo inválida');const file=join(root,name);if(!existsSync(file)||sha(file)!==expected)fail('Archivo diferente: '+name);count++;}
const config=readFileSync(join(root,'wrangler.integrated.toml'),'utf8');
const reference=readFileSync(join(prior,'wrangler.identity.toml'),'utf8');
const expected=reference.replace('main = "src/worker1111.mjs"','main = "src/worker1112.mjs"').replace('STAGING_ALLOW_SYNTHETIC_SNAPSHOTS = "false"','STAGING_ALLOW_SYNTHETIC_SNAPSHOTS = "true"');
if(config!==expected)fail('Wrangler no coincide exactamente con la configuración staging auditada');
const css=readFileSync(join(root,'web1112/styles.css'),'utf8');
if(css!==readFileSync(resolve(root,'../V11.9-LAB/v119/styles.css'),'utf8'))fail('El CSS cambió inesperadamente');
const generated=readFileSync(join(root,'src/assets1112.mjs'),'utf8');
for(const [id,file] of [['html112','index.html'],['css112','styles.css'],['app112','app.js'],['crypto112','crypto.js']]){
 const source=readFileSync(join(root,'web1112',file),'utf8');
 if(!generated.includes('export const '+id+' = '+JSON.stringify(source)+';'))fail('La interfaz embebida no coincide: '+file);
}
function run(cwd,entry){const r=spawnSync(process.execPath,[join(cwd,entry)],{cwd,encoding:'utf8',timeout:300000,env:{...process.env,NODE_NO_WARNINGS:'1'}});if(r.error||r.status!==0)fail(`${entry}: ${r.stdout||''}\n${r.stderr||''}\n${r.error?.message||''}`);console.log((r.stdout||'').trim());}
for(const entry of ['src/worker1112.mjs','src/security1111.mjs','src/assets1112.mjs','web1112/app.js','web1112/crypto.js','tests/test1112.mjs']){
 const r=spawnSync(process.execPath,['--check',join(root,entry)],{cwd:root,encoding:'utf8',timeout:30000});if(r.error||r.status!==0)fail('Sintaxis '+entry+' '+r.stderr);
}
console.log(`V11.12: ${count} archivos verificados por SHA-256; configuración de staging y diseño intactos.`);
run(prior,'scripts/preflight1111.mjs');
run(root,'tests/test1112.mjs');
console.log('V11.12 PREFLIGHT: VALIDADO OFFLINE.');
console.log('Próximo paso autorizado: SOLO Worker asia-v1111-identity-staging, nunca producción.');
