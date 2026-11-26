// Produces a disposable deploy directory; never writes root/original files.
import {cpSync,mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {join,dirname,resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {patchPlanning1173} from './patch-planning1173.mjs';
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
// Explicit personal goal book v2, without legacy defaults. Undefined and v1
// keep their original semantics; no account is migrated or initialized here.
// Both the diary and the shell backup/sync validators must use the same bytes.
const extrasSource=readFileSync('extras830.js','utf8');
let extras1148=extrasSource;
function replaceExtras(from,to){if(extras1148.split(from).length!==2)throw Error('Marcador de metas no único: '+from);extras1148=extras1148.replace(from,to)}
replaceExtras('function goals101(raw){','function emptyGoals1148(){return {version:2,primary:"",items:[]};}function goals101(raw){');
replaceExtras('raw.version===1&&typeof raw.primary', '[1,2].includes(raw.version)&&typeof raw.primary');
replaceExtras('raw.items.length>=1&&raw.items.length<=100','raw.items.length>=(raw.version===1?1:0)&&raw.items.length<=100');
replaceExtras("(g.id==='asia-2027'||/^goal-[a-f0-9]{32}$/.test(g.id))","((raw.version===1&&g.id==='asia-2027')||/^goal-[a-f0-9]{32}$/.test(g.id))");
replaceExtras("check(ids.has('asia-2027')&&(raw.primary===''||items.some(g=>g.id===raw.primary&&g.status==='Activa'))","check((raw.version===2||ids.has('asia-2027'))&&(raw.primary===''||items.some(g=>g.id===raw.primary&&g.status==='Activa'))");
replaceExtras('return {version:1,primary:raw.primary,items};','return {version:raw.version,primary:raw.primary,items};');
replaceExtras('profile100,goals101,goalDay101','profile100,goals101,emptyGoals1148,goalDay101');
replaceExtras("['Peso corporal','Fuerza','Hábitos','Bienestar','Otro']","['Peso corporal','Fuerza','Hábitos','Bienestar','Otro','Running','Rendimiento deportivo']");
replaceExtras('function diary(d){','function diary(d){globalThis.asiaRunning1174.validate(d.running1174,goals101(d.settings?.goals101));if(d.running1174)globalThis.asiaRunning1174.validateHybrid(d.running1174,d.settings,globalThis.asiaSchedule829);globalThis.asiaSport1177.validate(d.sport1177,goals101(d.settings?.goals101));globalThis.asiaSport1177.assertCalendar(d.sport1177,d.settings,d.running1174,globalThis.asiaSchedule829,globalThis.asiaRunning1174);');
extras1148=readFileSync(base+'/src/sport1177.js','utf8')+'\n'+readFileSync(base+'/src/running1174.js','utf8')+'\n'+extras1148;
writeFileSync(web+'/diary/extras830.js',extras1148);
execFileSync(process.execPath,['--check',web+'/diary/extras830.js'],{stdio:'inherit'});
// V11.49: first-use invitation only with an explicitly verified empty local
// context and remote index. No automatic conversion of undefined/v1 books.
const preloadFile=web+'/diary/candidate-preload.js';
const preloadText=readFileSync(preloadFile,'utf8');
if(preloadText.split('moduleStore:f.moduleStore,').length!==2)throw Error('Marcador preload metas');
writeFileSync(preloadFile,preloadText.replace('moduleStore:f.moduleStore,','initialGoalSetup:f.initialGoalSetup===true,moduleStore:f.moduleStore,'));
const goalsFile=web+'/diary/goals101.js';
let goalsText=readFileSync(goalsFile,'utf8');
function replaceGoals(from,to){if(goalsText.split(from).length!==2)throw Error('Marcador onboarding metas no único: '+from);goalsText=goalsText.replace(from,to)}
replaceGoals("const newBtn=make('button','+ Crear nueva meta');","const setup=make('section',undefined,'card');setup.id='pilotGoals1149';setup.append(make('h3','Elegí tus propias metas'),make('p','Podés comenzar sin una meta predefinida. El calendario, las rutinas y los objetivos diarios del piloto todavía usan el programa de referencia; no son recomendaciones personales.','meta'));const startOwn=make('button','Empezar sin meta predefinida');startOwn.type='button';startOwn.id='pilotOwnGoals1149';setup.append(startOwn);el('home42').prepend(setup);const eligible=()=>asiaCandidateSession.initialGoalSetup===true&&data.settings?.goals101===undefined;const newBtn=make('button','+ Crear nueva meta');");
replaceGoals("function renderHeader(){const g=primary(book());","function renderHeader(){const b=book();const reference=el('goalPlan101');if(b.version===2)reference.textContent='Calendario del piloto: programa de referencia aún no personalizado';const g=primary(b);");
replaceGoals("function render(){renderHeader();if(!panel.open)return;","function render(){renderHeader();setup.hidden=!eligible();if(!panel.open)return;");
replaceGoals("const next=upsert(book(),g,date());","const previous=book();let next=upsert(previous,g,date());if(previous.version===2&&previous.items.length===0)next=select(next,g.id);");
replaceGoals("newBtn.onclick=()=>begin(null);","startOwn.onclick=()=>{try{if(!eligible())throw Error('Configuración inicial no disponible.');if(!canDiscard())return;if(!confirm('¿Comenzar con un libro de metas propio y vacío? No cambia tus registros, rutinas ni calendario de referencia.'))return;commit(validation.emptyGoals1148());endForm();panel.open=true;refresh();begin(null);message.textContent='Libro propio creado. Podés elegir una meta ahora o más adelante.';}catch(e){panel.open=true;message.textContent=e.message;}};newBtn.onclick=()=>begin(null);");
writeFileSync(goalsFile,goalsText);
execFileSync(process.execPath,['--check',goalsFile],{stdio:'inherit'});
// Candidate-only header personalization uses the existing encrypted diary profile.
// Never derive a display name from email or expose Google profile claims.
const profileFile=web+'/diary/profile100.js';
let profileText=readFileSync(profileFile,'utf8');
const replaceProfile=(from,to)=>{if(profileText.split(from).length!==2)throw Error('Marcador de perfil no único');profileText=profileText.replace(from,to)};
replaceProfile("function render(){if(!panel.open)return;", "const welcome=make('section',undefined,'card');welcome.id='pilotWelcome1146';welcome.append(make('h2','Personalizá tu espacio'),make('p','Elegí el nombre que querés ver en tu aplicación. Podés cambiarlo cuando quieras desde Mi perfil.','meta'));const chooseName=make('button','Elegir mi nombre');chooseName.id='pilotName1146';chooseName.type='button';chooseName.onclick=()=>{panel.open=true;render();panel.scrollIntoView({block:'start'});inputs.displayName.focus({preventScroll:true});};welcome.append(chooseName);el('home42').prepend(welcome);function renderHeaderName(){const name=window.asiaExtras830.profile100(data.settings?.profile100).displayName.trim();const h=document.querySelector('header .brand h1');if(h){h.textContent=name||'Mi progreso';h.style.overflowWrap='anywhere';}welcome.hidden=!!name;}function render(){renderHeaderName();if(!panel.open)return;");
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
// Private migration primitives; the review panel exposes only read-only comparison.
for(const n of ['prepare-rekey1153.mjs','local-rekey1158.mjs','rekey-client1159.mjs','recovery-review1161.mjs','recovery-apply1162.mjs']){
 const path=web+'/staging/source/V11.42-INTEGRACION/src/'+n;
 mkdirSync(dirname(path),{recursive:true});cpSync(base+'/src/'+n,path);
}
dependencies(web+'/app.mjs');
dependencies(web+'/staging/source/V11.42-INTEGRACION/src/rekey-client1159.mjs');
dependencies(web+'/staging/source/V11.42-INTEGRACION/src/recovery-review1161.mjs');
dependencies(web+'/staging/source/V11.42-INTEGRACION/src/recovery-apply1162.mjs');
const schedule1173=patchPlanning1173(web);
// Catalog discovery generated from pinned metadata and immutable original/sports IDs.
const legacyCatalog=runInNewContext(readFileSync('gym84_catalog.mjs','utf8').replace('export const catalog','const catalog')+'\n;catalog;');
const sportContext={};runInNewContext(readFileSync(base+'/src/sport1177.js','utf8'),sportContext);
const catalogData=JSON.parse(readFileSync(base+'/src/catalog1178-data.json','utf8')),catalogReview=JSON.parse(readFileSync(base+'/src/catalog1178-review.json','utf8'));
let catalog1178=readFileSync(base+'/src/catalog1178.template.js','utf8');
for(const [marker,value] of [['__DATA1178__',catalogData],['__REVIEW1178__',catalogReview],['__LEGACY1178__',legacyCatalog.library],['__SPORT1178__',sportContext.asiaSport1177.catalog]]){if(catalog1178.split(marker).length!==2)throw Error('Marcador catálogo');catalog1178=catalog1178.replace(marker,()=>JSON.stringify(value));}
writeFileSync(web+'/diary/catalog1178.js',catalog1178);writeFileSync(web+'/catalog1178.js',catalog1178);
cpSync(base+'/src/catalog1178-ui.js',web+'/diary/catalog1178-ui.js');
for(const n of ['catalog1178.js','catalog1178-ui.js'])execFileSync(process.execPath,['--check',web+'/diary/'+n],{stdio:'inherit'});
const runningUI=web+'/diary/running1174-ui.js';cpSync(base+'/src/running1174-ui.js',runningUI);execFileSync(process.execPath,['--check',runningUI],{stdio:'inherit'});
const runningIndex=readFileSync(diary,'utf8');const runningAnchor='<script src="nutrition103.js?v=1060"></script>';if(runningIndex.split(runningAnchor).length!==2)throw Error('Marcador Running');writeFileSync(diary,runningIndex.replace(runningAnchor,runningAnchor+'<script src="running1174-ui.js"></script>'));
for(const file of ['onboard1176.js','onboard1176-ui.js','sport1177-ui.js']){const to=web+'/diary/'+file;cpSync(base+'/src/'+file,to);execFileSync(process.execPath,['--check',to],{stdio:'inherit'});}
const obIndex=readFileSync(diary,'utf8'),obAnchor='<script src="running1174-ui.js"></script>';if(obIndex.split(obAnchor).length!==2)throw Error('Marcador onboarding');writeFileSync(diary,obIndex.replace(obAnchor,obAnchor+'<script src="onboard1176.js"></script><script src="onboard1176-ui.js"></script><script src="sport1177-ui.js"></script><script src="catalog1178.js"></script><script src="catalog1178-ui.js"></script>'));
const planner1174=web+'/diary/planner820.js';let plannerText1174=readFileSync(planner1174,'utf8');const anchor1174='for(const s of d.sessions){';if(plannerText1174.split(anchor1174).length!==2)throw Error('Marcador agenda Running');plannerText1174=plannerText1174.replace(anchor1174,"const run=window.asiaRunning1174.planned(data.running1174,d.date);if(run){card.append(make('p','Running · '+run.type+' · '+run.minutes+' min'+(d.routine!==null?' · Revisá coincidencia con fuerza':'')));action(card,'Abrir Running',()=>window.asiaOpenRunning1174?.());}const sport=window.asiaSport1177.planned(data.sport1177,d.date),events=window.asiaSport1177.eventsOn(data.sport1177,d.date);if(sport||events.length){if(sport)card.append(make('p','Deportivo · '+sport.minutes+' min'));for(const e of events)card.append(make('p',e.type+' · '+e.minutes+' min'));action(card,'Abrir rendimiento deportivo',()=>window.asiaOpenSport1177?.());}for(const s of d.sessions){");writeFileSync(planner1174,plannerText1174);
const shellSchedule=web+'/schedule829.js';if(readFileSync(shellSchedule,'utf8')!==readFileSync('schedule829.js','utf8'))throw Error('Validador calendario inesperado');writeFileSync(shellSchedule,schedule1173);
for(const n of ['schedule829.js','training102.js','planner820.js','v42.js','goals101.js'])execFileSync(process.execPath,['--check',web+'/diary/'+n],{stdio:'inherit'});
const shellExtras=web+'/extras830.js';if(readFileSync(shellExtras,'utf8')!==extrasSource)throw Error('Validador de shell inesperado');writeFileSync(shellExtras,extras1148);
console.log('Shell static dependency graph:',visited.size,'modules; original pure JS dependencies included');
// Server modules isolated from static asset binding. Preserve relative paths for imports.
const server=out+'/server',sroot=server+'/staging/source';
for(const d of dirs){const src='staging/source/'+d+'/src';if(!existsSync(src))continue;for(const n of readdirSync(src).filter(n=>n.endsWith('.mjs'))){const p=server+'/'+src+'/'+n;mkdirSync(dirname(p),{recursive:true});writeFileSync(p,patch(readFileSync(src+'/'+n,'utf8')))}}
for(const n of rootFiles.filter(n=>n.endsWith('.mjs')))cpSync(n,server+'/'+n);
// Server-side remote rekey uses the exact same pure domain validators as
// the candidate shell, including independent v2 goals. No originals edited.
for(const n of ['core105.js','extras830.js','gym826.js','schedule829.js','catalog1178.js'])cpSync(web+'/'+n,server+'/'+n);
const official='staging/source/official/V11.24-STAGING/src';for(const n of readdirSync(official).filter(n=>n.endsWith('.mjs'))){const p=server+'/'+official+'/'+n;mkdirSync(dirname(p),{recursive:true});writeFileSync(p,patch(readFileSync(official+'/'+n,'utf8')))}
// V11.51: only the packaged identity Worker gets the persistent session
// policy. Original identity sources, existing schema and cookie name intact.
const identityFile=server+'/'+official+'/worker1124.mjs';
let identityText=readFileSync(identityFile,'utf8');
function replaceIdentity(from,to){if(identityText.split(from).length!==2)throw Error('Marcador identidad no único: '+from);identityText=identityText.replace(from,to)}
replaceIdentity('SESSION_MS=3600000,','SESSION_MS=30*86400000,SESSION_ABSOLUTE_MS=180*86400000,');
replaceIdentity('cookie(SESSION_COOKIE,raw,3600)','cookie(SESSION_COOKIE,raw,SESSION_MS/1000)');
const renewRoute=`  if(path==='/v11.11/auth/renew'&&request.method==='POST'&&!u.search){
   try{
    const s=await basic(request,env);if(!s)return err(401,'NO_AUTORIZADO');
    if(!validWrite(request,env,s))return err(403,'CSRF_INVALIDO');
    if(!noBody(request))return err(400,'CUERPO_NO_PERMITIDO');
    const now=Date.now();
    // Single conditional UPDATE; no INSERT and no renewal of a deleted,
    // expired or differently authenticated session. Preserve CSRF/token
    // while operations are in flight; rotation is a separate future gate.
    const row=await env.STAGING_DB.prepare('UPDATE auth_oidc_sessions_v1111 SET expires_at=MIN(created_at+?,MAX(expires_at,?)) WHERE token_digest=? AND account_id=? AND csrf=? AND expires_at>? AND created_at+?>? RETURNING expires_at').bind(SESSION_ABSOLUTE_MS,now+SESSION_MS,s.digest,s.id,s.csrf,now,SESSION_ABSOLUTE_MS,now).first();
    if(!row||!Number.isSafeInteger(row.expires_at)||row.expires_at<=now)return err(401,'NO_AUTORIZADO');
    return json({ok:true,expiresAt:row.expires_at},200,{'Set-Cookie':cookie(SESSION_COOKIE,readCookie(request,SESSION_COOKIE),Math.floor((row.expires_at-now)/1000))});
   }catch{return err(503,'RENOVACION_NO_DISPONIBLE');}
  }
`;
replaceIdentity("  if(path==='/v11.11/auth/logout'&&request.method==='POST'&&!u.search)",renewRoute+"  if(path==='/v11.11/auth/logout'&&request.method==='POST'&&!u.search)");
writeFileSync(identityFile,identityText);
execFileSync(process.execPath,['--check',identityFile],{stdio:'inherit'});
const worker=sroot+'/V11.42-INTEGRACION/src/worker.mjs';mkdirSync(dirname(worker),{recursive:true});cpSync(base+'/src/worker.mjs',worker);
for(const n of ['account-key1150.mjs','managed-key1152.mjs','remote-rekey1157.mjs','remote-rekey-route1159.mjs'])cpSync(base+'/src/'+n,dirname(worker)+'/'+n);
// Extract policy from the immutable V10.6 source without evaluating DOM code
// in the Worker. The server sees only portable keys and presentation groups.
const policyContext={module:{exports:{}}};runInNewContext(readFileSync('accounts106.js','utf8'),policyContext);
const accountPolicy=policyContext.module.exports;
if(!Array.isArray(accountPolicy.portable)||!Array.isArray(accountPolicy.groups?.presentation))throw Error('Política original inválida');
writeFileSync(dirname(worker)+'/rekey-policy.generated.mjs','export default '+JSON.stringify({portable:accountPolicy.portable,groups:{presentation:accountPolicy.groups.presentation}})+';\n');
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
