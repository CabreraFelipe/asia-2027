// V11.24: offline UI, secure routing, no new D1 writes; extends, never replaces, V11.21.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createWorker1111} from '../src/worker1124.mjs';
import {html124,app124,style124} from '../src/assets1124.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=n=>readFileSync(join(root,n),'utf8');
const html=read('web124/index.html'), app=read('web124/app.js'),css=read('web124/stage124.css');
const src=read('src/worker1124.mjs'), wrangler=read('wrangler.preview.toml');
const b='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
let checks=0;function ok(pred,msg){assert.ok(pred,msg);checks++;}function same(a,b,msg){assert.deepEqual(a,b,msg);checks++;}
const nav=[...html.matchAll(/<button type="button" data-tab="([a-z]+)"[^>]*>.*?<span>([^<]+)<\/span><\/button>/gs)].map(x=>[x[1],x[2]]);
same(nav,[['inicio','Inicio'],['nutricion','Dieta'],['entrenamiento','Gym'],['salud','Salud'],['progreso','Progreso']],'five tabs');
for(const [name,title] of nav)ok(html.includes(`data-tab="${name}"`)&&html.includes(`<span>${title}</span>`),'nav '+name);
for(const x of ['V11.24 · STAGING','/v11.24/stage124.css','data-tab="cuenta"','LABORATORIO · SOLO DATOS FICTICIOS'])ok(html.includes(x),'new HTML '+x);
for(const x of ['function weeklySynthetic','function weeklyBars','function activityRibbon','function preferencesPreview','historyFilter124','aria-current','S.prefs=safePrefs','function overviewExtras','function progressPreview','function healthPreview'])ok(app.includes(x),'UI '+x);
for(const x of ['--focus124','#77cde9','#c5b1f7','prefers-reduced-motion','grid-template-columns'])ok(css.includes(x),'CSS '+x);
for(const x of ['innerHTML','localStorage','sessionStorage','https://asia-2027-ai','/v11.24/data/','/v11.24/ai'])ok(!app.includes(x),'no unsafe feature '+x);
ok(!/https?:\/\/[^'"\s]+/.test(app),'no external origins in client');
ok(!css.includes('@import')&&!css.includes('url('),'no external CSS');
const old=read('web121/app.js');
for(const [begin,end] of [['async function commit(){','async function saveRecord('],['async function verifyExistingKey(key){','async function logout()']]){
  const a=old.slice(old.indexOf(begin),old.indexOf(end));const c=app.slice(app.indexOf(begin),app.indexOf(end));
  ok(a.length>100&&a===c,'crypto/write behaviour stays byte-exact '+begin);
}
for(const x of ['database_name = "asia-v11-db-staging"','name = "asia-v1111-identity-staging"','src/worker1124.mjs'])ok(wrangler.includes(x),'only staging '+x);
ok(src.includes("version:'11.24'"),'status updated');ok(!src.includes('CREATE TABLE'),'no migration');
for(const [value,file] of [[html124,'index.html'],[app124,'app.js'],[style124,'stage124.css']])same(value,read('web124/'+file),'new assets byte exact '+file);
const db={prepare(sql){return {bind(){return this},async first(){if(sql.includes('SELECT marker'))return {marker:'asia-v11-staging-110'};if(sql.includes('COUNT(*)'))return {n:0};return null;},async all(){return {results:[]}}};}};
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:b,STAGING_DB:db,STAGING_ALLOW_SYNTHETIC_SNAPSHOTS:'true',STAGING_GOOGLE_CLIENT_ID:'example.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-only',STAGING_ALLOWED_EMAILS:'fake@example.invalid'};
const handler=createWorker1111();const get=(path,method='GET')=>handler.fetch(new Request(b+path,{method}),env);
let r=await get('/v11.11/status');same(r.status,200,'status HTTP');let j=await r.json();same(j.version,'11.24','status version');ok(j.configured&&!j.health&&!j.production&&!j.publicRegistration,'staging flags');
for(const path of ['/v11.24/','/v11.24/app.js','/v11.24/stage124.css','/v11.24/stage121.css','/v11.24/kit118.js','/v11.21/','/v11.18/','/v11.17/','/v11.16/','/v11.15/','/v11.14/','/v11.13/']){
 r=await get(path);same(r.status,200,'static GET '+path);same(r.headers.get('X-Asia-Staging'),'synthetic-only','synthetic header '+path);ok((r.headers.get('Content-Security-Policy')||'').includes("script-src 'self'"),'secure CSP '+path);
}
r=await get('/v11.24/auth/start');same(r.status,303,'OIDC redirect');same(r.headers.get('location'),'/v11.11/auth/start','OIDC origin unchanged');ok((r.headers.get('set-cookie')||'').includes('__Host-asia1124_return=1'),'return cookie');
for(const path of ['/v11.24/unrecognized','/v11.24/','/v11.24/auth/start']){
 r=await get(path,'POST');same(r.status,404,'No new write route '+path);
}
for(const path of ['/v11.15/data/journal','/v11.11/data/snapshots','/v11.11/auth/me']){r=await get(path);same(r.status,401,'Existing auth '+path);}
r=await get('/v11.24/fake');same(r.status,404,'Unknown route');
// Verify the V11.21 worker remains present and identical to previous release at preflight.
console.log(`V11.24: ${checks} pruebas de UX, rutas, integridad, aislamiento y compatibilidad offline.`);
