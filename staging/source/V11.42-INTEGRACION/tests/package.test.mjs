import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createContext,runInContext} from 'node:vm';
import worker from '../dist/server/index.mjs';
import {digest} from '../dist/server/staging/source/official/V11.24-STAGING/src/security1111.mjs';
const root=new URL('../dist/assets',import.meta.url).pathname,origin='https://asia-v1142-candidate-staging.example.workers.dev',A='acct_'+'a'.repeat(32),token='A'.repeat(43);
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON;');
for(const n of ['0001_staging.sql','0006_identity_oidc.sql','0007_synthetic_journal_v115.sql','0009_large_sync.sql'])db.exec(readFileSync(new URL('../dist/migrations/'+n,import.meta.url),'utf8'));
db.prepare('INSERT INTO accounts_v11(account_id,issuer,subject,created_at) VALUES(?,?,?,?)').run(A,'https://accounts.google.com','synthetic-subject',new Date().toISOString());
db.prepare('INSERT INTO auth_oidc_sessions_v1111(token_digest,account_id,csrf,expires_at,email_digest,created_at) VALUES(?,?,?,?,?,?)').run(await digest(token),A,'a'.repeat(43),Date.now()+60000,await digest('a@example.invalid'),Date.now());
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_ALLOW_V1142_TESTS:'true',STAGING_GOOGLE_CLIENT_ID:'test.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-only',STAGING_ALLOWED_EMAILS:'a@example.invalid',STAGING_DB:{prepare(sql){let a=[];return {bind(...args){a=args;return this},async first(){return db.prepare(sql).get(...a)||null},async run(){return db.prepare(sql).run(...a)}}}},STAGING_PWA_ASSETS:{async fetch(r){const p=root+new URL(r.url).pathname;return existsSync(p)?new Response(readFileSync(p)):new Response(null,{status:404})}}};
const req=(p,auth=false,e=env)=>worker.fetch(new Request(origin+p,{headers:auth?{Cookie:'__Host-asia1111_session='+token}:{}}),e);
const prefix='/v11.42/';
assert.equal((await req(prefix+'index.html')).status,200);const m=await (await req(prefix+'manifest.json')).json();assert.equal(m.scope,prefix);assert.equal(m.start_url,prefix+'index.html');assert.equal(m.display,'standalone');assert.equal(m.icons.length,2);
assert.match(await (await req(prefix+'index.html')).text(),/V11\.52/);
assert.equal(m.id,prefix);
assert.match(readFileSync(root+prefix+'index.html','utf8'),/id="advancedUnlock" type="checkbox" autocomplete="off"/);
assert.equal((await req(prefix+'app.mjs')).status,401);assert.equal((await req(prefix+'diary/index.html')).status,401);assert.equal((await req(prefix+'diary/index.html',true)).headers.get('cache-control'),'no-store');assert.match((await req(prefix+'diary/index.html',true)).headers.get('content-security-policy'),/connect-src 'none'/);
// Restore only the exact V10.6 public photo source, never broad network access.
const diaryCsp=(await req(prefix+'diary/index.html',true)).headers.get('content-security-policy');
const shellCsp=(await req(prefix+'index.html')).headers.get('content-security-policy');
const directive=(csp,n)=>csp.split(';').map(x=>x.trim()).find(x=>x.startsWith(n+' '));
assert.equal(directive(diaryCsp,'img-src'),"img-src 'self' data: blob: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/");
assert.equal(directive(shellCsp,'img-src'),"img-src 'self' data: blob:");
assert.equal(directive(diaryCsp,'connect-src'),"connect-src 'none'");
assert.equal(directive(diaryCsp,'worker-src'),"worker-src 'none'");
assert.equal(readFileSync(root+prefix+'diary/gym571.js','utf8'),readFileSync('gym571.js','utf8'),'Gym original no debe modificarse');
for(const n of ['push.js','rest533.js','reminders845.js','gym53.js','v4.js'])assert.equal(readFileSync(root+prefix+'diary/'+n,'utf8'),readFileSync(n,'utf8'),'Regresión de notificaciones: '+n);

const originalReminders=readFileSync('reminders821.js','utf8');
const expectedReminders=originalReminders.replace("cloudKeys.includes(k)?raw?.enabled?.[k]!==false:raw?.enabled?.[k]===true","raw?.enabled?.[k]===true").replace("typeof raw?.cloudEnabled?.[k]==='boolean'?raw.cloudEnabled[k]:raw?.enabled?.[k]!==false","typeof raw?.cloudEnabled?.[k]==='boolean'?raw.cloudEnabled[k]:raw?.enabled?.[k]===true").replace("Horarios en Uruguay. Elegí qué mostrar al abrir la app y qué programar en la nube.","Horarios en Uruguay. Cada cuenta elige sus propios avisos; los horarios sugeridos no activan notificaciones. Elegí qué mostrar al abrir la app y qué programar en la nube.");
assert.equal(readFileSync(root+prefix+'diary/reminders821.js','utf8'),expectedReminders,'Solo se permite adaptar consentimiento inicial y explicación');
const candidateProfile=readFileSync(root+prefix+'diary/profile100.js','utf8');
assert.match(candidateProfile,/h\.textContent=name\|\|'Mi progreso'/);
assert.match(candidateProfile,/welcome\.hidden=!!name/);
assert.match(candidateProfile,/inputs\.displayName\.focus/);
assert.equal((await req(prefix+'diary/profile100.js')).status,401);
assert.match(readFileSync(root+prefix+'diary/goals101.js','utf8'),/asiaCandidateSession\.initialGoalSetup===true&&data\.settings\?\.goals101===undefined/);
assert.equal((await req(prefix+'diary/goals101.js')).status,401);
assert.equal((await req(prefix+'sw.js')).headers.get('service-worker-allowed'),prefix);assert.equal((await req(prefix+'diary/sw.js',true)).status,404);assert.equal((await req('/v11.24/',true)).status,404);assert.equal((await req(prefix+'app.mjs',true,{...env,STAGING_ALLOW_V1142_TESTS:'false'})).status,403);
assert.equal((await req('/v11.11/auth/me',true)).status,200);
// Real packaged Worker and SQLite: persistent cookie, rolling expiry,
// absolute cap, invalid requests, isolation and no resurrection on logout.
const dayMs=86400000,sessionDigest=await digest(token),csrf='a'.repeat(43);
const renew=(options={})=>worker.fetch(new Request(origin+'/v11.11/auth/renew',{method:'POST',headers:{...(options.anonymous?{}:{Cookie:'__Host-asia1111_session='+token}),Origin:options.origin??origin,'X-Asia-CSRF':options.csrf??csrf},...(options.body?{body:'invalid'}:{})}),env);
const sessionRow=()=>db.prepare('SELECT * FROM auth_oidc_sessions_v1111 WHERE token_digest=?').get(sessionDigest);
const before=sessionRow();
assert.equal((await renew({anonymous:true})).status,401);
assert.equal((await renew({csrf:'wrong'})).status,403);
assert.equal((await renew({origin:'https://example.invalid'})).status,403);
assert.equal((await renew({body:true})).status,400);
assert.deepEqual(sessionRow(),before);
const renewed=await renew(),renewedBody=await renewed.json(),cookie=renewed.headers.get('set-cookie');
assert.equal(renewed.status,200);assert.equal(renewed.headers.get('cache-control'),'no-store');
assert.ok(cookie.includes('Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age='));
assert.ok(renewedBody.expiresAt>Date.now()+29*dayMs);assert.equal(sessionRow().expires_at,renewedBody.expiresAt);
assert.equal(sessionRow().csrf,csrf);assert.equal(sessionRow().account_id,A);
const capStart=Date.now()-179*dayMs;
db.prepare('UPDATE auth_oidc_sessions_v1111 SET created_at=?,expires_at=? WHERE token_digest=?').run(capStart,Date.now()+60000,sessionDigest);
const capped=await renew();assert.equal(capped.status,200);assert.equal((await capped.json()).expiresAt,capStart+180*dayMs);
db.prepare('UPDATE auth_oidc_sessions_v1111 SET expires_at=? WHERE token_digest=?').run(Date.now()-1000,sessionDigest);
assert.equal((await renew()).status,401);assert.equal((await req('/v11.11/auth/me',true)).status,401);
db.prepare('UPDATE auth_oidc_sessions_v1111 SET created_at=?,expires_at=? WHERE token_digest=?').run(Date.now()-1000,Date.now()+60000,sessionDigest);
const logout=await worker.fetch(new Request(origin+'/v11.11/auth/logout',{method:'POST',headers:{Cookie:'__Host-asia1111_session='+token,Origin:origin,'X-Asia-CSRF':csrf}}),env);
assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);assert.equal((await renew()).status,401);assert.equal(sessionRow(),undefined);
assert.equal((await req(prefix+'diary/index.html',true)).status,401);
console.log('Session renewal: persistent cookie, 30d rolling/180d cap, expiry, CSRF and logout verified.');
db.close();console.log('Package, manifest, isolated origin, Worker auth, no-store, CSP, revoked access and route allowlist verified.');
// Test the actual packaged domain and encrypted portable archive, not a second
// reimplementation of validation. Keep V10.6 source and legacy book immutable.
const dir=root+prefix+'diary/',extrasText=readFileSync(dir+'extras830.js','utf8');
assert.equal(extrasText,readFileSync(root+prefix+'extras830.js','utf8'),'Shell y diario usan validadores distintos');
function domain(path){
 const ctx=createContext({module:{exports:{}}});
 for(const n of ['core105.js','extras830.js','goals101.js'])runInContext(readFileSync(path+n,'utf8'),ctx,{filename:n});
 return {extras:ctx.asiaExtras830,goals:ctx.module.exports};
}
const legacy=domain(''),current=domain(dir),{extras,goals}=current,plain=x=>JSON.parse(JSON.stringify(x));
const old=plain(legacy.goals.validate(undefined));
assert.deepEqual(plain(goals.validate(undefined)),old);
assert.deepEqual(plain(goals.validate(old)),old);
assert.throws(()=>goals.validate({version:1,primary:'',items:[]}));
const empty=extras.emptyGoals1148();
assert.deepEqual(plain(goals.validate(empty)),{version:2,primary:'',items:[]});
assert.equal(goals.primary(empty),null);
const today='2026-11-26',g={id:'goal-'+'a'.repeat(32),title:'Fuerza',kind:'Fuerza',target:'5 dominadas',motivation:'Entrenar con constancia',start:today,deadline:'2027-05-01',status:'Activa',closedOn:'',result:''};
const h={...g,id:'goal-'+'b'.repeat(32),title:'Hábitos',kind:'Hábitos',target:'Caminar',motivation:'Bienestar',deadline:''};
const a=goals.select(goals.upsert(empty,g,today),g.id),b=goals.select(goals.upsert(extras.emptyGoals1148(),h,today),h.id);
assert.equal(goals.primary(a).title,'Fuerza');assert.equal(goals.primary(b).deadline,'');
assert.equal(goals.phase(h,today),'Sin plazo');assert.equal(a.items.length,1);assert.equal(b.items.length,1);
assert.equal(empty.items.length,0);assert.equal(a.version,2);assert.equal(b.version,2);
for(const bad of [{...a,version:3},{...a,primary:h.id},{...a,items:[g,g]},{...a,items:[{...g,deadline:'2020-01-01'}]},{...a,items:[{...g,deadline:'2027-02-30'}]},{version:2,primary:'asia-2027',items:old.items}])assert.throws(()=>goals.validate(bad));
const closed=goals.upsert(a,{...g,status:'Alcanzada',closedOn:today,result:'Conseguida'},today);
assert.equal(closed.primary,'');assert.equal(closed.items[0].result,'Conseguida');
assert.throws(()=>goals.upsert(closed,g,today));assert.equal(goals.primary(a).status,'Activa');
const {inspectLegacy88,makePortable88,readPortable88}=await import('../dist/assets/v11.42/migration88.mjs');
const {checksum84}=await import('../dist/assets/v11.42/model84.mjs');
const fixture=book=>({body:{[today]:{weight:81.2}},diet:{[today]:{}},work:{},settings:{goals101:plain(book)},photos:{}});
const pair={preferences:{revision:0,payload:{}},gym:{revision:0,payload:{}}},phrase='frase sintética metas independiente';
for(const book of [old,empty,a,b,closed]){
 const data=fixture(book),inventory=inspectLegacy88(data),hash=await checksum84(data);
 const encrypted=await makePortable88(data,pair,phrase),restored=await readPortable88(encrypted,phrase);
 assert.equal(await checksum84(restored.legacy),hash);assert.deepEqual(inspectLegacy88(restored.legacy),inventory);assert.deepEqual(restored.legacy,data);
}
assert.throws(()=>inspectLegacy88(fixture({version:2,primary:'asia-2027',items:old.items})));
console.log('Goal books v1/v2: explicit empty, independent goals, validation, immutable history, and five encrypted portable round trips verified.');

// Foundation test only: no managed-key route or secret deployed.
await import('./account-key1150.test.mjs');

await import('./managed-key1152.test.mjs');
