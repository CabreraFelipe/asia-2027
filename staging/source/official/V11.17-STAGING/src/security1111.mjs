// V11.11 — OpenID Connect crypto utilities, Worker WebCrypto compatible.
// No provider tokens, encryption keys or personal health payloads are logged/stored.
const te=new TextEncoder();
export const rand=()=>{const a=new Uint8Array(32);crypto.getRandomValues(a);return b64url(a);};
export const b64url=bytes=>{let b='';for(const x of bytes)b+=String.fromCharCode(x);return btoa(b).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');};
export const fromB64=s=>{if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s)||s.length>20000)throw Error('B64_INVALID');const std=s.replaceAll('-','+').replaceAll('_','/');const bytes=atob(std+'='.repeat((4-std.length%4)%4));return Uint8Array.from(bytes,c=>c.charCodeAt(0));};
export const hex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
export const sha256=async text=>new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(text)));
export const digest=async text=>hex(await sha256(text));
export const pkce=async verifier=>b64url(await sha256(verifier));
export const eq=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;const x=te.encode(a),y=te.encode(b);let mismatch=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)mismatch|=(x[i]??0)^(y[i]??0);return mismatch===0;};
export const accountId=async(iss,sub)=>'acct_'+(await digest(iss+'\0'+sub)).slice(0,32);
const req=(ok,reason)=>{if(!ok)throw Error(reason);};
export async function verifyGoogleIdToken(jwt,{nonce,clientId,jwks,now=Math.floor(Date.now()/1000)}={}){
 req(typeof jwt==='string'&&jwt.length<16000,'TOKEN_INVALID');const parts=jwt.split('.');req(parts.length===3,'TOKEN_INVALID');
 let header,payload;try{header=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(fromB64(parts[0])));payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(fromB64(parts[1])));}catch{throw Error('TOKEN_INVALID');}
 req(header&&header.alg==='RS256'&&typeof header.kid==='string'&&header.kid.length<200&&(!header.typ||header.typ==='JWT'),'TOKEN_ALG_INVALID');
 req(jwks&&Array.isArray(jwks.keys)&&jwks.keys.length<=20,'JWKS_INVALID');
 const matches=jwks.keys.filter(k=>k.kid===header.kid&&k.kty==='RSA'&&(k.alg===undefined||k.alg==='RS256')&&(k.use===undefined||k.use==='sig')&&typeof k.n==='string'&&typeof k.e==='string');req(matches.length===1,'JWKS_KEY_INVALID');
 let verified=false;try{const key=await crypto.subtle.importKey('jwk',matches[0],{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);verified=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,fromB64(parts[2]),te.encode(parts[0]+'.'+parts[1]));}catch{throw Error('SIGNATURE_INVALID');}req(verified,'SIGNATURE_INVALID');
 req(payload&&['https://accounts.google.com','accounts.google.com'].includes(payload.iss),'ISSUER_INVALID');
 req(typeof clientId==='string'&&payload.aud===clientId,'AUDIENCE_INVALID');
 if(payload.azp!==undefined)req(payload.azp===clientId,'AZP_INVALID');
 req(typeof nonce==='string'&&eq(payload.nonce,nonce),'NONCE_INVALID');
 req(Number.isSafeInteger(payload.exp)&&payload.exp>now&&payload.exp<=now+7200,'EXP_INVALID');
 req(Number.isSafeInteger(payload.iat)&&payload.iat<=now+60&&payload.iat>=now-7200,'IAT_INVALID');
 if(payload.nbf!==undefined)req(Number.isSafeInteger(payload.nbf)&&payload.nbf<=now+60,'NBF_INVALID');
 req(typeof payload.sub==='string'&&payload.sub.length>=3&&payload.sub.length<=255,'SUB_INVALID');
 req(payload.email_verified===true&&typeof payload.email==='string'&&payload.email.length<=320,'EMAIL_INVALID');
 return {issuer:'https://accounts.google.com',subject:payload.sub,email:payload.email.toLowerCase()};
}
export function validEnvelope(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join(',')!=='cipher,format,iv,salt'||v.format!=='asia84-encrypted-v1')return false;
 const valid=s=>typeof s==='string'&&s.length%4===0&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s);
 if(!valid(v.salt)||v.salt.length!==24||!valid(v.iv)||v.iv.length!==16||!valid(v.cipher)||v.cipher.length<24||v.cipher.length>350000)return false;
 try{return atob(v.salt).length===16&&atob(v.iv).length===12&&atob(v.cipher).length>=16;}catch{return false;}
}
