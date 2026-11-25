// Zero external network. Uses only two ephemeral loopback servers and synthetic identities.
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {generateKeyPairSync,sign} from 'node:crypto';
import {CLIENT_ID,random,challenge,b64url,accountId,strictClaims,makeAuthorizeUrl,safeEqual,hashToken} from '../src/oidc1110.mjs';
let unit=0,network=0;
const ok=(value,message)=>{assert.ok(value,message);unit++;};
const same=(a,b,message)=>{assert.deepEqual(a,b,message);unit++;};
const rejects=(fn,code)=>{assert.throws(fn,e=>e?.message===code,code);unit++;};
const assertHTTP=(r,status,msg)=>{assert.equal(r.status,status,msg||`${r.url} expected ${status}, got ${r.status}`);network++;return r;};
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const key={...publicKey.export({format:'jwk'}),alg:'RS256',use:'sig',kid:'testkey'};
const issuer='https://issuer.example.invalid/';const nonce=random();const now=Math.floor(Date.now()/1000);
const c={iss:issuer,aud:CLIENT_ID,sub:'mock-user-a',nonce,exp:now+180,iat:now,auth_time:now};
const encode=(claims=c,header={alg:'RS256',typ:'JWT',kid:'testkey'},privateSigningKey=privateKey)=>{const parts=[b64url(Buffer.from(JSON.stringify(header))),b64url(Buffer.from(JSON.stringify(claims)))],unsigned=parts.join('.');return unsigned+'.'+sign('RSA-SHA256',Buffer.from(unsigned),privateSigningKey).toString('base64url');};
const valid={issuer,audience:CLIENT_ID,nonce,jwks:{keys:[key]},now};
same(strictClaims(encode(),valid).subject,'mock-user-a','Valid signature and claims');
ok(accountId(issuer,'mock-user-a')!==accountId(issuer,'mock-user-b'),'Canonical separation');
ok(accountId(issuer,'mock-user-a')!==accountId('https://other.example/','mock-user-a'),'Issuer included');
ok(challenge('A'.repeat(43)).length===43,'PKCE SHA256 length');ok(random().length===43,'Random entropy 256bit');
ok(safeEqual('abc','abc'),'Safe equal');ok(!safeEqual('abc','abd'),'Safe not equal');ok(!safeEqual('abc','ab'),'Safe length check');
ok(hashToken('abc').length===64,'Hashed session lookup');
const loginURL=new URL(makeAuthorizeUrl({base:issuer,redirectUri:'http://127.0.0.1/callback',state:random(),nonce,verifier:random()}));
same(loginURL.searchParams.get('code_challenge_method'),'S256','PKCE method');same(loginURL.searchParams.get('response_type'),'code','OIDC authorization code');
for(const [obj,expected] of [
 [{...c,iss:'https://evil.example'},'ISSUER_INVALID'],[{...c,aud:'bad'},'AUDIENCE_INVALID'],[{...c,nonce:'wrong'},'NONCE_INVALID'],[{...c,exp:now-1},'EXP_INVALID'],[{...c,exp:now+7200},'EXP_INVALID'],[{...c,iat:now+300},'IAT_INVALID'],[{...c,iat:now-9999},'IAT_INVALID'],[{...c,auth_time:now-700},'AUTH_TIME_INVALID'],[{...c,sub:'?'},'SUB_INVALID']
 ])rejects(()=>strictClaims(encode(obj),valid),expected);
rejects(()=>strictClaims(encode(c,{alg:'none',typ:'JWT',kid:'testkey'}),valid),'ID_TOKEN_INVALID');
rejects(()=>strictClaims(encode(c,{alg:'RS256',typ:'JWT',kid:'missing'}),valid),'JWKS_KEY_INVALID');
rejects(()=>strictClaims(encode(),{...valid,jwks:{keys:[]}}),'JWKS_KEY_INVALID');
rejects(()=>strictClaims(encode(),{...valid,jwks:{keys:[key,key]}}),'JWKS_KEY_INVALID');
rejects(()=>strictClaims(encode().slice(0,-5)+'abcde',valid),'SIGNATURE_INVALID');
rejects(()=>strictClaims('header.body',valid),'ID_TOKEN_INVALID');
rejects(()=>strictClaims(encode(),{...valid,nonce:null}),'NONCE_INVALID');
rejects(()=>makeAuthorizeUrl({base:issuer,redirectUri:'/callback',state:random(),nonce,verifier:'short'}),'AUTH_REQUEST_INVALID');
// reserve two distinct ephemeral loopback ports
const reserve=()=>new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const port=await reserve();let idp=await reserve();while(idp===port)idp=await reserve();
const child=spawn(process.execPath,['scripts/serve1110.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,ASIA1110_PORT:String(port),ASIA1110_IDP_PORT:String(idp)},stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
const origin=`http://127.0.0.1:${port}`,provider=`http://127.0.0.1:${idp}`;
const fetchManual=(url,opts={})=>fetch(url,{redirect:'manual',...opts});
function cookies(res,name){const all=res.headers.getSetCookie();const item=all.find(x=>x.startsWith(name+'='));assert.ok(item,`Missing cookie ${name}`);network++;return item.split(';',1)[0];}
async function begin(){const r=assertHTTP(await fetchManual(origin+'/auth/start'),303);const flow=cookies(r,'asia1110_flow');const u=new URL(r.headers.get('location'));same(u.origin,provider,'Only mock provider');return {flow,url:u};}
async function select(initial,user){const authorize=assertHTTP(await fetchManual(initial.url),200);const html=await authorize.text();const id=html.match(/name="request_id" value="([\w-]+)"/)?.[1];assert.ok(id,'Request id in form');network++;
 const selected=assertHTTP(await fetchManual(provider+'/select',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({request_id:id,user})}),303);return selected.headers.get('location');}
async function finish(flow,url){return fetchManual(url,{headers:{Cookie:flow}});}
async function login(user){const start=await begin();const to=await select(start,user);const result=assertHTTP(await finish(start.flow,to),303);const session=cookies(result,'asia1110_session');const me=await fetchManual(origin+'/auth/me',{headers:{Cookie:session}});assertHTTP(me,200);const body=await me.json();ok(body.ok&&body.demo,'Mock identity');return {session,csrf:body.csrf,account:body.account};}
const headers=(s,csrf,extra={})=>({Cookie:s,Origin:origin,'X-Asia-CSRF':csrf,'Content-Type':'application/json',...extra});
const post=(path,s,csrf,body={})=>fetchManual(origin+path,{method:'POST',headers:headers(s,csrf),body:JSON.stringify(body)});
try{
 let ready=false;for(let i=0;i<80;i++){if(child.exitCode!==null)break;try{const r=await fetchManual(origin+'/auth/health');if(r.status===200){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,50));}
 ok(ready,'Gateway booted');
 const page=assertHTTP(await fetchManual(origin+'/v1110/'),200);const pageText=await page.text();ok(pageText.includes('v11.10'),'Visible version');ok(!pageText.includes('minlength="16"'),'No 16-character requirement in identity UI');
 ok(page.headers.get('Content-Security-Policy')?.includes("script-src 'self'"),'Strict CSP');ok(page.headers.get('cache-control')==='no-store','No caching');
 const css=assertHTTP(await fetchManual(origin+'/v1110/styles.css'),200);ok((await css.text()).includes('.topbar'),'Original visual styles served');
 assertHTTP(await fetchManual(origin+'/v1110/app.mjs'),200);assertHTTP(await fetchManual(origin+'/v1110/icon.svg'),200);
 assertHTTP(await fetchManual(origin+'/auth/me'),401);assertHTTP(await fetchManual(origin+'/auth/data'),401);
 assertHTTP(await fetchManual(origin+'/auth/note',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'}),401);
 for(const path of ['/auth/admin','/v119/','/wrangler.api.toml','/api-staging.mjs','/v1110/../src/gateway1110.mjs','/v1110/styles.css?a=1'])assertHTTP(await fetchManual(origin+path),404);
 for(const method of ['POST','PUT','PATCH','DELETE'])assertHTTP(await fetchManual(origin+'/v1110/',{method}),404);
 assertHTTP(await fetchManual(origin+'/auth/me',{headers:{Host:'malicious.test'}}),401); // undici normalizes Host; unauthenticated request stays denied
 const a=await login('a');const b=await login('b');ok(a.account.id!==b.account.id,'Different server identities');
 // One user cannot read the other's synthetic note by changing a header, query or cookie.
 assertHTTP(await post('/auth/note',a.session,a.csrf,{note:'solo A'}),200);
 assertHTTP(await post('/auth/note',b.session,b.csrf,{note:'solo B'}),200);
 const dataA=assertHTTP(await fetchManual(origin+'/auth/data',{headers:{Cookie:a.session,'X-Account-Id':b.account.id}}),200);const da=await dataA.json();same(da.note,'solo A','A data');same(da.accountId,a.account.id,'Account derives from signed identity');
 const dataB=assertHTTP(await fetchManual(origin+'/auth/data?accountId='+a.account.id,{headers:{Cookie:b.session}}),404); // Query injections not allowed
 const bData=assertHTTP(await fetchManual(origin+'/auth/data',{headers:{Cookie:b.session}}),200);same((await bData.json()).note,'solo B','B data');
 assertHTTP(await post('/auth/note',a.session,'fake-csrf',{note:'forged'}),403);
 assertHTTP(await fetchManual(origin+'/auth/note',{method:'POST',headers:headers(a.session,a.csrf,{Origin:'https://evil.example'}),body:JSON.stringify({note:'attacker'})}),403);
 assertHTTP(await post('/auth/note',a.session,a.csrf,{note:'',accountId:b.account.id}),400);
 assertHTTP(await post('/auth/note',a.session,a.csrf,{note:'X'.repeat(161)}),400);
 const afterBad=assertHTTP(await fetchManual(origin+'/auth/data',{headers:{Cookie:a.session}}),200);same((await afterBad.json()).note,'solo A','No overwrite from bad requests');
 assertHTTP(await fetchManual(origin+'/auth/me',{headers:{Cookie:'asia1110_session='+random()}}),401);
 // Callback missing/forged flow cookie rejected and cannot be replayed.
 const forged=await begin();const forgedURL=await select(forged,'a');assertHTTP(await finish('asia1110_flow='+random(),forgedURL),400);assertHTTP(await finish(forged.flow,forgedURL),400);
 // Simulate PKCE mismatch and one-use provider authorization codes.
 const wrong=await begin();const wrongURL=await select(wrong,'a');const wrongCode=new URL(wrongURL).searchParams.get('code');
 const badToken=assertHTTP(await fetchManual(provider+'/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:CLIENT_ID,redirect_uri:origin+'/auth/callback',code:wrongCode,code_verifier:'wrong'})}),400);
 assertHTTP(await finish(wrong.flow,wrongURL),400);
 assertHTTP(await post('/auth/logout',a.session,a.csrf,{}),200);
 assertHTTP(await fetchManual(origin+'/auth/me',{headers:{Cookie:a.session}}),401);
 assertHTTP(await fetchManual(origin+'/auth/data',{headers:{Cookie:b.session}}),200); // B unaffected by A logout.
 const a2=await login('a');same(a2.account.id,a.account.id,'Account stable across sessions');
 const a3=await login('a');assertHTTP(await post('/auth/logout-all',a2.session,a2.csrf,{}),200);
 assertHTTP(await fetchManual(origin+'/auth/me',{headers:{Cookie:a2.session}}),401);
 assertHTTP(await fetchManual(origin+'/auth/me',{headers:{Cookie:a3.session}}),401);
 assertHTTP(await fetchManual(origin+'/auth/me',{headers:{Cookie:b.session}}),200);
 assertHTTP(await fetchManual(provider+'/.well-known/jwks.json'),200);
 assertHTTP(await fetchManual(origin+'/auth/health'),200);
 console.log(`V11.10: ${unit} comprobaciones de contratos + ${network} comprobaciones HTTP/OIDC locales.`);
 console.log('Sin contraseñas, sin datos personales, sin Internet, sin despliegue.');
}finally{child.kill('SIGTERM');await new Promise(resolve=>setTimeout(resolve,100));}
