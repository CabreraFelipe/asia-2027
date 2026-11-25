// All tests OFFLINE. Strict release hashing, previous release byte parity,
// staging-only Wrangler target, and complete V11.21 regression chain.
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),base=resolve(root,'../V11.21-STAGING');
const fail=m=>{console.error('V11.24 PREFLIGHT ERROR: '+m);process.exit(1);};
const read=(folder,p)=>readFileSync(join(folder,p));
const hash=b=>createHash('sha256').update(b).digest('hex');
const walk=(folder,part='')=>readdirSync(join(folder,part),{withFileTypes:true}).flatMap(e=>{const k=part?part+'/'+e.name:e.name;return e.isDirectory()?walk(folder,k):e.isFile()?[k]:[];}).sort();
const expected=new Map();
for(const line of read(root,'SHA256_V11.24.txt').toString().split(/\r?\n/).filter(x=>x&&!x.startsWith('#'))){
 const m=/^([a-f0-9]{64})  ([^\\]+)$/.exec(line);
 if(!m||m[2].startsWith('/')||m[2].split('/').some(p=>!p||p==='..'||p==='.')||expected.has(m[2]))fail('Formato de inventario interno incorrecto');
 expected.set(m[2],m[1]);
 if(!existsSync(join(root,m[2]))||hash(read(root,m[2]))!==m[1])fail('SHA-256 incorrecto '+m[2]);
}
const actual=walk(root).filter(x=>x!=='SHA256_V11.24.txt');
if(actual.length!==expected.size||actual.some(f=>!expected.has(f)))fail('Asset inesperado o ausente');
const old=walk(base);for(const f of old){
 if(f==='wrangler.preview.toml')continue;
 if(!existsSync(join(root,f))||hash(read(base,f))!==hash(read(root,f)))fail('Archivo anterior modificado '+f);
}
const oldcfg=read(base,'wrangler.preview.toml').toString();
const cfg=read(root,'wrangler.preview.toml').toString();
if(cfg!==oldcfg.replace('src/worker1121.mjs','src/worker1124.mjs')||!cfg.includes('name = "asia-v1111-identity-staging"')||!cfg.includes('database_name = "asia-v11-db-staging"'))fail('Target Cloudflare distinto del staging');
if(walk(root,'migrations').join('\n')!==walk(base,'migrations').join('\n'))fail('Se modificaron las migraciones');
for(const file of ['src/worker1124.mjs','src/assets1124.mjs','web124/app.js','scripts/precheck1124.mjs','scripts/smoke1124.mjs','tests/test1124.mjs','tests/test_upgrade1124.mjs']){
 const p=spawnSync(process.execPath,['--check',join(root,file)],{encoding:'utf8',timeout:30000});
 if(p.status!==0||p.error)fail('Error JS '+file+' '+(p.stderr||p.error?.message));
}
console.log('V11.24: '+expected.size+' hashes SHA-256; '+old.length+' archivos anteriores preservados, D1 sin migracion.');
const regression=spawnSync(process.execPath,[join(base,'scripts/preflight1121.mjs')],{cwd:base,encoding:'utf8',timeout:360000,env:{...process.env,NODE_NO_WARNINGS:'1'}});
if(regression.status!==0||regression.error||regression.signal)fail('Regresiones de V11.21: '+(regression.stdout||'')+'\n'+(regression.stderr||'')+'\n'+(regression.error?.message||''));
console.log((regression.stdout||'').trim());
for(const test of ['test1124.mjs','test_upgrade1124.mjs']){
 const r=spawnSync(process.execPath,[join(root,'tests',test)],{cwd:root,encoding:'utf8',timeout:150000,env:{...process.env,NODE_NO_WARNINGS:'1'}});
 if(r.status!==0||r.error||r.signal)fail('Test nuevo '+test+': '+(r.stdout||'')+'\n'+(r.stderr||'')+'\n'+(r.error?.message||''));
 console.log((r.stdout||'').trim());
}
console.log('V11.24 PREFLIGHT COMPLETO: codigo listo para validacion humana. Sin deploy.');
