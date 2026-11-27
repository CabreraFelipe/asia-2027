// Proposed encrypted Web Push registry; never mounted or connected to a sender.
// Allowed provider origins and non-extractable AES-GCM key come from trusted host configuration.
const enc=new TextEncoder(),check=(x,m)=>{if(!x)throw Error(m)};
const exact=(x,ks)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===ks.length&&ks.every(k=>Object.hasOwn(x,k));
const valid=s=>s?.ok===true&&s.syntheticOnly===false&&typeof s.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.deviceId==='string'&&/^dev_[a-f0-9]{32}$/.test(s.deviceId)&&typeof s.csrf==='string'&&s.csrf.length>=16;
const b64=x=>btoa(String.fromCharCode(...x)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const decode=(v,n)=>{check(typeof v==='string'&&/^[A-Za-z0-9_-]+$/.test(v)&&v.length<=100,'Clave inválida');const x=Uint8Array.from(atob(v.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));check(x.length===n&&b64(x)===v,'Clave inválida');return x};
const hash=async v=>b64(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(v))));
export async function normalizePushSubscription(input,origins){
 check(exact(input,['endpoint','keys'])&&exact(input.keys,['p256dh','auth']),'Suscripción inválida');
 check(typeof input.endpoint==='string'&&input.endpoint.length<=2048,'Destino inválido');
 const u=new URL(input.endpoint);
 check(u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&u.pathname!=='/'&&u.href===input.endpoint&&origins.includes(u.origin),'Destino no autorizado');
 const pk=decode(input.keys.p256dh,65);check(pk[0]===4,'Clave inválida');
 await crypto.subtle.importKey('raw',pk,{name:'ECDH',namedCurve:'P-256'},false,[]);
 decode(input.keys.auth,16);
 return {endpoint:u.href,keys:{p256dh:input.keys.p256dh,auth:input.keys.auth}};
}
export async function openPushRegistry({enabled=false,db,readSession,origins=[],key}={}){
 check(enabled===true&&typeof db?.prepare==='function'&&typeof readSession==='function'&&Array.isArray(origins)&&origins.length>0&&origins.every(o=>typeof o==='string'&&new URL(o).protocol==='https:'&&new URL(o).origin===o)&&key?.type==='secret'&&key.extractable===false&&key.algorithm?.name==='AES-GCM'&&key.algorithm.length===256&&key.usages.includes('encrypt'),'Registro no habilitado');
 const s=await readSession();check(valid(s),'Sesión inválida');
 const {accountId,deviceId,csrf}=s;const allowed=Object.freeze([...origins]);let closed=false,busy=false;
 async function verify(){check(!closed,'Registro cerrado');let f;try{f=await readSession()}catch{closed=true;throw Error('Sesión no verificable')}if(!valid(f)||f.accountId!==accountId||f.deviceId!==deviceId||f.csrf!==csrf){closed=true;throw Error('Cambió la sesión')}check(!closed,'Registro cerrado')}
 async function binding(){const r=await db.prepare('SELECT revoked FROM notification_devices_v12 WHERE account_id=? AND device_id=?').bind(accountId,deviceId).first();check(r?.revoked===0,'Dispositivo no autorizado')}
 async function enroll(input,consent){
  check(consent===true&&!closed&&!busy,'Consentimiento requerido');busy=true;let inserted=false,h;
  try{
   await verify();await binding();
   const normalized=await normalizePushSubscription(input,allowed),json=JSON.stringify(normalized);
   h=await hash(normalized.endpoint);
   const iv=crypto.getRandomValues(new Uint8Array(12));
   const aad=enc.encode(JSON.stringify(['asia-push-v12',accountId,deviceId,h]));
   const encrypted=b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,enc.encode(json))));
   await verify();await binding();
   // A device gets one endpoint; a revoked endpoint hash is never transferred or reused.
   const r=await db.prepare('INSERT INTO notification_push_v12(account_id,device_id,endpoint_hash,iv,ciphertext) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM notification_devices_v12 WHERE account_id=? AND device_id=? AND revoked=0) ON CONFLICT DO NOTHING').bind(accountId,deviceId,h,b64(iv),encrypted,accountId,deviceId).run();
   check(r?.success===true&&[0,1].includes(r.meta?.changes),'Registro no confirmado');inserted=r.meta.changes===1;
   check(inserted,'Suscripción ya registrada; requiere nueva vinculación para reemplazar');
   await verify();await binding();
   return {status:'registered-not-delivered'};
  }catch(e){if(inserted){await db.prepare('UPDATE notification_push_v12 SET iv=NULL,ciphertext=NULL WHERE account_id=? AND device_id=? AND endpoint_hash=?').bind(accountId,deviceId,h).run()}throw e}finally{busy=false}
 }
 await verify();await binding();return Object.freeze({enroll,close(){closed=true}});
}
