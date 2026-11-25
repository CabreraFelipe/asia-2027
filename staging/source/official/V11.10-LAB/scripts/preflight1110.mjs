// Single-command V11.10 preflight with original baseline regression + new security tests.
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join,relative} from 'node:path';
const dir=resolve(dirname(fileURLToPath(import.meta.url)),'..'),prior=resolve(dir,'../V11.9-LAB');
const fail=s=>{console.error('V11.10 PREFLIGHT ERROR:',s);process.exit(1);};
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(p,e.name)):[join(p,e.name)]);
if(!existsSync(prior))fail('Falta el directorio V11.9-LAB original.');
if(sha(join(dir,'web/styles.css'))!==sha(join(prior,'v119/styles.css')))fail('El CSS fue modificado');
for(const name of ['index.html','styles.css','app.mjs'])if(!existsSync(join(dir,'web',name)))fail('Falta UI '+name);
if(!readFileSync(join(dir,'web/index.html'),'utf8').includes('v11.10'))fail('Cabecera de versión incorrecta');
let count=0;const listed=new Set();
const manifest=readFileSync(join(dir,'SHA256_V11.10.txt'),'utf8').trim().split('\n').slice(1);
for(const line of manifest){const i=line.indexOf('  ');if(i!==64)fail('Manifiesto ilegible');const hash=line.slice(0,64),path=line.slice(i+2);if(!/^[a-f0-9]{64}$/.test(hash)||path.startsWith('/')||path.includes('..')||path.includes('\\')||listed.has(path))fail('Ruta no admitida '+path);if(!existsSync(join(dir,path))||sha(join(dir,path))!==hash)fail('Hash incorrecto '+path);listed.add(path);count++;}
for(const file of walk(dir)){const path=relative(dir,file).replaceAll('\\','/');if(path==='SHA256_V11.10.txt')continue;if(!listed.has(path))fail('Archivo sin manifest '+path);}
const run=(cwd,script)=>{const p=spawnSync(process.execPath,[script],{cwd,encoding:'utf8',timeout:210000,env:{...process.env,NODE_NO_WARNINGS:'1'}});if(p.error||p.status!==0)fail(script+' '+p.stdout+' '+p.stderr+' '+(p.error?.message||''));console.log((p.stdout||'').trim());};
console.log('V11.10: SHA-256 verificado en '+count+' archivos y CSS original inalterado.');
run(prior,'scripts/preflight119.mjs');
run(dir,'tests/test1110.mjs');
let js=0;for(const file of walk(dir))if(/\.(?:mjs|js)$/.test(file)){const p=spawnSync(process.execPath,['--check',file],{encoding:'utf8',timeout:20000});if(p.status!==0)fail('Sintaxis '+relative(dir,file)+' '+p.stderr);js++;}
console.log('V11.10: sintaxis correcta en '+js+' módulos JS.');
console.log('V11.10 PREFLIGHT: VALIDADO OFFLINE.');
