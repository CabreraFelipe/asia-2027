// V11.1 CF compatibility patch: synthetic credentials ONLY, no human passwords.
// PBKDF2 600000 fails at Cloudflare Workers runtime limit of 100000.
// Instead use 256-bit server-generated random test keys HMAC'd with an operator-only pepper.
// This is NOT password hashing and MUST NOT authenticate real people.
const enc=new TextEncoder();
export const b64u111=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export function un64u111(s){if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s))throw Error('bad encoding');return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),x=>x.charCodeAt(0));}
export const fresh111=n=>crypto.getRandomValues(new Uint8Array(n));
export function fixedEqual111(a,b){if(!(a instanceof Uint8Array)||!(b instanceof Uint8Array)||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;}
export function validPepper111(s){if(typeof s!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(s))return false;try{return un64u111(s).length===32;}catch{return false;}}
export async function digest111(pepper,domain,text){
 if(!validPepper111(pepper))throw Error('crypto configuration invalid');
 const key=await crypto.subtle.importKey('raw',un64u111(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(domain+'\0'+text)));
}
export const hex111=bytes=>[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
export const freshTestKey111=()=> 'aslab_'+b64u111(fresh111(32));
export function validTestKey111(key){
 if(typeof key!=='string'||!/^aslab_[A-Za-z0-9_-]{43}$/.test(key))return false;
 try{return un64u111(key.slice(6)).length===32;}catch{return false;}
}
export async function testKeyDigest111(pepper,salt,key){
 if(!validTestKey111(key)||typeof salt!=='string'||!/^[A-Za-z0-9_-]{22}$/.test(salt)||un64u111(salt).length!==16)throw Error('invalid test key or salt');
 return hex111(await digest111(pepper,'test-key:v111b',salt+'\0'+key));
}
