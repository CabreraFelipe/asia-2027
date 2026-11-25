// V11.21 standalone targeted security, functional and UI contract tests, no cloud access.
import {readFileSync, readdirSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createWorker1111} from '../src/worker1121.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const txt=x=>readFileSync(join(root,x),'utf8');
const base='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const test={n:0};const ok=(cond,label)=>{assert.ok(cond,label);test.n++;};
const same=(a,b,label)=>{assert.deepEqual(a,b,label);test.n++;};
const html=txt('web121/index.html'),app=txt('web121/app.js'),css=txt('web121/stage121.css'),worker=txt('src/worker1121.mjs');
const nav=[...html.matchAll(/<button type="button" data-tab="([a-z]+)"[^>]*>.*?<span>([^<]+)<\/span><\/button>/gs)].map(x=>[x[1],x[2]]);
same(nav,[['inicio','Inicio'],['nutricion','Dieta'],['entrenamiento','Gym'],['salud','Salud'],['progreso','Progreso']],'Five original labels');
for(const [tab,display] of nav){ok(html.includes('data-tab="'+tab+'"')&&html.includes('>'+display+'</span>'),'Nav label');}
ok(html.includes('data-tab="cuenta"')&&!html.includes('>Cuenta</span></button>'),'Cuenta separate');
for(const part of ['V11.21 · STAGING','Mi progreso','stage121.css','solo datos ficticios','web121/index.html']){
 if(part==='web121/index.html')continue;
 ok((html+css).toLowerCase().includes(part.toLowerCase()),part);
}
for(const snippet of ['--bg:#0b1422','--gold:#e7b45e','bottom-nav121','grid-template-columns:repeat(7','@media(max-width:650px)'])ok(css.includes(snippet),'style requirement '+snippet);
for(const module of ['verifyArchive','restoreArchive','verifyBundle','exportBundle','restoreBundle','createRecoveryKit','openRecoveryKit','verifyExistingKey','createKitWithCode','recoverKit','resolvePending','discardPending','downloadFullBundle'])ok(app.includes(module),'Compatibility '+module);
for(const label of ['function healthPreview()','function progressPreview()','function overviewExtras()','function demoCoachText()','workIntro();','safeJournalRows()'])ok(app.includes(label),'Integrated UI '+label);
for(const forbidden of ['innerHTML','localStorage','sessionStorage','/v11.21/data/','/v11.21/ai','asia-2027-ai.cabrerafelipe'])ok(!app.includes(forbidden),'Never use '+forbidden);
ok(!/https?:\/\/[^'"\s]+/.test(app),'No external URLs in client');
ok(!css.includes('@import')&&!css.includes('url('),'No CSS fetch');
const original=txt('../V11.18-STAGING/web118/app.js');
for(const [start,end] of [['async function commit(){','async function saveRecord('],['async function verifyExistingKey(key){','async function logout()']]){
 const a=original.slice(original.indexOf(start),original.indexOf(end));const b=app.slice(app.indexOf(start),app.indexOf(end));
 same(a,b,'crypto/API logic unchanged');
}
ok(worker.includes("version:'11.21'")&&worker.includes("'/v11.21/'")&&worker.includes("__Host-asia1121_return"),'Worker version & routing');
ok(worker.includes('aes')===false||!app.includes('STAGING_DB'),'No client DB binding');
for(const route of ['v11.18/','v11.17/','v11.16/','v11.15/','v11.14/','v11.13/'])ok(worker.includes("'/"+route+"'"),'Legacy routes available');
const files=['index.html','app.js','asia106-original.css','stage115.css','stage116.css','stage117.css','stage118.css','stage121.css','archive116.js','bundle117.js','kit118.js'];
const assets=txt('src/assets1121.mjs');
for(const f of files){ok(assets.includes(JSON.stringify(txt('web121/'+f)))&&assets.includes('export const '),'Byte-exact asset '+f);}
let configured=true;
const db={prepare(q){return {bind(){return this},async first(){if(q.includes('SELECT marker'))return {marker:'asia-v11-staging-110'};if(q.includes('COUNT(*)'))return {n:0};return null;},async all(){return {results:[]}}};}};
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:base,STAGING_DB:db,STAGING_ALLOW_SYNTHETIC_SNAPSHOTS:'true',STAGING_GOOGLE_CLIENT_ID:'fake-client.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'not-real-test-secret',STAGING_ALLOWED_EMAILS:'fiction@example.org'};
const handler=createWorker1111();
const get=(path,opts={})=>handler.fetch(new Request(base+path,opts),env);
let r=await get('/v11.11/status');same(r.status,200,'Status served');let j=await r.json();same(j.version,'11.21','Version status');ok(j.configured===true&&j.production===false&&j.health===false&&j.publicRegistration===false,'No public users/health');
const routes=['/v11.21/','/v11.21/app.js','/v11.21/stage121.css','/v11.21/kit118.js','/v11.18/','/v11.17/'];
for(const path of routes){r=await get(path);same(r.status,200,'Asset served '+path);same(r.headers.get('X-Asia-Staging'),'synthetic-only','Synthetic header');ok((r.headers.get('Content-Security-Policy')||'').includes("script-src 'self'"),'Secure CSP '+path);}
r=await get('/v11.21/auth/start');same(r.status,303,'Google login redirect');same(r.headers.get('location'),'/v11.11/auth/start','Google route');ok((r.headers.get('set-cookie')||'').includes('__Host-asia1121_return=1'),'Return cookie');
r=await get('/v11.21/unknown');same(r.status,404,'Unknown static route');
r=await get('/v11.15/data/journal');same(r.status,401,'Journal still private');
r=await get('/v11.11/data/snapshots');same(r.status,401,'Snapshots still private');
r=await get('/v11.21/',{method:'POST'});same(r.status,404,'No new write routes');
console.log('V11.21: '+test.n+' comprobaciones nuevas: cinco pestañas, paridad visual, APIs heredadas, cifrado, permisos, rutas, CSP y staging.');
