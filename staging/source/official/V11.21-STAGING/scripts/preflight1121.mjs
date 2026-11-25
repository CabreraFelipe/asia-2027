// Offline verification, no real network, deploy, credentials or user data.
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),base=resolve(root,'../V11.18-STAGING');
const die=m=>{console.error('V11.21 PREFLIGHT ERROR: '+m);process.exit(1);};
const read=(dir,p)=>readFileSync(join(dir,p));const sha=b=>createHash('sha256').update(b).digest('hex');
const walk=(dir,p='')=>readdirSync(join(dir,p),{withFileTypes:true}).flatMap(x=>{const k=p?p+'/'+x.name:x.name;return x.isDirectory()?walk(dir,k):x.isFile()?[k]:[];}).sort();
const manifest=read(root,'SHA256_V11.21.txt').toString().split(/\r?\n/).filter(x=>x&&!x.startsWith('#')),expected=new Map();
for(const ln of manifest){const m=/^([a-f0-9]{64})  ([^\\]+)$/.exec(ln);if(!m||m[2].includes('..')||m[2].startsWith('/')||expected.has(m[2]))die('Manifest format');expected.set(m[2],m[1]);if(!existsSync(join(root,m[2]))||sha(read(root,m[2]))!==m[1])die('Asset checksum mismatch '+m[2]);}
const actual=walk(root).filter(x=>x!=='SHA256_V11.21.txt');if(actual.length!==expected.size||actual.some(x=>!expected.has(x)))die('Unexpected or missing file');
const originals=walk(base);for(const f of originals){if(f==='wrangler.preview.toml')continue;if(!existsSync(join(root,f))||sha(read(base,f))!==sha(read(root,f)))die('V11.18 source modified '+f);}
const cfg=read(root,'wrangler.preview.toml').toString();const oldcfg=read(base,'wrangler.preview.toml').toString();
if(cfg!==oldcfg.replace('src/worker1118.mjs','src/worker1121.mjs')||!cfg.includes('database_name = "asia-v11-db-staging"')||!cfg.includes('name = "asia-v1111-identity-staging"'))die('Unexpected deploy target');
for(const f of ['src/worker1121.mjs','src/assets1121.mjs','web121/app.js','web121/kit118.js','scripts/precheck1121.mjs','scripts/smoke1121.mjs','tests/test1121.mjs','tests/test_upgrade1121.mjs']){
 const r=spawnSync(process.execPath,['--check',join(root,f)],{encoding:'utf8',timeout:20000});if(r.status!==0||r.error)die('JS syntax '+f+': '+(r.stderr||r.error?.message));
}
console.log('V11.21: '+expected.size+' assets SHA256, '+originals.length+' archivos heredados de V11.18 intactos.');
for(const [name,folder] of [['V11.15','../V11.15-STAGING'],['V11.16','../V11.16-STAGING'],['V11.17','../V11.17-STAGING'],['V11.18','../V11.18-STAGING'],['V11.21','.']]){
 const dir=resolve(root,folder),test='tests/test'+name.replace('V','').replace('.','')+'.mjs';
 const r=spawnSync(process.execPath,[join(dir,test)],{cwd:dir,encoding:'utf8',timeout:120000,env:{...process.env,NODE_NO_WARNINGS:'1'}});
 if(r.status!==0||r.error)die(name+' tests: '+(r.stdout||'')+'\n'+(r.stderr||'')+(r.error?.message||''));
 console.log((r.stdout||'').trim());
}
const upgrade=spawnSync(process.execPath,[join(root,'tests/test_upgrade1121.mjs')],{cwd:root,encoding:'utf8',timeout:60000});
if(upgrade.status!==0||upgrade.error)die('Test de actualizacion directa 11.17/11.18: '+(upgrade.stdout||'')+(upgrade.stderr||'')+(upgrade.error?.message||''));
console.log((upgrade.stdout||'').trim());
console.log('V11.21 PREFLIGHT COMPLETO: listo para prueba humana. NO se realizó deploy.');
