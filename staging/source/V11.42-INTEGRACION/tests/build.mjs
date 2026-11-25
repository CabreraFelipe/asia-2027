// Produces a disposable deploy directory; never writes root/original files.
import {cpSync,mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {join,dirname} from 'node:path';
const base='staging/source/V11.42-INTEGRACION',out=base+'/dist',web=out+'/assets/v11.42',candidate='staging/source/V11.29-INTEGRACION/tests/candidate';
if(existsSync(out))throw Error('Build debe ser nuevo');
mkdirSync(web,{recursive:true});cpSync(base+'/web',web,{recursive:true});
const rootFiles=readdirSync('.').filter(n=>/\.(mjs|js)$/.test(n)&&n!=='sw.js'&&statSync(n).isFile());
for(const n of rootFiles)if(n==='accounts106.js'||n.endsWith('.mjs'))cpSync(n,web+'/'+n);
for(const n of ['asia-icon-v4-192.png','asia-icon-v4-512.png','asia-icon-v4-180.png'])cpSync(n,web+'/'+n);
const manifest=JSON.parse(readFileSync('manifest.json','utf8'));manifest.id='/v11.42/';manifest.start_url='/v11.42/index.html';manifest.scope='/v11.42/';manifest.name='Asia 2027 · Pruebas V11.42';manifest.short_name='Asia prueba';delete manifest.shortcuts;writeFileSync(web+'/manifest.json',JSON.stringify(manifest));
cpSync(candidate,web+'/diary',{recursive:true});
const origin='asia-v1142-candidate-staging';
for(const n of ['candidate-preload.js','candidate-store.mjs']){const p=web+'/diary/'+n,s=readFileSync(p,'utf8');if(!s.includes("location.hostname!=='127.0.0.1'"))throw Error('Preload inesperado');writeFileSync(p,s.replace("location.hostname!=='127.0.0.1'","!/^asia-v1142-candidate-staging\\.[a-z0-9-]+\\.workers\\.dev$/.test(location.hostname)"))}
const diary=web+'/diary/index.html';writeFileSync(diary,readFileSync(diary,'utf8').replace(/<link rel="manifest" href="manifest.json">/,''));
const patch=s=>s.replaceAll('asia-v1111-identity-staging',origin);
const dirs=readdirSync('staging/source').filter(n=>/^V11\.(?:2[5-9]|3[0-9]|4[01])-INTEGRACION$/.test(n));
for(const d of dirs){const src='staging/source/'+d+'/src';if(!existsSync(src))continue;for(const n of readdirSync(src).filter(n=>n.endsWith('.mjs'))){const p=web+'/'+src+'/'+n;mkdirSync(dirname(p),{recursive:true});writeFileSync(p,patch(readFileSync(src+'/'+n,'utf8')))}}
// Server modules isolated from static asset binding. Preserve relative paths for imports.
const server=out+'/server',sroot=server+'/staging/source';
for(const d of dirs){const src='staging/source/'+d+'/src';if(!existsSync(src))continue;for(const n of readdirSync(src).filter(n=>n.endsWith('.mjs'))){const p=server+'/'+src+'/'+n;mkdirSync(dirname(p),{recursive:true});writeFileSync(p,patch(readFileSync(src+'/'+n,'utf8')))}}
for(const n of rootFiles.filter(n=>n.endsWith('.mjs')))cpSync(n,server+'/'+n);
const official='staging/source/official/V11.24-STAGING/src';for(const n of readdirSync(official).filter(n=>n.endsWith('.mjs'))){const p=server+'/'+official+'/'+n;mkdirSync(dirname(p),{recursive:true});writeFileSync(p,patch(readFileSync(official+'/'+n,'utf8')))}
const worker=sroot+'/V11.42-INTEGRACION/src/worker.mjs';mkdirSync(dirname(worker),{recursive:true});cpSync(base+'/src/worker.mjs',worker);
function walk(dir){return readdirSync(dir).flatMap(n=>{const p=join(dir,n);return statSync(p).isDirectory()?walk(p):[p]})}
// Remove server-only browser files; sync needs integral-v106 and large-sync for validation.
for(const p of walk(web).filter(p=>/\/(?:authorized-worker|service-worker|worker|private-provider|service-gateway)\.mjs$/.test(p))){/* kept only as static code if explicitly imported; no credentials, no server env */}
const paths=walk(web).map(p=>'/'+p.slice((out+'/assets/').length)).filter(p=>!p.endsWith('/diary/manifest.json'));
writeFileSync(server+'/index.mjs',"import {createPwaWorker} from './staging/source/V11.42-INTEGRACION/src/worker.mjs';\nexport default createPwaWorker({assetPaths:new Set("+JSON.stringify(paths)+")});\n");
cpSync(base+'/wrangler.template.toml',out+'/wrangler.template.toml');
console.log('PWA isolated package:',paths.length,'exact assets, no original changes');
