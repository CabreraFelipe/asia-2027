// Identity gateway, intentionally LOCAL-ONLY. Never deploy this mocked provider to production.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {random,CLIENT_ID,strictClaims,makeAuthorizeUrl,hashToken,safeEqual} from './oidc1110.mjs';
const HEADERS={
 'Cache-Control':'no-store','Pragma':'no-cache','Referrer-Policy':'no-referrer',
 'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',
 'Cross-Origin-Resource-Policy':'same-origin',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
};
const json=(res,code,value,more={})=>res.writeHead(code,{...HEADERS,'Content-Type':'application/json; charset=utf-8',...more}).end(JSON.stringify(value));
const fail=(res,code)=>json(res,code,{ok:false,error:code===401?'NO_AUTORIZADO':'SOLICITUD_RECHAZADA'});
const cookie=(name,val,age,path='/')=>`${name}=${val}; HttpOnly; SameSite=Lax; Path=${path}; Max-Age=${age}`;
const parseCookie=(req,name)=>{const list=(req.headers.cookie||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(name+'='));return list.length===1?list[0].slice(name.length+1):null;};
const badInput=q=>typeof q!=='string'||q.length>256;
async function getBody(req,limit=1024){if(!req.headers['content-type']?.startsWith('application/json'))throw Error('TYPE');let n=0,chunks=[];for await(const c of req){n+=c.length;if(n>limit)throw Error('LARGE');chunks.push(c);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
async function fixedJSON(url){const controller=new AbortController(),id=setTimeout(()=>controller.abort(),2000);try{const r=await fetch(url,{signal:controller.signal,redirect:'error',headers:{Accept:'application/json'}});if(!r.ok||Number(r.headers.get('content-length')||0)>30000)throw Error('BAD_PROVIDER');const txt=await r.text();if(txt.length>30000)throw Error('BAD_PROVIDER');return JSON.parse(txt);}finally{clearTimeout(id);}}
export function startGateway({port,idpPort,issuer}){
 const flows=new Map(),sessions=new Map(),notes=new Map();
 const host=`127.0.0.1:${port}`,origin=`http://${host}`,redirect=`${origin}/auth/callback`;
 const cleanup=()=>{const now=Date.now();for(const [k,v] of flows)if(v.expires<=now)flows.delete(k);for(const [k,v] of sessions)if(v.expires<=now)sessions.delete(k);};
 const current=req=>{const token=parseCookie(req,'asia1110_session');if(!token||!/^[\w-]{43}$/.test(token))return null;const v=sessions.get(hashToken(token));return v&&v.expires>Date.now()?v:null;};
 const protect=(req,res)=>{const ses=current(req);if(!ses){fail(res,401);return null;}return ses;};
 const csrf=(req,res,ses)=>{if(req.headers.origin!==origin||!safeEqual(req.headers['x-asia-csrf']||'',ses.csrf)){fail(res,403);return false;}return true;};
 const pages=new Map([['/v1110/','../web/index.html'],['/v1110/index.html','../web/index.html'],['/v1110/styles.css','../web/styles.css'],['/v1110/app.mjs','../web/app.mjs'],['/v1110/icon.svg','../../V11.9-LAB/v119/icon.svg']]);
 const server=createServer(async(req,res)=>{
  if(req.headers.host!==host){fail(res,403);return;}
  let url;try{url=new URL(req.url,origin);}catch{fail(res,400);return;}
  const path=url.pathname;
  if((req.method==='GET'||req.method==='HEAD')&&pages.has(path)&&!url.search){
   try{const file=new URL(pages.get(path),import.meta.url),buf=await readFile(file);const type=path.endsWith('.css')?'text/css':path.endsWith('.mjs')?'text/javascript':path.endsWith('.svg')?'image/svg+xml':'text/html';res.writeHead(200,{...HEADERS,'Content-Type':type+'; charset=utf-8','Content-Length':buf.length}).end(req.method==='HEAD'?undefined:buf);}catch{fail(res,500);}return;
  }
  if(req.method==='GET'&&path==='/'&&!url.search){res.writeHead(302,{...HEADERS,Location:'/v1110/'}).end();return;}
  if(req.method==='GET'&&path==='/auth/health'&&!url.search){json(res,200,{ok:true,version:'11.10',mode:'mock-identity-local',realUsers:false,cloudflare:false});return;}
  if(req.method==='GET'&&path==='/auth/start'&&!url.search){
   cleanup();if(flows.size>=80){fail(res,429);return;}
   const state=random(),nonce=random(),verifier=random();flows.set(state,{nonce,verifier,expires:Date.now()+120000});
   const authorization=makeAuthorizeUrl({base:issuer,redirectUri:redirect,state,nonce,verifier});
   res.writeHead(303,{...HEADERS,Location:authorization,'Set-Cookie':cookie('asia1110_flow',state,120,'/auth/callback')}).end();return;
  }
  if(req.method==='GET'&&path==='/auth/callback'){
   cleanup();const state=url.searchParams.get('state'),code=url.searchParams.get('code'),browserState=parseCookie(req,'asia1110_flow');
   const clearFlow=cookie('asia1110_flow','',0,'/auth/callback');
   const record=state&&flows.get(state);if(state)flows.delete(state);
   if(url.searchParams.size!==2||badInput(state)||badInput(code)||!record||!browserState||!safeEqual(state,browserState)){
    json(res,400,{ok:false,error:'FLUJO_INVALIDO'},{'Set-Cookie':clearFlow});return;
   }
   try{
    const params=new URLSearchParams({grant_type:'authorization_code',code,client_id:CLIENT_ID,redirect_uri:redirect,code_verifier:record.verifier});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2000);let token;
    try{const response=await fetch(`${issuer}token`,{method:'POST',redirect:'error',signal:controller.signal,headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params.toString()});if(!response.ok)throw Error('TOKEN_EXCHANGE_FAILED');token=await response.json();}finally{clearTimeout(timer);}
    const jwks=await fixedJSON(`${issuer}.well-known/jwks.json`);
    const verified=strictClaims(token.id_token,{issuer,audience:CLIENT_ID,nonce:record.nonce,jwks});
    const raw=random(),session={identity:verified,csrf:random(),expires:Date.now()+1800000};
    if(sessions.size>120){fail(res,429);return;}
    sessions.set(hashToken(raw),session);
    res.writeHead(303,{...HEADERS,Location:'/v1110/','Set-Cookie':[clearFlow,cookie('asia1110_session',raw,1800)]}).end();return;
   }catch{json(res,400,{ok:false,error:'IDENTIDAD_NO_VERIFICADA'},{'Set-Cookie':clearFlow});return;}
  }
  if(req.method==='GET'&&path==='/auth/me'&&!url.search){const s=protect(req,res);if(!s)return;json(res,200,{ok:true,account:{id:s.identity.id,label:s.identity.subject==='mock-user-a'?'Persona de prueba A':'Persona de prueba B'},csrf:s.csrf,expiresAt:new Date(s.expires).toISOString(),demo:true});return;}
  if(req.method==='GET'&&path==='/auth/data'&&!url.search){const s=protect(req,res);if(!s)return;json(res,200,{ok:true,note:notes.get(s.identity.id)||'',source:'in-memory-only',accountId:s.identity.id});return;}
  if(req.method==='POST'&&path==='/auth/note'&&!url.search){const s=protect(req,res);if(!s||!csrf(req,res,s))return;
   try{const body=await getBody(req);if(!body||Object.keys(body).length!==1||typeof body.note!=='string'||body.note.trim().length<1||body.note.length>160){fail(res,400);return;}notes.set(s.identity.id,body.note.trim());json(res,200,{ok:true});}catch{fail(res,400);}return;
  }
  if(req.method==='POST'&&path==='/auth/logout'&&!url.search){const s=protect(req,res);if(!s||!csrf(req,res,s))return;const raw=parseCookie(req,'asia1110_session');sessions.delete(hashToken(raw));json(res,200,{ok:true},{'Set-Cookie':cookie('asia1110_session','',0)});return;}
  if(req.method==='POST'&&path==='/auth/logout-all'&&!url.search){const s=protect(req,res);if(!s||!csrf(req,res,s))return;
   let count=0;for(const [key,value]of sessions)if(value.identity.id===s.identity.id){sessions.delete(key);count++;}json(res,200,{ok:true,revoked:count},{'Set-Cookie':cookie('asia1110_session','',0)});return;
  }
  if(path.startsWith('/auth/')){fail(res,req.method==='GET'?404:405);return;}
  fail(res,404);
 });
 return {server,issuer};
}
