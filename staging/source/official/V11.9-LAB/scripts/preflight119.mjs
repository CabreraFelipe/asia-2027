// V11.9 single-command offline preflight — only local files and loopback HTTP smoke.
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join,relative} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const stop=msg=>{console.error('V11.9 PREFLIGHT FALLÓ:',msg);process.exit(1);};
const manifest=readFileSync(join(root,'SHA256_V11.9.txt'),'utf8').trim().split('\n').slice(1);
let hashes=0;const listed=new Set();
for(const line of manifest){
 const index=line.indexOf('  ');
 if(index!==64)stop('SHA256 manifest malformado');
 const digest=line.slice(0,64),path=line.slice(index+2);
 if(!/^[\da-f]{64}$/.test(digest)||path.startsWith('/')||path.includes('..')||path.includes('\\')||listed.has(path))stop('Ruta de manifest inválida');
 listed.add(path);const full=join(root,path);
 if(!existsSync(full))stop('Falta archivo '+path);
 if(createHash('sha256').update(readFileSync(full)).digest('hex')!==digest)stop('Hash no coincide '+path);
 hashes++;
}
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(d,e.name)):[join(d,e.name)]);
for(const file of walk(root)){
 const p=relative(root,file).replaceAll('\\','/');
 if(p==='SHA256_V11.9.txt')continue;
 if(!listed.has(p))stop('Archivo sin hash: '+p);
}
const sha=p=>createHash('sha256').update(readFileSync(join(root,p))).digest('hex');
if(sha('web/styles.css')!==sha('v118/styles.css')||sha('v118/styles.css')!==sha('v119/styles.css'))stop('Estética visual no conservada');
if(!readFileSync(join(root,'v119/index.html'),'utf8').includes('v11.9'))stop('Versión no visible');
const run=file=>{
 const p=spawnSync(process.execPath,[file],{cwd:root,encoding:'utf8',timeout:180000,env:{...process.env,NODE_NO_WARNINGS:'1'}});
 if(p.error||p.status!==0)stop(`${file}: ${(p.stdout||'').trim()} ${(p.stderr||'').trim()} ${p.error?.message??''}`);
 console.log('OK',file,(p.stdout||'').trim().split('\n').at(-1));
};
console.log(`OK: integridad SHA-256 de ${hashes} archivos; CSS V11.7/V11.8/V11.9 idéntico.`);
run('scripts/preflight118.mjs');
run('tests/test119.mjs');
run('tests/test119_http.mjs');
let count=0;
for(const file of walk(root))if(/\.(?:js|mjs)$/.test(file)){
 const p=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8',timeout:30000});
 if(p.status!==0)stop('Sintaxis '+relative(root,file)+' '+p.stderr);
 count++;
}
console.log(`OK: sintaxis de ${count} módulos JS.`);
console.log('V11.9 PREFLIGHT: VALIDADO OFFLINE. Sin Cloudflare, sin datos personales, sin despliegue.');
