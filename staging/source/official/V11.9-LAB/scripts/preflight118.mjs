// V11.8 single-command offline audit. No npm install, no credentials, no remote requests.
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join,relative} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const run=(file)=>{
 const p=spawnSync(process.execPath,[file],{cwd:root,encoding:'utf8',timeout:180000,env:{...process.env,NODE_NO_WARNINGS:'1'}});
 if(p.error||p.status!==0){console.error('FALLÓ',file,(p.stdout||'').trim(),(p.stderr||'').trim());process.exit(1);}
 console.log('OK',file,(p.stdout||'').trim().split('\n').at(-1));
};
const manifest=readFileSync(join(root,'SHA256_V11.8.txt'),'utf8').trim().split('\n').slice(1);
let n=0;
for(const line of manifest){
 const sep=line.indexOf('  ');if(sep!==64)throw Error('INVALID_SHA256_MANIFEST');
 const expected=line.slice(0,64),relativePath=line.slice(sep+2);
 if(relativePath.startsWith('/')||relativePath.includes('..')||relativePath.includes('\\'))throw Error('INVALID_MANIFEST_PATH');
 const path=join(root,relativePath);if(!existsSync(path))throw Error('MISSING_'+relativePath);
 const found=createHash('sha256').update(readFileSync(path)).digest('hex');
 if(found!==expected)throw Error('HASH_MISMATCH_'+relativePath);
 n++;
}
const css=(name)=>createHash('sha256').update(readFileSync(join(root,name))).digest('hex');
if(css('web/styles.css')!==css('v118/styles.css'))throw Error('VISUAL_STYLE_CHANGED');
console.log(`OK integridad: ${n} archivos SHA-256; CSS anterior idéntico.`);
for(const item of ['tests/test.mjs','tests/test111.mjs','tests/test112.mjs','tests/test113.mjs','tests/test114.mjs','tests/test115.mjs','tests/test116.mjs','tests/test117.mjs','tests/test118.mjs','tests/test118_http.mjs'])run(item);
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(d,e.name)):[join(d,e.name)]);
let js=0;
for(const path of walk(root)){
 if(!/\.(?:js|mjs)$/.test(path))continue;
 const p=spawnSync(process.execPath,['--check',path],{cwd:root,encoding:'utf8',timeout:30000});
 if(p.status!==0){console.error(p.stderr);throw Error('SYNTAX_'+relative(root,path));}js++;
}
console.log(`OK sintaxis de ${js} módulos JavaScript.`);
console.log('V11.8 PREFLIGHT: VALIDADO OFFLINE. Sin Cloudflare, sin datos personales, sin desplegar.');
