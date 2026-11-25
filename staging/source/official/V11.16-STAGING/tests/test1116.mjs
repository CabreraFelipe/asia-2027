import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {generateKeyPairSync,sign} from 'node:crypto';
import {createWorker1111} from '../src/worker1116.mjs';
import {html116,app116,original116Style,style115_116,style116,archive116} from '../src/assets1116.mjs';
import {digest,accountId} from '../src/security1111.mjs';
import {newRecoveryCode,keyFromRecoveryCode} from '../../V11.13-STAGING/web1113/crypto.js';
import {blankJournal,addEntry} from '../web115/journal115.js';
import {encryptJournal} from '../web115/crypto115.js';
const source=readFileSync(new URL('../web116/archive116.js',import.meta.url),'utf8');
const asFile=(p)=>new URL(p,import.meta.url).href;
const {MAX_ARCHIVE_BYTES,verifyArchive,restoreArchive,sameEnvelope}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source.replace("'/v11.15/crypto115.js'",JSON.stringify(asFile('../web115/crypto115.js'))).replace("'/v11.15/journal115.js'",JSON.stringify(asFile('../web115/journal115.js')))));
let count=0;const eq=(a,b,m='')=>{assert.deepEqual(a,b,m);count++};const ok=(v,m='')=>{assert.ok(v,m);count++};const rejected=async(fn,pattern)=>{await assert.rejects(fn,pattern);count++};
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
for(const [val,file] of [[html116,'../web116/index.html'],[app116,'../web116/app.js'],[original116Style,'../web116/asia106-original.css'],[style115_116,'../web116/stage115.css'],[style116,'../web116/stage116.css'],[archive116,'../web116/archive116.js']])eq(val,read(file),'Bundled asset byte-identical: '+file);
eq(original116Style,read('../web115/asia106-original.css'),'Original V10.6 style unchanged');
ok(html116.includes('V11.16 · STAGING')&&html116.includes('SOLO DATOS FICTICIOS'),'Visible version and warning');
ok(html116.includes('/v11.16/stage116.css')&&html116.includes('/v11.16/app.js'),'New stage assets linked');
ok(app116.includes('verifyArchive')&&app116.includes('restoreArchive')&&app116.includes('importArchiveFile'),'Import flow included');
ok(app116.includes('asia-v1115-domain-pending')&&app116.includes('asia-v1112-demo-keys'),'Draft and keys remain compatible');
for(const content of [html116,app116,archive116]){ok(!content.includes('innerHTML')&&!content.includes('localStorage'),'No untrusted HTML injection or localStorage');ok(!content.includes('asia-2027-ai.workers.dev')&&!content.includes('asia2027db'),'No production bindings');}
const origin='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(read('../../V11.9-LAB/migrations/0001_staging.sql'));db.exec(read('../migrations/0006_identity_oidc.sql'));db.exec(read('../migrations/0007_synthetic_journal_v115.sql'));
const D1={prepare(sql){return {bind(...params){return {first:async()=>db.prepare(sql).get(...params)??null,all:async()=>({results:db.prepare(sql).all(...params)}),run:async()=>db.prepare(sql).run(...params)};}}}};
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_DB:D1,STAGING_GOOGLE_CLIENT_ID:'fake.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'synthetic-secret-not-real',STAGING_ALLOWED_EMAILS:'first@example.test,second@example.test',STAGING_ALLOW_SYNTHETIC_SNAPSHOTS:'true'};
const worker=createWorker1111({fetchImpl:async()=>{throw Error('EXTERNAL_NETWORK_DISABLED')}});
const get=(p,options={},envv=env)=>worker.fetch(new Request(origin+p,options),envv);
const users=[];
for(const [sub,email] of [['v116-a','first@example.test'],['v116-b','second@example.test']]){
 const id=await accountId('https://accounts.google.com',sub),token=newRecoveryCode(),csrf=newRecoveryCode(),now=Date.now();
 db.prepare('INSERT INTO accounts_v11(account_id,issuer,subject,created_at) VALUES(?,?,?,?)').run(id,'https://accounts.google.com',sub,new Date(now).toISOString());
 db.prepare('INSERT INTO auth_oidc_sessions_v1111(token_digest,account_id,csrf,email_digest,created_at,expires_at) VALUES(?,?,?,?,?,?)').run(await digest(token),id,csrf,await digest(email),now,now+3600000);
 users.push({id,csrf,cookie:'__Host-asia1111_session='+token});
}
const [A,B]=users;
const auth=(user,p,options={})=>get(p,{...options,headers:{Cookie:user.cookie,...options.headers}});
const post=(user,expectedRevision,envelope)=>auth(user,'/v11.15/data/journal',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Asia-CSRF':user.csrf},body:JSON.stringify({expectedRevision,envelope})});
const body=async response=>({...await response.json(),status:response.status});
const api={index:()=>auth(A,'/v11.15/data/journal').then(body),read:revision=>auth(A,'/v11.15/data/journal/'+revision).then(body),post:(expected,envelope)=>post(A,expected,envelope).then(body)};
for(const [path,type] of [['/v11.16/','text/html'],['/v11.16/app.js','text/javascript'],['/v11.16/asia106-original.css','text/css'],['/v11.16/stage115.css','text/css'],['/v11.16/stage116.css','text/css'],['/v11.16/archive116.js','text/javascript']]){
 const r=await get(path);eq(r.status,200,'Asset '+path);ok((r.headers.get('Content-Type')||'').startsWith(type),'Type '+path);eq(r.headers.get('X-Asia-Staging'),'synthetic-only');ok(r.headers.get('Content-Security-Policy').includes("script-src 'self'"),'CSP');eq(r.headers.get('Cache-Control'),'no-store');ok((await r.text()).length>20,'Content');
}
for(const p of ['/v11.15/','/v11.14/','/v11.13/','/v11.12/','/v11.11/'])eq((await get(p)).status,200,'Historical route preserved');
for(const p of ['/v11.16/?secret=1','/v11.16/other','/v11.16/app.js?q=1','/v11.16/data/journal'])ok((await get(p)).status!==200,'Unexpected asset refused');
eq((await get('/v11.16/auth/start')).status,303,'Google entry redirects to existing verified flow');
ok((await get('/v11.16/auth/start')).headers.get('Set-Cookie').includes('__Host-asia1116_return=1'),'Return marker HttpOnly');
eq((await get('/v11.15/data/journal')).status,401,'Unauthenticated journal access refused');
eq((await get('/v11.15/data/journal/1')).status,401,'Unauthenticated copy refused');
eq((await auth(B,'/v11.15/data/journal',{headers:{'X-Asia-Account':A.id}})).status,403,'Forged account header refused');
eq((await get('/v11.16/',{}, {...env,STAGING_MODE:'false'})).status,503,'Fail closed outside staging');
eq((await get('/v11.16/',{}, {...env,DB:{}})).status,503,'Production D1 binding rejected');
const status=await(await get('/v11.11/status')).json();eq(status.version,'11.16','Staging status incremented');eq(status.production,false,'Not production');ok(status.configured,'D1 marker and identity valid');
const key=await keyFromRecoveryCode(newRecoveryCode()),badKey=await keyFromRecoveryCode(newRecoveryCode());
const sample=[{kind:'diet',date:'2026-01-01',ad:'yes',steps:5000,energy:4},{kind:'workout',date:'2026-01-02',routine:'A',cardioMin:20,cardioSpeed:6,cardioIncline:2,cardioRPE:5},{kind:'diet',date:'2026-01-03',ad:'part',steps:7500,energy:3}];
let plain=blankJournal(A.id);const history=[];
for(const [i,s] of sample.entries()){plain=addEntry(plain,s);history.push({revision:i+1,envelope:await encryptJournal(plain,key,A.id)});}
const json=hs=>JSON.stringify({format:'asia-v1115-domain-archive-v1',accountId:A.id,head:hs.length,history:hs});
const good=json(history);
const verified=await verifyArchive(good,key,A.id);
eq(verified.head,3,'All archive revisions validated');eq(verified.overview,{dietDays:2,trainingDays:1,stepsTotal:12500,cardioMinutes:20},'Only synthetic summary retained');
ok(!Object.hasOwn(verified,'plain')&&!JSON.stringify(verified).includes('"entries"'),'No plaintext journal retained');
for(const [candidate,pat] of [
 ['{oops',/ARCHIVO_JSON_INVALIDO/],
 [JSON.stringify({}),/FORMATO_NO_COMPATIBLE/],
 [json([]),/HISTORIAL_INCOMPLETO/],
 [JSON.stringify({...JSON.parse(good),head:1}),/HISTORIAL_INCOMPLETO/],
 [JSON.stringify({...JSON.parse(good),head:31}),/HISTORIAL_INCOMPLETO/],
 [JSON.stringify({...JSON.parse(good),accountId:B.id}),/ARCHIVO_DE_OTRA_CUENTA/],
 [JSON.stringify({...JSON.parse(good),extra:1}),/FORMATO_NO_COMPATIBLE/],
 [JSON.stringify({...JSON.parse(good),history:[{revision:2,envelope:history[0].envelope},...history.slice(1)]}),/REVISION_NO_CONTIGUA/],
 [JSON.stringify({...JSON.parse(good),history:[{revision:1,envelope:{...history[0].envelope,cipher:history[0].envelope.cipher.replace(/^./,'!')}},...history.slice(1)]}),/CLAVE_O_DIARIO_INVALIDO/],
 [JSON.stringify({...JSON.parse(good),history:[{revision:1,envelope:history[0].envelope,extra:1},...history.slice(1)]}),/REVISION_NO_CONTIGUA/],
 [JSON.stringify({...JSON.parse(good),history:[history[0],history[0],history[2]]}),/REVISION_NO_CONTIGUA/],
])await rejected(()=>verifyArchive(candidate,key,A.id),pat);
await rejected(()=>verifyArchive(good,badKey,A.id),/CLAVE_O_DIARIO_INVALIDO/);
await rejected(()=>verifyArchive(good,key,B.id),/ARCHIVO_DE_OTRA_CUENTA/);
await rejected(()=>verifyArchive('X'.repeat(MAX_ARCHIVE_BYTES+1),key,A.id),/ARCHIVO_DEMASIADO_GRANDE/);
await rejected(()=>verifyArchive(good,null,A.id),/CLAVE_AUSENTE/);
// A valid but *non append-only* journal must never be restored.
const nonAppend=addEntry(blankJournal(A.id),sample[1]);
const mutated=[history[0],{revision:2,envelope:await encryptJournal(nonAppend,key,A.id)},history[2]];
await rejected(()=>verifyArchive(json(mutated),key,A.id),/HISTORIAL_NO_ADITIVO/);
const reduced=plain.entries.map(x=>({...x}));reduced[0].steps=1;
const mutatedThird=await encryptJournal({...plain,entries:reduced},key,A.id);
await rejected(()=>verifyArchive(json([...history.slice(0,2),{revision:3,envelope:mutatedThird}]),key,A.id),/HISTORIAL_NO_ADITIVO/);
eq(sameEnvelope(history[0].envelope,{...history[0].envelope}),true,'Ciphertext equality exact');eq(sameEnvelope(history[0].envelope,history[1].envelope),false,'Different revisions not considered identical');
// Full restore after an empty simulated D1. No individual or Google data is transferred.
const first=await restoreArchive(verified,api);eq(first.status,'RESTAURADO');eq(first.written,3,'Restored all 3 revisions');eq((await api.index()).head,3,'D1 has 3 protected revisions');
const again=await restoreArchive(verified,api);eq(again.status,'YA_RESTAURADO');eq(again.written,0,'Idempotent import');
eq(db.prepare('SELECT COUNT(*) n FROM synthetic_journal_v115 WHERE account_id=?').get(A.id).n,3,'No duplicated revision');
eq((await auth(B,'/v11.15/data/journal').then(body)).head,0,'Second account still empty');
// Simulate client interruption: the first upload succeeds; the second network operation fails.
db.prepare('DELETE FROM synthetic_journal_v115 WHERE account_id=?').run(A.id); // test SQLite only, NEVER a deployed production action
let simulatedWrites=0;
await rejected(()=>restoreArchive(verified,{...api,post:async(expected,envelope)=>{if(simulatedWrites++===1)throw Error('SIMULATED_NETWORK_CUT');return api.post(expected,envelope);}}),/SIMULATED_NETWORK_CUT/);
eq((await api.index()).head,1,'First copied revision survived simulated interruption');
const resumed=await restoreArchive(verified,api);eq(resumed.written,2,'Safe resume without rewriting prefix');eq(resumed.status,'RESTAURADO');
// Do not permit any branch overwrite, even if same key and same account.
db.prepare('DELETE FROM synthetic_journal_v115 WHERE account_id=?').run(A.id);
const branched=addEntry(blankJournal(A.id),{...sample[0],steps:3000});
eq((await post(A,0,await encryptJournal(branched,key,A.id))).status,201);
await rejected(()=>restoreArchive(verified,api),/NUBE_DIVERGENTE_EN_REVISION_1/);
eq((await api.index()).head,1,'Divergent branch untouched');
// Even later mismatch must block before writing anything.
db.prepare('DELETE FROM synthetic_journal_v115 WHERE account_id=?').run(A.id);
eq((await post(A,0,history[0].envelope)).status,201);
eq((await post(A,1,await encryptJournal(addEntry(addEntry(blankJournal(A.id),sample[0]),{...sample[1],cardioRPE:7}),key,A.id))).status,201);
await rejected(()=>restoreArchive(verified,api),/NUBE_DIVERGENTE_EN_REVISION_2/);
eq((await api.index()).head,2,'Middle divergent branch untouched');
// 409 following another client writing IDENTICAL ciphertext can be resumed.
db.prepare('DELETE FROM synthetic_journal_v115 WHERE account_id=?').run(A.id);
const raced=await restoreArchive(verified,{...api,post:async(expected,envelope)=>{await api.post(expected,envelope);return {status:409,ok:false};}});
eq(raced.status,'RESTAURADO','409 identical write accepted by verification');eq(raced.written,0,'No false local write count');
// A newer cloud history must never be rolled back.
const short=await verifyArchive(json(history.slice(0,2)),key,A.id);
const skip=await restoreArchive(short,api);eq(skip.status,'NUBE_MAS_RECIENTE');eq(skip.written,0);
// CSRF and Origin remain enforced for imports: archive contains ciphertext, not authorization.
const denied=await auth(A,'/v11.15/data/journal',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json','X-Asia-CSRF':A.csrf},body:JSON.stringify({expectedRevision:3,envelope:history[2].envelope})});eq(denied.status,403,'CSRF Origin');
// Test full OAuth callback marker with signed fake Google ID token; no network.
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'test116',use:'sig',alg:'RS256'};
const b64=t=>Buffer.from(t).toString('base64url');
let nonce='';const oauth=createWorker1111({fetchImpl:async(url,opts)=>{
 if(url==='https://oauth2.googleapis.com/token'){
  const body=new URLSearchParams(opts.body),now=Math.floor(Date.now()/1000);eq(body.get('redirect_uri'),origin+'/v11.11/auth/callback','Google redirect unmodified');
  const h=b64(JSON.stringify({alg:'RS256',kid:'test116',typ:'JWT'})),p=b64(JSON.stringify({iss:'https://accounts.google.com',aud:env.STAGING_GOOGLE_CLIENT_ID,sub:'v116-oauth-test',nonce,exp:now+300,iat:now,email:'first@example.test',email_verified:true}));
  return new Response(JSON.stringify({id_token:h+'.'+p+'.'+sign('RSA-SHA256',Buffer.from(h+'.'+p),privateKey).toString('base64url')}),{status:200});
 }
 if(url==='https://www.googleapis.com/oauth2/v3/certs')return new Response(JSON.stringify({keys:[jwk]}),{status:200});
 throw Error('NO_EXTERNAL_NETWORK');
}});
const req=(path,opts={})=>oauth.fetch(new Request(origin+path,opts),env);
const returnMarker=(await req('/v11.16/auth/start')).headers.get('Set-Cookie').split(';')[0];
const googleStart=await req('/v11.11/auth/start');eq(googleStart.status,303);
const loc=new URL(googleStart.headers.get('Location'));nonce=loc.searchParams.get('nonce');
const flowCookie=googleStart.headers.get('Set-Cookie').split(';')[0];
const query=new URLSearchParams({code:'fake-code-v116',state:loc.searchParams.get('state'),scope:'openid email'});
const callback=await req('/v11.11/auth/callback?'+query,{headers:{Cookie:flowCookie+'; '+returnMarker}});
eq(callback.status,303,'OIDC callback accepts signed synthetic token');eq(callback.headers.get('Location'),'/v11.16/','Redirect to new stage');
ok(callback.headers.getSetCookie().some(t=>t.startsWith('__Host-asia1116_return=;')),'Marker cleared');
ok(callback.headers.getSetCookie().some(t=>t.startsWith('__Host-asia1111_session=')),'Session still HttpOnly');
// Original snapshot table not affected by the new recovery route.
eq(db.prepare('SELECT COUNT(*) AS n FROM encrypted_snapshots_v11').get().n,0,'Old vault untouched');
console.log(`V11.16: ${count} verificaciones de recuperación, AES-GCM, D1 real local, aislamiento, OAuth y conflictos.`);
console.log('Pruebas totalmente offline con cuentas ficticias; Cloudflare y producción no se modificaron.');
