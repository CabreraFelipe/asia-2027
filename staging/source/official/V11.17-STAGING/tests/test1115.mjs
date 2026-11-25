import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createWorker1111} from '../src/worker1115.mjs';
import {html115,app115,style115,original115Style,crypto115,journal115} from '../src/assets1115.mjs';
import {digest,accountId} from '../src/security1111.mjs';
import {newRecoveryCode,keyFromRecoveryCode,encryptDemo} from '../../V11.13-STAGING/web1113/crypto.js';
import {blankJournal,validJournal,validEntry,addEntry,mergeJournal,journalContains,summary} from '../web115/journal115.js';
import {encryptJournal,decryptJournal,sealDraft,openDraft} from '../web115/crypto115.js';
let checks=0;
const ok=(v,message)=>{assert.ok(v,message);checks++;};
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const origin='https://asia-v1111-identity-staging.cabrerafelipe2003.workers.dev';
const testAccount='acct_'+'1'.repeat(32);
const validDate='2026-01-08';
const sampleDiet={kind:'diet',date:validDate,ad:'part',steps:7500,energy:4};
const sampleTraining={kind:'workout',date:'2026-01-09',routine:'B',cardioMin:20,cardioSpeed:6,cardioIncline:2,cardioRPE:5};
// Exact source assets and preserved V10.6 design.
for(const [value,path] of [[html115,'../web115/index.html'],[app115,'../web115/app.js'],[style115,'../web115/stage115.css'],[original115Style,'../web115/asia106-original.css'],[crypto115,'../web115/crypto115.js'],[journal115,'../web115/journal115.js']])eq(value,read(path),'Packaged asset matches source '+path);
eq(original115Style,read('../web114/asia106-original.css'),'Original V10.6 CSS byte-identical');
ok(html115.includes('V11.15 · STAGING')&&html115.includes('SOLO DATOS FICTICIOS'),'Visible version & warning');
ok(html115.includes('/v11.15/asia106-original.css'),'Original visual style loaded');
for(const content of [html115,app115]){ok(!content.includes('asia-2027-rest.workers.dev')&&!content.includes('asia-2027-ai.workers.dev'),'No production URLs in frontend');ok(!content.includes('innerHTML')&&!content.includes('localStorage'),'No unsafe DOM or localStorage in frontend');}
ok(app115.includes('asia-v1112-demo-keys')&&app115.includes('asia-v1115-domain-pending'),'Compatible key family, isolated encrypted drafts');
ok(app115.includes('await putDraft')&&app115.includes('await commit')&&app115.includes('resolvePending'),'Borrador before commit & conflict resolution');
ok(app115.includes('V11.14')&&app115.includes('importKey'),'Existing code reuse path');
ok(read('../wrangler.preview.toml').includes('src/worker1115.mjs'),'Deploy uses the updated Worker');
// Strict synthetic field model based on original V10.6 fields.
const blank=blankJournal(testAccount);ok(validJournal(blank,testAccount),'Blank journal valid');
const dayOne=addEntry(blank,sampleDiet);ok(validJournal(dayOne,testAccount),'Diet entry valid');
const dayTwo=addEntry(dayOne,sampleTraining);ok(validJournal(dayTwo,testAccount),'Training entry valid');
eq(dayTwo.entries.length,2,'Distinct domain entries saved');
eq(summary(dayTwo),{dietDays:1,trainingDays:1,stepsTotal:7500,cardioMinutes:20},'Dashboard summary accurate');
assert.throws(()=>addEntry(dayOne,sampleDiet),/YA_EXISTE/);checks++;
for(const changed of [{...sampleDiet,notes:'private'}, {...sampleDiet,ad:'anything'}, {...sampleDiet,steps:-1}, {...sampleDiet,steps:30001},{...sampleDiet,steps:'7500'}, {...sampleDiet,energy:7},{...sampleDiet,date:'2026-11-23'}, {...sampleTraining,routine:'D'},{...sampleTraining,cardioMin:91},{...sampleTraining,cardioRPE:11},{...sampleTraining,notes:'private'}, {...sampleTraining,cardioSpeed:100}]){
 assert.throws(()=>addEntry(blank,changed),/REGISTRO_FICTICIO_INVALIDO/);checks++;
}
for(const x of [null,[],{},'test',testAccount, {...blank, owner:'acct_'+'2'.repeat(32)}, {...blank, extra:'value'}, {...dayOne,entries:[dayOne.entries[0],dayOne.entries[0]]}, {...dayOne,entries:[{...dayOne.entries[0],extra:1}]}])ok(!validJournal(x,testAccount),'Reject malformed journal');
const duplicateDay={...dayOne,entries:[...dayOne.entries,{...dayOne.entries[0],id:'4'.repeat(32)}]};ok(!validJournal(duplicateDay,testAccount),'Reject duplicate date and domain');
const proposal=addEntry(blank,sampleDiet),remote=addEntry(blank,sampleTraining),merged=mergeJournal(blank,proposal,remote);eq(merged.status,'LISTO','Compatible distinct additions merge');ok(validJournal(merged.payload,testAccount),'Merged journal remains valid');eq(merged.payload.entries.length,2,'Both additions preserved');
eq(mergeJournal(blank,proposal,proposal).status,'YA_GUARDADO','Same addition not duplicated');
eq(mergeJournal(blank,proposal,addEntry(blank,{...sampleDiet,ad:'yes'})).status,'FECHA_EN_CONFLICTO','Same date edit cannot auto-merge');
eq(mergeJournal(proposal,blank,proposal).status,'MODIFICACION_CONCURRENTE','Destructive branch rejected');
ok(journalContains(merged.payload,proposal),'Contains proposed additions');ok(!journalContains(blank,proposal),'No false success');
// Real browser-compatible WebCrypto: keys independent from Google sessions and backend.
const kA=await keyFromRecoveryCode(newRecoveryCode()),kB=await keyFromRecoveryCode(newRecoveryCode());
const cipher=await encryptJournal(dayTwo,kA,testAccount);eq(cipher.format,'asia84-encrypted-v1','Existing envelope format');
const plain=await decryptJournal(cipher,kA,testAccount);eq(plain,dayTwo,'AES-GCM roundtrip');
await assert.rejects(()=>decryptJournal(cipher,kB,testAccount),/CLAVE_O_DIARIO_INVALIDO/);checks++;
await assert.rejects(()=>decryptJournal(cipher,kA,'acct_'+'2'.repeat(32)),/CLAVE_O_DIARIO_INVALIDO/);checks++;
await assert.rejects(()=>decryptJournal({...cipher,iv:cipher.iv.replace(/^./,cipher.iv[0]==='A'?'B':'A')},kA,testAccount),/CLAVE_O_DIARIO_INVALIDO/);checks++;
const sealed=await sealDraft(blank,dayOne,kA,testAccount),unsealed=await openDraft(sealed,kA,testAccount);eq(unsealed.base,blank,'Encrypted draft base recovered');eq(unsealed.proposed,dayOne,'Encrypted draft change recovered');
await assert.rejects(()=>openDraft(sealed,kB,testAccount),/CLAVE_O_DIARIO_INVALIDO/);checks++;
// Production-like SQLite schema and D1 prepared statements.
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(read('../../V11.9-LAB/migrations/0001_staging.sql'));db.exec(read('../migrations/0006_identity_oidc.sql'));db.exec(read('../migrations/0007_synthetic_journal_v115.sql'));
eq(db.prepare("SELECT COUNT(*) n FROM synthetic_journal_v115").get().n,0,'New table empty');
ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='encrypted_snapshots_v11'").get(),'Older vault unchanged');
const D1={prepare(sql){return {bind(...params){return {first:async()=>db.prepare(sql).get(...params)??null,all:async()=>({results:db.prepare(sql).all(...params)}),run:async()=>db.prepare(sql).run(...params)};}}}};
const env={STAGING_MODE:'asia-v1111-identity-private',STAGING_ORIGIN:origin,STAGING_DB:D1,STAGING_GOOGLE_CLIENT_ID:'fake.apps.googleusercontent.com',STAGING_GOOGLE_CLIENT_SECRET:'testsecret0123456',STAGING_ALLOWED_EMAILS:'person-a@example.test,person-b@example.test',STAGING_ALLOW_SYNTHETIC_SNAPSHOTS:'true'};
const worker=createWorker1111({fetchImpl:async()=>{throw Error('NO_EXTERNAL_NETWORK');}});
const request=(path,opts={},where=env)=>worker.fetch(new Request(origin+path,opts),where);
const users=[];
for(const [sub,email] of [['google-staging-a','person-a@example.test'],['google-staging-b','person-b@example.test']]){
 const id=await accountId('https://accounts.google.com',sub),token=newRecoveryCode(),csrf=newRecoveryCode(),now=Date.now();
 db.prepare('INSERT INTO accounts_v11(account_id,issuer,subject,created_at) VALUES(?,?,?,?)').run(id,'https://accounts.google.com',sub,new Date(now).toISOString());
 db.prepare('INSERT INTO auth_oidc_sessions_v1111(token_digest,account_id,csrf,email_digest,created_at,expires_at) VALUES(?,?,?,?,?,?)').run(await digest(token),id,csrf,await digest(email),now,now+3600000);
 users.push({id,token,csrf,cookie:'__Host-asia1111_session='+token});
}
const [A,B]=users;
const authed=(path,u,opts={})=>request(path,{...opts,headers:{Cookie:u.cookie,...opts.headers}});
const validPut=(user,expected,envelope)=>authed('/v11.15/data/journal',user,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Asia-CSRF':user.csrf},body:JSON.stringify({expectedRevision:expected,envelope})});
const grant=await request('/v11.15/auth/start');eq(grant.status,303,'Google OAuth existing entry preserved');eq(grant.headers.get('Location'),'/v11.11/auth/start','Return to existing verified start');ok((grant.headers.get('Set-Cookie')||'').includes('__Host-asia1115_return=1'),'Return cookie secure');
for(const [path,ctype] of [['/v11.15/','text/html'],['/v11.15/app.js','text/javascript'],['/v11.15/asia106-original.css','text/css'],['/v11.15/stage115.css','text/css'],['/v11.15/crypto115.js','text/javascript'],['/v11.15/journal115.js','text/javascript']]){
 const r=await request(path);eq(r.status,200,'Serves new asset '+path);ok(r.headers.get('Content-Type').startsWith(ctype),'Correct content type');ok(r.headers.get('Content-Security-Policy').includes("script-src 'self'"),'CSP restricts scripts');eq(r.headers.get('Cache-Control'),'no-store','No stale cache');eq(r.headers.get('X-Asia-Staging'),'synthetic-only','Synthetic marker');ok((await r.text()).length>20,'Full asset returned');
}
for(const p of ['/v11.14/','/v11.13/','/v11.12/','/v11.11/'])eq((await request(p)).status,200,'Old stage route survives: '+p);
for(const p of ['/v11.15/?q=1','/v11.15/unknown','/v11.15/app.js?q=1','/v11.15/data/journal?accountId='+B.id])ok((await request(p)).status!==200,'Unlisted/new query forbidden: '+p);
eq((await request('/v11.11/status')).status,200,'Worker reports ready');
eq((await request('/v11.15/data/journal')).status,401,'Unauthenticated index rejected');
eq((await request('/v11.15/data/journal/1')).status,401,'Unauthenticated copy rejected');
eq((await authed('/v11.15/data/journal',A)).status,200,'Authenticated index allowed');
eq((await authed('/v11.15/data/journal',A,{headers:{'X-Asia-Account':B.id}})).status,403,'Account spoof blocked');
eq((await request('/v11.15/data/journal',{}, {...env, STAGING_ALLOW_SYNTHETIC_SNAPSHOTS:'false'})).status,403,'Server-side kill switch');
eq((await request('/v11.15/',{}, {...env,DB:{}})).status,503,'Production binding explicitly blocked');
eq((await request('/v11.15/',{}, {...env,STAGING_MODE:'false'})).status,503,'Staging environment enforced');
eq((await request('/v11.15/',{}, {...env,STAGING_DB:{prepare:()=>({bind:()=>({first:async()=>({marker:'bad'})})})}})).status,503,'Database marker enforced');
const aJournal=addEntry(blankJournal(A.id),sampleDiet),bJournal=addEntry(blankJournal(B.id),sampleTraining);
const envA=await encryptJournal(aJournal,kA,A.id),envB=await encryptJournal(bJournal,kB,B.id);
eq((await validPut(A,0,envA)).status,201,'A writes first encrypted journal');
eq((await validPut(B,0,envB)).status,201,'B writes independent encrypted journal');
const aLatest=await(await authed('/v11.15/data/journal/1',A)).json(),bLatest=await(await authed('/v11.15/data/journal/1',B)).json();
eq(await decryptJournal(aLatest.envelope,kA,A.id),aJournal,'Account A decrypts own journal');
eq(await decryptJournal(bLatest.envelope,kB,B.id),bJournal,'Account B decrypts own journal');
await assert.rejects(()=>decryptJournal(aLatest.envelope,kB,B.id),/CLAVE_O_DIARIO_INVALIDO/);checks++;
for(const [path,status] of [['/v11.15/data/journal',200],['/v11.15/data/journal/1',200]])eq((await authed(path,B)).status,status,'B only sees its own rows');
eq((await validPut(A,0,envA)).status,409,'Stale expected revision blocked');
eq((await authed('/v11.15/data/journal',A,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Asia-CSRF':'wrong'},body:JSON.stringify({expectedRevision:1,envelope:envA})})).status,403,'Bad CSRF blocked');
eq((await authed('/v11.15/data/journal',A,{method:'POST',headers:{Origin:'https://evil.test','Content-Type':'application/json','X-Asia-CSRF':A.csrf},body:JSON.stringify({expectedRevision:1,envelope:envA})})).status,403,'Bad Origin blocked');
for(const input of [{expectedRevision:1,envelope:envA,accountId:B.id},{expectedRevision:-1,envelope:envA},{expectedRevision:30,envelope:envA},{expectedRevision:1,envelope:{cipher:'abc'}},{expectedRevision:1,other:1,envelope:envA}]){
 const resp=await authed('/v11.15/data/journal',A,{method:'POST',headers:{Origin:origin,'X-Asia-CSRF':A.csrf,'Content-Type':'application/json'},body:JSON.stringify(input)});eq(resp.status,400,'Malformed request rejected');
}
for(const path of ['/v11.15/data/journal/0','/v11.15/data/journal/31','/v11.15/data/journal/notnum'])eq((await authed(path,A)).status,404,'Invalid revision rejected');
for(const method of ['PUT','PATCH','DELETE'])eq((await authed('/v11.15/data/journal',A,{method})).status,405,'Invalid method rejected');
// Independent original snapshots remain untouched and original endpoints work.
eq(db.prepare('SELECT COUNT(*) n FROM encrypted_snapshots_v11').get().n,0,'New journal never touches old snapshots');
const oldVault={format:'asia-v1112-demo-v1',owner:A.id,entries:[{id:'a'.repeat(32),kind:'meal'}]};
const oldEnvelope=await encryptDemo(oldVault,kA,A.id);
const oldResult=await authed('/v11.11/data/snapshots',A,{method:'POST',headers:{Origin:origin,'X-Asia-CSRF':A.csrf,'Content-Type':'application/json'},body:JSON.stringify({expectedRevision:0,envelope:oldEnvelope})});eq(oldResult.status,201,'Previous synthetic vault still writes');
eq(db.prepare('SELECT COUNT(*) n FROM synthetic_journal_v115').get().n,2,'Old vault does not touch new journal');
// Server never stores the key, code or plaintext in D1.
const stored=db.prepare('SELECT envelope FROM synthetic_journal_v115 WHERE account_id=?').get(A.id).envelope;
ok(!stored.includes(sampleDiet.ad)&&!stored.includes(A.token)&&!stored.includes(A.csrf),'No credentials or plaintext in stored journal');
// Expired sessions rejected despite valid bearer cookie.
db.prepare('UPDATE auth_oidc_sessions_v1111 SET expires_at=? WHERE account_id=?').run(Date.now()-1,A.id);
eq((await authed('/v11.15/data/journal',A)).status,401,'Expired session rejected');
eq((await authed('/v11.15/data/journal',B)).status,200,'Other user remains authenticated');
// Full OAuth callback for the new return marker, using real RSA signatures and fake Google endpoints.
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'test115',use:'sig',alg:'RS256'};
let authContext=null;
const b64=bytes=>Buffer.from(bytes).toString('base64url');
const jwt=claims=>{const h=b64(JSON.stringify({alg:'RS256',kid:'test115',typ:'JWT'})),p=b64(JSON.stringify(claims));return h+'.'+p+'.'+sign('RSA-SHA256',Buffer.from(h+'.'+p),privateKey).toString('base64url');};
const googleMock=async(url,opts)=>{
 eq(opts.redirect,'manual','OAuth provider refuses automatic redirects');
 if(url==='https://oauth2.googleapis.com/token'){
  const body=new URLSearchParams(opts.body);eq(body.get('redirect_uri'),origin+'/v11.11/auth/callback','Google redirect URI exact');
  const now=Math.floor(Date.now()/1000);
  return new Response(JSON.stringify({id_token:jwt({iss:'https://accounts.google.com',aud:env.STAGING_GOOGLE_CLIENT_ID,sub:'google-callback-v115',nonce:authContext.nonce,exp:now+300,iat:now,email:'person-a@example.test',email_verified:true})}),{status:200});
 }
 if(url==='https://www.googleapis.com/oauth2/v3/certs')return new Response(JSON.stringify({keys:[jwk]}),{status:200});
 throw Error('NO_EXTERNAL_NETWORK');
};
const oauthWorker=createWorker1111({fetchImpl:googleMock});
const oauthReq=(path,options={})=>oauthWorker.fetch(new Request(origin+path,options),env);
const markerResponse=await oauthReq('/v11.15/auth/start');
const markerCookie=markerResponse.headers.get('Set-Cookie').split(';')[0];
const googleStart=await oauthReq('/v11.11/auth/start');eq(googleStart.status,303,'Google authorization starts');
const loc=new URL(googleStart.headers.get('Location'));authContext={nonce:loc.searchParams.get('nonce')};
const flowCookie=googleStart.headers.get('Set-Cookie').split(';')[0];
const params=new URLSearchParams({code:'synthetic-code-v115',state:loc.searchParams.get('state'),scope:'openid email',authuser:'0'});
const callback=await oauthReq('/v11.11/auth/callback?'+params,{headers:{Cookie:flowCookie+'; '+markerCookie}});
eq(callback.status,303,'Signed Google callback accepted');
eq(callback.headers.get('Location'),'/v11.15/','Signed Google login returns to V11.15');
ok(callback.headers.getSetCookie().some(s=>s.startsWith('__Host-asia1115_return=;')),'Return marker cleared');
const newSession=callback.headers.getSetCookie().find(x=>x.startsWith('__Host-asia1111_session='));
ok(!!newSession,'New session cookie set');
const me=await oauthReq('/v11.11/auth/me',{headers:{Cookie:newSession.split(';')[0]}});
eq(me.status,200,'New account session works after redirect');

console.log(`V11.15: ${checks} verificaciones de campos V10.6, cifrado, aislamiento, conflictos, rutas y D1.`);
console.log('Offline, Google simulado y SQLite real. No hay datos personales ni conexiones externas.');
