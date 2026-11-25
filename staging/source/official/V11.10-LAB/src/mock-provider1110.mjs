// ISOLATED MOCK OIDC PROVIDER FOR LOCAL DEVELOPMENT ONLY.
import {createServer} from 'node:http';
import {generateKeyPairSync,randomBytes,sign} from 'node:crypto';
import {CLIENT_ID,b64url,challenge,random,safeEqual} from './oidc1110.mjs';
const baseHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
const send=(res,status,body='',type='text/plain; charset=utf-8',extra={})=>{res.writeHead(status,{...baseHeaders,'Content-Type':type,...extra}).end(body);};
const err=(res,status)=>send(res,status,'Solicitud rechazada');
const formType='application/x-www-form-urlencoded';
const valid=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{20,140}$/.test(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function readForm(req,limit=3000){if(!req.headers['content-type']?.startsWith(formType))throw Error('CONTENT_TYPE');let total=0,parts=[];for await(const c of req){total+=c.length;if(total>limit)throw Error('TOO_LARGE');parts.push(c);}return new URLSearchParams(Buffer.concat(parts).toString('utf8'));}
export function startMockProvider({port,appPort}){
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048,publicExponent:0x10001});
 const jwk={...publicKey.export({format:'jwk'}),use:'sig',alg:'RS256',kid:'mock1110'};
 const issuer=`http://127.0.0.1:${port}/`,redirect=`http://127.0.0.1:${appPort}/auth/callback`;
 const pending=new Map(),codes=new Map();
 const cleanup=()=>{const t=Date.now();for(const [k,v] of pending)if(v.expires<t)pending.delete(k);for(const [k,v] of codes)if(v.expires<t)codes.delete(k);};
 const server=createServer(async(req,res)=>{
  if(req.headers.host!==`127.0.0.1:${port}`){err(res,403);return;}
  let u;try{u=new URL(req.url,issuer);}catch{err(res,400);return;}
  if(req.method==='GET'&&u.pathname==='/authorize'){
   cleanup();const p=u.searchParams;
   if(p.get('client_id')!==CLIENT_ID||p.get('redirect_uri')!==redirect||p.get('response_type')!=='code'||p.get('scope')!=='openid'||p.get('code_challenge_method')!=='S256'||![p.get('state'),p.get('nonce'),p.get('code_challenge')].every(valid)||p.size!==8||pending.size>=80){err(res,400);return;}
   const id=random();pending.set(id,{state:p.get('state'),nonce:p.get('nonce'),codeChallenge:p.get('code_challenge'),expires:Date.now()+120000});
   const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Proveedor de identidad ficticio</title><style>body{font-family:system-ui;background:#0a1020;color:#edf4ff;margin:0;padding:45px 18px}.card{max-width:460px;margin:auto;border:1px solid #33415e;border-radius:16px;background:#151f33;padding:26px}button{width:100%;padding:14px;border:0;border-radius:10px;background:#b1d2ff;color:#10213b;font-size:15px;font-weight:bold;margin-top:12px;cursor:pointer}.warn{color:#f0cb91;font-size:13px}</style></head><body><main class="card"><h1>Acceso de prueba</h1><p class="warn">Proveedor simulado local. No es Google, Apple ni autenticación real. No ingreses datos personales.</p><p>Elegí una identidad ficticia, sin contraseña:</p><form method="post" action="/select"><input type="hidden" name="request_id" value="${escape(id)}"><button type="submit" name="user" value="a">Entrar como Persona de prueba A</button><button type="submit" name="user" value="b">Entrar como Persona de prueba B</button></form></main></body></html>`;
   send(res,200,html,'text/html; charset=utf-8',{'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'"});return;
  }
  if(req.method==='POST'&&u.pathname==='/select'&&!u.search){
   try{const p=await readForm(req);const id=p.get('request_id'),user=p.get('user');const rec=pending.get(id);pending.delete(id);if(!rec||rec.expires<Date.now()||!['a','b'].includes(user)||p.size!==2){err(res,400);return;}
    const code=random();codes.set(code,{...rec,user,expires:Date.now()+120000});const next=new URL(redirect);next.searchParams.set('code',code);next.searchParams.set('state',rec.state);res.writeHead(303,{...baseHeaders,Location:next.toString()}).end();return;
   }catch{err(res,400);return;}
  }
  if(req.method==='POST'&&u.pathname==='/token'&&!u.search){
   try{const p=await readForm(req,4000);const code=p.get('code');const rec=codes.get(code);codes.delete(code);
    if(!rec||rec.expires<Date.now()||p.size!==5||p.get('grant_type')!=='authorization_code'||p.get('client_id')!==CLIENT_ID||p.get('redirect_uri')!==redirect||!safeEqual(challenge(p.get('code_verifier')||''),rec.codeChallenge)){err(res,400);return;}
    const now=Math.floor(Date.now()/1000),claims={iss:issuer,aud:CLIENT_ID,sub:'mock-user-'+rec.user,exp:now+180,iat:now,auth_time:now,nonce:rec.nonce};
    const header=b64url(Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT',kid:'mock1110'}))),payload=b64url(Buffer.from(JSON.stringify(claims))),unsigned=header+'.'+payload;
    const signature=sign('RSA-SHA256',Buffer.from(unsigned),privateKey).toString('base64url');
    send(res,200,JSON.stringify({id_token:unsigned+'.'+signature,token_type:'Bearer',expires_in:180}),'application/json; charset=utf-8');return;
   }catch{err(res,400);return;}
  }
  if(req.method==='GET'&&u.pathname==='/.well-known/jwks.json'&&!u.search){send(res,200,JSON.stringify({keys:[jwk]}),'application/json; charset=utf-8');return;}
  err(res,404);
 });
 return {server,issuer,jwk};
}
