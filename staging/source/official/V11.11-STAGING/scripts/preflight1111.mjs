// One command, supports Windows (including spaces) and surplus ZIP files safely.
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
const dir=resolve(dirname(fileURLToPath(import.meta.url)),'..'),baseline=resolve(dir,'../V11.10-LAB');
const fail=s=>{console.error('V11.11 PREFLIGHT ERROR:',s);process.exit(1);};
const sha=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
if(!existsSync(join(baseline,'scripts/preflight1110.mjs')))fail('Falta V11.10-LAB junto a V11.11-STAGING. Extraé todo el ZIP.');
const manifest=readFileSync(join(dir,'SHA256_V11.11.txt'),'utf8').trim().split('\n').filter(x=>x&&!x.startsWith('#'));
let n=0;for(const line of manifest){const i=line.indexOf('  ');if(i!==64)fail('Manifiesto inválido');const hash=line.slice(0,64),name=line.slice(i+2);if(!/^[a-f0-9]{64}$/.test(hash)||!name||name.includes('..')||name.startsWith('/')||name.includes('\\'))fail('Ruta inválida');const file=join(dir,name);if(!existsSync(file)||sha(file)!==hash)fail('Hash diferente: '+name);n++;}
const wrangler=readFileSync(join(dir,'wrangler.identity.toml'),'utf8');
if(!wrangler.includes('asia-v1111-identity-staging')||!wrangler.includes('asia-v11-db-staging')||!wrangler.includes('STAGING_ALLOW_SYNTHETIC_SNAPSHOTS = "false"')||!wrangler.includes('05420c2a-d083-48ee-bc4f-f644177875f9'))fail('Wrangler no apunta a staging deshabilitado');
function run(cwd,entry){const p=spawnSync(process.execPath,[join(cwd,entry)],{cwd,encoding:'utf8',timeout:270000,env:{...process.env,NODE_NO_WARNINGS:'1'}});if(p.error||p.status!==0)fail(entry+' '+(p.stdout||'')+' '+(p.stderr||'')+' '+(p.error?.message||''));console.log((p.stdout||'').trim());}
console.log('V11.11: integridad SHA-256 verificada en '+n+' archivos. Staging aislado y respaldos desactivados.');
run(baseline,'scripts/preflight1110.mjs');run(dir,'tests/test1111.mjs');run(dir,'tests/test1111c.mjs');run(dir,'tests/test1111d.mjs');
const modules=['src/worker1111.mjs','src/security1111.mjs','src/client1111.mjs','scripts/preflight1111.mjs','scripts/smoke1111.mjs','tests/test1111.mjs','tests/test1111c.mjs','tests/test1111d.mjs'];
for(const mod of modules){const p=spawnSync(process.execPath,['--check',join(dir,mod)],{encoding:'utf8',timeout:20000});if(p.status!==0)fail('Sintaxis '+mod+' '+p.stderr);}
console.log('V11.11d PREFLIGHT: VALIDADO OFFLINE.');
console.log('Sin Google real, sin Cloudflare, sin contraseñas ni datos personales.');
