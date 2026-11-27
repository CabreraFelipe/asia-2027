// Proposed Web Push sender for trusted runtime (RFC 8291/8292). Not mounted.
// Only explicit provider origins, no redirects or response bodies, independent VAPID keys.
import {normalizePushSubscription} from './notification-push-registry.mjs';
const enc=new TextEncoder(),check=(v,m)=>{if(!v)throw Error(m)};
const b64=v=>btoa(String.fromCharCode(...v)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const un64=v=>Uint8Array.from(atob(v.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
const cat=(...parts)=>{const r=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let i=0;for(const p of parts){r.set(p,i);i+=p.length}return r};
const info=s=>cat(enc.encode(s),Uint8Array.of(0));
const hkdf=async(ikm,salt,info,length)=>new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},await crypto.subtle.importKey('raw',ikm,'HKDF',false,['deriveBits']),length*8));
const exact=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const kinds=['weight','gym','diet','weekly','rest'];
export async function encryptWebPush(sub,plain){
 const ua=un64(sub.keys.p256dh),auth=un64(sub.keys.auth);
 const peer=await crypto.subtle.importKey('raw',ua,{name:'ECDH',namedCurve:'P-256'},false,[]);
 const ephemeral=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);
 const pub=new Uint8Array(await crypto.subtle.exportKey('raw',ephemeral.publicKey));
 const shared=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:peer},ephemeral.privateKey,256));
 const ikm=await hkdf(shared,auth,cat(info('WebPush: info'),ua,pub),32);
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const cek=await hkdf(ikm,salt,info('Content-Encoding: aes128gcm'),16),nonce=await hkdf(ikm,salt,info('Content-Encoding: nonce'),12);
 const aes=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
 const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},aes,cat(plain,Uint8Array.of(2))));
 const header=new Uint8Array(21);header.set(salt);new DataView(header.buffer).setUint32(16,4096);header[20]=pub.length;
 return cat(header,pub,ciphertext);
}
export async function createWebPushSender({enabled=false,origins=[],privateKey,publicKey,subject,fetcher,now=Date.now}={}){
 check(enabled===true&&typeof fetcher==='function'&&typeof now==='function'&&Array.isArray(origins)&&origins.length>0&&origins.every(o=>typeof o==='string'&&new URL(o).protocol==='https:'&&new URL(o).origin===o),'Proveedor deshabilitado');
 check(privateKey?.type==='private'&&privateKey.extractable===false&&privateKey.algorithm?.name==='ECDSA'&&privateKey.algorithm.namedCurve==='P-256'&&privateKey.usages.includes('sign')&&publicKey?.type==='public'&&publicKey.algorithm?.name==='ECDSA'&&publicKey.algorithm.namedCurve==='P-256','Claves VAPID inválidas');
 check(typeof subject==='string'&&subject.length<=256&&/^(mailto:[^\s@]+@[^\s@]+|https:\/\/[^\s]+)$/.test(subject),'Contacto VAPID inválido');
 const pub=new Uint8Array(await crypto.subtle.exportKey('raw',publicKey)),key=b64(pub);
 const proof=crypto.getRandomValues(new Uint8Array(32)),signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},privateKey,proof);
 check(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},publicKey,signature,proof),'Par VAPID inválido');
 const allowed=Object.freeze([...origins]);
 return async function send(input,payload){
  const t=now();check(Number.isSafeInteger(t)&&t>=86400000&&exact(payload,['version','kind','due'])&&payload.version===1&&kinds.includes(payload.kind)&&Number.isSafeInteger(payload.due)&&payload.due<=t,'Aviso inválido');
  const ttl=Math.floor((payload.due+(payload.kind==='rest'?300000:3600000)-t)/1000);
  if(ttl<1)return {accepted:false,status:'expired'};
  const sub=await normalizePushSubscription(input,allowed),aud=new URL(sub.endpoint).origin;
  const unsigned=b64(enc.encode(JSON.stringify({typ:'JWT',alg:'ES256'})))+'.'+b64(enc.encode(JSON.stringify({aud,exp:Math.floor(t/1000)+3600,sub:subject})));
  const sig=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},privateKey,enc.encode(unsigned)));check(sig.length===64,'Firma VAPID inválida');
  const body=await encryptWebPush(sub,enc.encode(JSON.stringify(payload)));
  check(body.length<=4096,'Mensaje demasiado grande');
  const remaining=Math.min(ttl,Math.floor((payload.due+(payload.kind==='rest'?300000:3600000)-now())/1000));if(remaining<1)return {accepted:false,status:'expired'};
  const r=await fetcher(sub.endpoint,{method:'POST',redirect:'error',headers:{Authorization:'vapid t='+unsigned+'.'+b64(sig)+', k='+key,'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',TTL:String(remaining),Urgency:payload.kind==='rest'?'high':'normal'},body});
  try{await r.body?.cancel()}catch{}
  return {accepted:r.status===201||r.status===202,status:r.status===404||r.status===410?'gone':r.status===201||r.status===202?'accepted':'rejected'};
 };
}
