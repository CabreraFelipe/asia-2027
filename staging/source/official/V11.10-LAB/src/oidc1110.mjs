// V11.10: generic, dependency-free OIDC ID-token verification helpers.
// Production requires a reviewed OIDC client, trusted provider configuration, and HTTPS.
import {createHash,createPublicKey,verify,randomBytes,timingSafeEqual} from 'node:crypto';
export const CLIENT_ID='asia-v1110-lab-client';
export const b64url=b=>Buffer.from(b).toString('base64url');
export const random=()=>randomBytes(32).toString('base64url');
export const challenge=verifier=>b64url(createHash('sha256').update(verifier).digest());
export const hashToken=token=>createHash('sha256').update(token).digest('hex');
export const accountId=(iss,sub)=>'acct_'+b64url(createHash('sha256').update(iss+'\0'+sub).digest()).slice(0,30);
const isB64url=s=>typeof s==='string'&&/^[A-Za-z0-9_-]+$/.test(s);
export function safeEqual(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);}
export function strictClaims(idToken,{issuer,audience,nonce,jwks,now=Math.floor(Date.now()/1000)}={}){
 if(typeof idToken!=='string'||idToken.length>12000)throw Error('ID_TOKEN_INVALID');
 const parts=idToken.split('.');if(parts.length!==3||parts.some(s=>!isB64url(s)))throw Error('ID_TOKEN_INVALID');
 let header,claims;
 try{header=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));}catch{throw Error('ID_TOKEN_INVALID');}
 if(!header||header.alg!=='RS256'||header.typ!=='JWT'||!isB64url(header.kid)||!claims||typeof claims!=='object')throw Error('ID_TOKEN_INVALID');
 if(!jwks||!Array.isArray(jwks.keys)||jwks.keys.length>12)throw Error('JWKS_INVALID');
 const keys=jwks.keys.filter(k=>k.kid===header.kid&&k.kty==='RSA'&&k.alg==='RS256'&&k.use==='sig'&&typeof k.n==='string'&&typeof k.e==='string');
 if(keys.length!==1)throw Error('JWKS_KEY_INVALID');
 let authentic=false;
 try{const publicKey=createPublicKey({key:keys[0],format:'jwk'});authentic=verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),publicKey,Buffer.from(parts[2],'base64url'));}catch{throw Error('SIGNATURE_INVALID');}
 if(!authentic)throw Error('SIGNATURE_INVALID');
 if(typeof issuer!=='string'||claims.iss!==issuer)throw Error('ISSUER_INVALID');
 if(typeof audience!=='string'||!safeEqual(claims.aud,audience)||typeof claims.aud!=='string')throw Error('AUDIENCE_INVALID');
 if(typeof nonce!=='string'||!safeEqual(claims.nonce,nonce))throw Error('NONCE_INVALID');
 if(!Number.isSafeInteger(claims.exp)||claims.exp<=now||claims.exp>now+3600)throw Error('EXP_INVALID');
 if(!Number.isSafeInteger(claims.iat)||claims.iat>now+60||claims.iat<now-3600)throw Error('IAT_INVALID');
 if(!Number.isSafeInteger(claims.auth_time)||claims.auth_time>now+60||claims.auth_time<now-600)throw Error('AUTH_TIME_INVALID');
 if(typeof claims.sub!=='string'||!/^[a-z0-9][a-z0-9_-]{3,63}$/.test(claims.sub))throw Error('SUB_INVALID');
 return Object.freeze({id:accountId(issuer,claims.sub),issuer,subject:claims.sub});
}
export function makeAuthorizeUrl({base,clientId=CLIENT_ID,redirectUri,state,nonce,verifier}){
 if(!base||!state||!nonce||!verifier||verifier.length<43||verifier.length>128)throw Error('AUTH_REQUEST_INVALID');
 const url=new URL('authorize',base);url.searchParams.set('client_id',clientId);url.searchParams.set('redirect_uri',redirectUri);url.searchParams.set('response_type','code');url.searchParams.set('scope','openid');url.searchParams.set('state',state);url.searchParams.set('nonce',nonce);url.searchParams.set('code_challenge',challenge(verifier));url.searchParams.set('code_challenge_method','S256');return url.toString();
}
