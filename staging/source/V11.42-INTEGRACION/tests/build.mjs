// Produces a disposable deploy directory; never writes root/original files.
import {cpSync,mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {join,dirname,resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
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
// Candidate-only diagnostic; do not alter original release831.mjs.
// Codes are categorical, never raw exception messages or user records.
const releaseFile=web+'/diary/release831.mjs';
const releaseText=readFileSync(releaseFile,'utf8'),catchMarker="catch{window.asiaGym84Ready=false;";
if(releaseText.split(catchMarker).length!==2)throw Error('Marcador de diagnóstico Gym no único');
writeFileSync(releaseFile,releaseText.replace(catchMarker,`catch(e){const m=String(e?.message||'');window.asiaPilotGymDiagnostic=/Rama bloqueada|Permiso local vencido/.test(m)?'LEASE':/Sesión|sesión|Diario bloqueado/.test(m)?'SESSION':/Revisión Gym/.test(m)?'REVISION':/Registro inicial/.test(m)?'INITIAL':/Esquema|Límite de registros|ID duplicado/.test(m)?'SCHEMA':/Candidato CI|Contexto incompleto|openStore|store\.read|store\.close/.test(m)?'ADAPTER':/read|lectura|Transacción/.test(m)?'READ':'OTHER';window.asiaGym84Ready=false;`));
// Candidate-only header personalization uses the existing encrypted diary profile.
// Never derive a display name from email or expose Google profile claims.
const profileFile=web+'/diary/profile100.js';
let profileText=readFileSync(profileFile,'utf8');
const replaceProfile=(from,to)=>{if(profileText.split(from).length!==2)throw Error('Marcador de perfil no único');profileText=profileText.replace(from,to)};
replaceProfile("function render(){if(!panel.open)return;", "function renderHeaderName(){const h=document.querySelector('header .brand h1');if(h){h.textContent=window.asiaExtras830.profile100(data.settings?.profile100).displayName.trim()||'Mi progreso';h.style.overflowWrap='anywhere';}}function render(){renderHeaderName();if(!panel.open)return;");
replaceProfile("load();panel.addEventListener('toggle',render);","load();renderHeaderName();panel.addEventListener('toggle',render);");
writeFileSync(profileFile,profileText);
execFileSync(process.execPath,['--check',profileFile],{stdio:'inherit'});
// Candidate only: new accounts opt in to reminders. Explicit imported
// preferences remain authoritative; default times are suggestions, not schedules.
const remindersFile=web+'/diary/reminders821.js';
let remindersText=readFileSync(remindersFile,'utf8');
const replaceReminder=(from,to)=>{if(remindersText.split(from).length!==2)throw Error('Marcador de recordatorios no único');remindersText=remindersText.replace(from,to)};
replaceReminder("cloudKeys.includes(k)?raw?.enabled?.[k]!==false:raw?.enabled?.[k]===true","raw?.enabled?.[k]===true");
replaceReminder("typeof raw?.cloudEnabled?.[k]==='boolean'?raw.cloudEnabled[k]:raw?.enabled?.[k]!==false","typeof raw?.cloudEnabled?.[k]==='boolean'?raw.cloudEnabled[k]:raw?.enabled?.[k]===true");
replaceReminder("Horarios en Uruguay. Elegí qué mostrar al abrir la app y qué programar en la nube.","Horarios en Uruguay. Cada cuenta elige sus propios avisos; los horarios sugeridos no activan notificaciones. Elegí qué mostrar al abrir la app y qué programar en la nube.");
writeFileSync(remindersFile,remindersText);
execFileSync(process.execPath,['--check',remindersFile],{stdio:'inherit'});
const diary=web+'/diary/index.html';writeFileSync(diary,readFileSync(diary,'utf8').replace(/<link rel="manifest" href="manifest.json">/,''));
const patch=s=>s.replaceAll('asia-v1111-identity-staging',origin);
const dirs=readdirSync('staging/source').filter(n=>/^V11\.(?:2[5-9]|3[0-9]|4[01])-INTEGRACION$/.test(n));
for(const d of dirs){const src='staging/source/'+d+'/src';if(!existsSync(src))continue;for(const n of readdirSync(src).filter(n=>n.endsWith('.mjs'))){const p=web+'/'+src+'/'+n;mkdirSync(dirname(p),{recursive:true});writeFileSync(p,patch(readFileSync(src+'/'+n,'utf8')))}}
// Verify the actual browser dependency graph, including original pure classic scripts
// imported for their side effects by migration88. Do not copy arbitrary missing files.
const visited=new Set(),assetRoot=resolve(web);
function dependencies(file){
 const abs=resolve(file);if(visited.has(abs))return;visited.add(abs);
 checkPath(abs);const source=readFileSync(abs,'utf8');
 const imports=[...source.matchAll(/^\s*(?:import\s+(?:[^'";\n]*?\s+from\s+)?|export\s+[^'";\n]*?\s+from\s+)['"]([^'"]+)['"]/gm)].map(m=>m[1]);
 for(const spec of imports){
  if(!spec.startsWith('.'))throw Error('Import no local: '+spec);
  const target=resolve(dirname(abs),spec);checkPath(target);
  if(!existsSync(target)){
   const rel=relative(assetRoot,target);
   if(!rel.includes('/')&&['core105.js','extras830.js','gym826.js','schedule829.js'].includes(rel)&&rootFiles.includes(rel))cpSync(rel,target);
   else throw Error('Dependencia de shell ausente: '+rel);
  }
  dependencies(target);
 }
}
function checkPath(p){if(!p.startsWith(assetRoot+'/'))throw Error('Dependencia fuera del paquete');}
dependencies(web+'/app.mjs');
console.log('Shell static dependency graph:',visited.size,'modules; original pure JS dependencies included');
// Server modules isolated from static asset binding. Preserve relative paths for imports.
const server=out+'/server',sroot=server+'/staging/source';
for(const d of dirs){const src='staging/source/'+d+'/src';if(!existsSync(src))continue;for(const n of readdirSync(src).filter(n=>n.endsWith('.mjs'))){const p=server+'/'+src+'/'+n;mkdirSync(dirname(p),{recursive:true});writeFileSync(p,patch(readFileSync(src+'/'+n,'utf8')))}}
for(const n of rootFiles.filter(n=>n.endsWith('.mjs')))cpSync(n,server+'/'+n);
const official='staging/source/official/V11.24-STAGING/src';for(const n of readdirSync(official).filter(n=>n.endsWith('.mjs'))){const p=server+'/'+official+'/'+n;mkdirSync(dirname(p),{recursive:true});writeFileSync(p,patch(readFileSync(official+'/'+n,'utf8')))}
const worker=sroot+'/V11.42-INTEGRACION/src/worker.mjs';mkdirSync(dirname(worker),{recursive:true});cpSync(base+'/src/worker.mjs',worker);
function walk(dir){return readdirSync(dir).flatMap(n=>{const p=join(dir,n);return statSync(p).isDirectory()?walk(p):[p]})}
// Public entry carries a fingerprint of the complete private and public asset set.
// Compute before adding the comment, so the build is reproducible and noncircular.
const fingerprint=createHash('sha256');
for(const p of walk(web).sort()){
 const bytes=readFileSync(p);fingerprint.update(JSON.stringify([relative(web,p),bytes.length])+String.fromCharCode(10));fingerprint.update(bytes);
}
// Also bind the public fingerprint to the server source; a CSP-only change
// must not pass the smoke check using an older Worker with identical assets.
for(const p of walk(server).sort()){
 const bytes=readFileSync(p);fingerprint.update(JSON.stringify(['server',relative(server,p),bytes.length])+String.fromCharCode(10));fingerprint.update(bytes);
}
const entryFile=web+'/entry.js',lf=String.fromCharCode(10);writeFileSync(entryFile,readFileSync(entryFile,'utf8')+lf+'// asia-pilot-package-sha256: '+fingerprint.digest('hex')+lf);
execFileSync(process.execPath,['--check',entryFile],{stdio:'inherit'});
const paths=walk(web).map(p=>'/'+p.slice((out+'/assets/').length)).filter(p=>!p.endsWith('/diary/manifest.json'));
writeFileSync(server+'/index.mjs',"import {createPwaWorker} from './staging/source/V11.42-INTEGRACION/src/worker.mjs';\nexport default createPwaWorker({assetPaths:new Set("+JSON.stringify(paths)+")});\n");
cpSync(base+'/wrangler.template.toml',out+'/wrangler.template.toml');
mkdirSync(out+'/migrations');
for(const [dir,n] of [
 ['staging/source/official/V11.9-LAB/migrations','0001_staging.sql'],
 ['staging/source/official/V11.24-STAGING/migrations','0006_identity_oidc.sql'],
 ['staging/source/official/V11.24-STAGING/migrations','0007_synthetic_journal_v115.sql'],
 ['staging/source/V11.38-INTEGRACION/migrations','0009_large_sync.sql']
])cpSync(dir+'/'+n,out+'/migrations/'+n);
console.log('PWA isolated package:',paths.length,'exact assets, no original changes');
