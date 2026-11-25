// V11.6 OFFLINE ONLY: synthetic health archives, per-device consents, inert push scheduling.
// No Apple Health/Health Connect integrations, actual subscriptions, notification sends or web fetch.
import {checkOperator110,json,emptyBody110} from './guard.mjs';
import {verifyAuthDb111,sessionOwner112} from './auth111.mjs';
import {DEVICE_RE116,REMINDER_RE116,HEALTH_FORMAT116,PUSH_FORMAT116,validateEnvelope116} from './wellness116-client.mjs';
const ROOT='/v11/wellness';
const common={ok:true,version:'11.6-lab',syntheticOnly:true,notificationDelivery:false,healthProviderConnected:false};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(o,keys)=>plain(o)&&Object.keys(o).sort().join('|')===keys.slice().sort().join('|');
const next=(name,pattern)=>name.match(pattern);
const live=`EXISTS (SELECT 1 FROM auth_sessions_v111 s WHERE s.token_digest=? AND s.account_id=? AND s.expires_at>?)`;
async function parsed(req,max=300000){
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers.get('Content-Type')||''))return {error:415};
 const len=req.headers.get('Content-Length');if(len!==null&&(!/^\d+$/.test(len)||+len>max))return {error:413};
 if(!req.body)return {error:400};
 const reader=req.body.getReader(),parts=[];let size=0;
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();return {error:413};}parts.push(value);}
  if(size===0)return {error:400};
  const buf=new Uint8Array(size);let pos=0;for(const p of parts){buf.set(p,pos);pos+=p.length;}
  return {value:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buf))};
 }catch{return {error:400};}finally{try{reader.releaseLock();}catch{}}
}
async function verified(env){
 if(!await verifyAuthDb111(env))return false;
 try{const r=await env.STAGING_DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();const names=new Set((r.results||[]).map(x=>x.name));return ['wellness_devices_v116','wellness_health_v116','wellness_push_v116','wellness_reminders_v116'].every(t=>names.has(t));}catch{return false;}
}
function locate(path){
 if(path===ROOT+'/devices')return {kind:'devices',methods:['GET','POST']};
 let m=next(path,/^\/v11\/wellness\/devices\/(dev_[a-f0-9]{32})$/);
 if(m)return {kind:'device-delete',deviceId:m[1],methods:['DELETE']};
 m=next(path,/^\/v11\/wellness\/devices\/(dev_[a-f0-9]{32})\/consent$/);
 if(m)return {kind:'consent',deviceId:m[1],methods:['POST']};
 if(path===ROOT+'/health')return {kind:'health-write',methods:['POST']};
 m=next(path,/^\/v11\/wellness\/health\/(dev_[a-f0-9]{32})$/);
 if(m)return {kind:'health-list',deviceId:m[1],methods:['GET']};
 m=next(path,/^\/v11\/wellness\/health\/(dev_[a-f0-9]{32})\/(10|[1-9])$/);
 if(m)return {kind:'health-revision',deviceId:m[1],revision:+m[2],methods:['GET']};
 m=next(path,/^\/v11\/wellness\/health\/(dev_[a-f0-9]{32})\/purge$/);
 if(m)return {kind:'health-purge',deviceId:m[1],methods:['POST']};
 m=next(path,/^\/v11\/wellness\/push\/(dev_[a-f0-9]{32})$/);
 if(m)return {kind:'push',deviceId:m[1],methods:['GET','PUT','DELETE']};
 if(path===ROOT+'/reminders')return {kind:'reminders',methods:['GET','POST']};
 m=next(path,/^\/v11\/wellness\/reminders\/(dev_[a-f0-9]{32})\/(rem_[a-f0-9]{24})$/);
 if(m)return {kind:'reminder-delete',deviceId:m[1],reminderId:m[2],methods:['DELETE']};
 return null;
}
const invalid=()=>json({ok:false,error:'Datos sintéticos inválidos'},400);
const forbidden=()=>json({ok:false,error:'Permiso de dispositivo no habilitado'},403);
const missing=()=>json({ok:false,error:'Dispositivo o recurso no encontrado'},404);
const conflict=()=>json({ok:false,error:'Versión, límite o recurso en conflicto'},409);
const isInt=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
function safeIso(){return new Date().toISOString();}
async function device(db,owner,id){return db.prepare('SELECT device_id,platform,health_enabled,push_enabled,consent_version FROM wellness_devices_v116 WHERE account_id=? AND device_id=?').bind(owner.account_id,id).first();}
const fmtDevice=x=>({deviceId:x.device_id,platform:x.platform,healthImport:x.health_enabled===1,pushReminders:x.push_enabled===1,consentVersion:x.consent_version});
export async function wellnessRoute116(req,env){
 const denied=await checkOperator110(req,env,'STAGING_API_TOKEN');if(denied)return denied;
 const url=new URL(req.url);
 if(url.search||['X-Asia-Account','X-Account-ID','X-User-ID','X-Device-Owner'].some(x=>req.headers.has(x)))return json({ok:false,error:'No se admiten identidades o parámetros de cliente'},400);
 const route=locate(url.pathname);if(!route)return missing();
 if(!route.methods.includes(req.method))return json({ok:false,error:'Método no admitido'},405,{Allow:route.methods.join(', ')});
 if(!await verified(env))return json({ok:false,error:'Laboratorio Salud no configurado'},503);
 try{
  const owner=await sessionOwner112(req,env);if(!owner)return json({ok:false,error:'Sesión inválida o revocada'},401);
  const db=env.STAGING_DB;
  if(req.method==='GET'||req.method==='DELETE'){
   if(!await emptyBody110(req))return invalid();
   if(route.kind==='devices'){
    const rows=(await db.prepare('SELECT device_id,platform,health_enabled,push_enabled,consent_version FROM wellness_devices_v116 WHERE account_id=? ORDER BY device_id').bind(owner.account_id).all()).results||[];
    return json({...common,devices:rows.map(fmtDevice)});
   }
   if(route.kind==='health-list'){
    if(!await device(db,owner,route.deviceId))return missing();
    const rows=(await db.prepare('SELECT revision,created_at FROM wellness_health_v116 WHERE account_id=? AND device_id=? ORDER BY revision DESC').bind(owner.account_id,route.deviceId).all()).results||[];
    return json({...common,deviceId:route.deviceId,head:rows[0]?.revision||0,versions:rows});
   }
   if(route.kind==='health-revision'){
    const row=await db.prepare('SELECT revision,envelope,created_at FROM wellness_health_v116 WHERE account_id=? AND device_id=? AND revision=?').bind(owner.account_id,route.deviceId,route.revision).first();
    if(!row)return missing();
    let envelope;try{envelope=JSON.parse(row.envelope);}catch{return json({ok:false,error:'Sobre dañado'},503);}
    if(!validateEnvelope116(envelope,HEALTH_FORMAT116))return json({ok:false,error:'Sobre dañado'},503);
    return json({...common,deviceId:route.deviceId,revision:row.revision,createdAt:row.created_at,envelope});
   }
   if(route.kind==='push'&&req.method==='GET'){
    const row=await db.prepare('SELECT endpoint_fingerprint,envelope FROM wellness_push_v116 WHERE account_id=? AND device_id=?').bind(owner.account_id,route.deviceId).first();
    if(!row)return missing();
    let envelope;try{envelope=JSON.parse(row.envelope);}catch{return json({ok:false,error:'Sobre dañado'},503);}
    if(!validateEnvelope116(envelope,PUSH_FORMAT116))return json({ok:false,error:'Sobre dañado'},503);
    return json({...common,deviceId:route.deviceId,fingerprint:row.endpoint_fingerprint,envelope});
   }
   if(route.kind==='reminders'&&req.method==='GET'){
    const rows=(await db.prepare('SELECT device_id,reminder_id,kind,due_at FROM wellness_reminders_v116 WHERE account_id=? ORDER BY due_at,device_id LIMIT 48').bind(owner.account_id).all()).results||[];
    return json({...common,reminders:rows.map(x=>({deviceId:x.device_id,reminderId:x.reminder_id,kind:x.kind,dueAt:x.due_at}))});
   }
   if(route.kind==='device-delete'){
    const deleted=await db.prepare(`DELETE FROM wellness_devices_v116 WHERE account_id=? AND device_id=? AND ${live} RETURNING device_id`).bind(owner.account_id,route.deviceId,owner.digest,owner.account_id,Date.now()).first();
    if(!deleted)return missing();return json({...common,deleted:true,purgedDeviceData:true});
   }
   if(route.kind==='push'&&req.method==='DELETE'){
    if(!await device(db,owner,route.deviceId))return missing();
    // Atomic cancellation: no real push sends exist and both rows disappear together.
    await db.batch([
     db.prepare(`DELETE FROM wellness_reminders_v116 WHERE account_id=? AND device_id=? AND ${live}`).bind(owner.account_id,route.deviceId,owner.digest,owner.account_id,Date.now()),
     db.prepare(`DELETE FROM wellness_push_v116 WHERE account_id=? AND device_id=? AND ${live}`).bind(owner.account_id,route.deviceId,owner.digest,owner.account_id,Date.now())
    ]);
    return json({...common,deleted:true,pendingCancelled:true});
   }
   if(route.kind==='reminder-delete'){
    const row=await db.prepare(`DELETE FROM wellness_reminders_v116 WHERE account_id=? AND device_id=? AND reminder_id=? AND ${live} RETURNING reminder_id`).bind(owner.account_id,route.deviceId,route.reminderId,owner.digest,owner.account_id,Date.now()).first();
    if(!row)return missing();return json({...common,cancelled:true});
   }
   return missing();
  }
  const payload=await parsed(req);
  if(payload.error)return json({ok:false,error:'Solicitud JSON inválida'},payload.error);
  const v=payload.value;
  if(route.kind==='devices'){
   if(!exact(v,['deviceId','platform'])||!DEVICE_RE116.test(v.deviceId)||!['iphone','android','desktop','simulator'].includes(v.platform))return invalid();
   const row=await db.prepare(`INSERT INTO wellness_devices_v116(account_id,device_id,platform,created_at) SELECT ?,?,?,? WHERE ${live} AND (SELECT count(*) FROM wellness_devices_v116 WHERE account_id=?)<4 ON CONFLICT(account_id,device_id) DO NOTHING RETURNING device_id`).bind(owner.account_id,v.deviceId,v.platform,safeIso(),owner.digest,owner.account_id,Date.now(),owner.account_id).first();
   if(!row)return conflict();return json({...common,deviceId:v.deviceId,healthImport:false,pushReminders:false,consentVersion:1},201);
  }
  if(route.kind==='consent'){
   if(!exact(v,['healthImport','pushReminders','expectedVersion'])||typeof v.healthImport!=='boolean'||typeof v.pushReminders!=='boolean'||!isInt(v.expectedVersion,1,1000))return invalid();
   if(!await device(db,owner,route.deviceId))return missing();
   // D1/SQLite batch is transactional. Revoking push removes subscription and reminders atomically.
   const consentResults=await db.batch([
    db.prepare(`UPDATE wellness_devices_v116 SET health_enabled=?,push_enabled=?,consent_version=consent_version+1 WHERE account_id=? AND device_id=? AND consent_version=? AND ${live}`).bind(+v.healthImport,+v.pushReminders,owner.account_id,route.deviceId,v.expectedVersion,owner.digest,owner.account_id,Date.now()),
    db.prepare(`DELETE FROM wellness_reminders_v116 WHERE account_id=? AND device_id=? AND EXISTS (SELECT 1 FROM wellness_devices_v116 d WHERE d.account_id=? AND d.device_id=? AND d.push_enabled=0)`).bind(owner.account_id,route.deviceId,owner.account_id,route.deviceId),
    db.prepare(`DELETE FROM wellness_push_v116 WHERE account_id=? AND device_id=? AND EXISTS (SELECT 1 FROM wellness_devices_v116 d WHERE d.account_id=? AND d.device_id=? AND d.push_enabled=0)`).bind(owner.account_id,route.deviceId,owner.account_id,route.deviceId)
   ]);
   if(consentResults[0]?.meta?.changes!==1)return conflict();
   const now=await device(db,owner,route.deviceId);
   if(!now)return missing();
   return json({...common,device:fmtDevice(now)});
  }
  if(route.kind==='health-write'){
   if(!exact(v,['deviceId','expectedRevision','envelope'])||!DEVICE_RE116.test(v.deviceId)||!isInt(v.expectedRevision,0,9)||!validateEnvelope116(v.envelope,HEALTH_FORMAT116))return invalid();
   const d=await device(db,owner,v.deviceId);if(!d)return missing();if(d.health_enabled!==1)return forbidden();
   const row=await db.prepare(`INSERT INTO wellness_health_v116(account_id,device_id,revision,envelope,created_at) SELECT ?,?,?,?,? WHERE ${live} AND EXISTS (SELECT 1 FROM wellness_devices_v116 WHERE account_id=? AND device_id=? AND health_enabled=1) AND COALESCE((SELECT MAX(revision) FROM wellness_health_v116 WHERE account_id=? AND device_id=?),0)=? RETURNING revision`).bind(owner.account_id,v.deviceId,v.expectedRevision+1,JSON.stringify(v.envelope),safeIso(),owner.digest,owner.account_id,Date.now(),owner.account_id,v.deviceId,owner.account_id,v.deviceId,v.expectedRevision).first();
   if(!row)return conflict();return json({...common,deviceId:v.deviceId,revision:row.revision},201);
  }
  if(route.kind==='health-purge'){
   if(!exact(v,['confirm'])||v.confirm!=='DELETE_ALL_SYNTHETIC_HEALTH')return invalid();
   if(!await device(db,owner,route.deviceId))return missing();
   const r=await db.prepare(`DELETE FROM wellness_health_v116 WHERE account_id=? AND device_id=? AND ${live}`).bind(owner.account_id,route.deviceId,owner.digest,owner.account_id,Date.now()).run();
   return json({...common,purged:true,deletedRevisions:r.meta.changes});
  }
  if(route.kind==='push'&&req.method==='PUT'){
   if(!exact(v,['fingerprint','envelope'])||typeof v.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(v.fingerprint)||!validateEnvelope116(v.envelope,PUSH_FORMAT116))return invalid();
   const d=await device(db,owner,route.deviceId);if(!d)return missing();if(d.push_enabled!==1)return forbidden();
   const row=await db.prepare(`INSERT INTO wellness_push_v116(account_id,device_id,endpoint_fingerprint,envelope,created_at) SELECT ?,?,?,?,? WHERE ${live} AND EXISTS(SELECT 1 FROM wellness_devices_v116 WHERE account_id=? AND device_id=? AND push_enabled=1) ON CONFLICT(account_id,device_id) DO UPDATE SET endpoint_fingerprint=excluded.endpoint_fingerprint,envelope=excluded.envelope,created_at=excluded.created_at RETURNING device_id`).bind(owner.account_id,route.deviceId,v.fingerprint,JSON.stringify(v.envelope),safeIso(),owner.digest,owner.account_id,Date.now(),owner.account_id,route.deviceId).first();
   if(!row)return conflict();return json({...common,registered:true,deviceId:route.deviceId},201);
  }
  if(route.kind==='reminders'&&req.method==='POST'){
   if(!exact(v,['deviceId','reminderId','kind','dueAt'])||!DEVICE_RE116.test(v.deviceId)||!REMINDER_RE116.test(v.reminderId)||!['checkin','training','hydration','weekly'].includes(v.kind)||!isInt(v.dueAt,1,9999999999999))return invalid();
   const now=Date.now();if(v.dueAt<now+60000||v.dueAt>now+30*86400000)return invalid();
   const d=await device(db,owner,v.deviceId);if(!d)return missing();if(d.push_enabled!==1)return forbidden();
   const old=await db.prepare('SELECT kind,due_at FROM wellness_reminders_v116 WHERE account_id=? AND device_id=? AND reminder_id=?').bind(owner.account_id,v.deviceId,v.reminderId).first();
   if(old)return old.kind===v.kind&&old.due_at===v.dueAt?json({...common,scheduled:true,replayed:true}):conflict();
   const row=await db.prepare(`INSERT INTO wellness_reminders_v116(account_id,device_id,reminder_id,kind,due_at,created_at) SELECT ?,?,?,?,?,? WHERE ${live} AND EXISTS(SELECT 1 FROM wellness_devices_v116 d JOIN wellness_push_v116 p ON d.account_id=p.account_id AND d.device_id=p.device_id WHERE d.account_id=? AND d.device_id=? AND d.push_enabled=1) AND (SELECT COUNT(*) FROM wellness_reminders_v116 WHERE account_id=? AND device_id=?)<12 ON CONFLICT(account_id,device_id,reminder_id) DO NOTHING RETURNING reminder_id`).bind(owner.account_id,v.deviceId,v.reminderId,v.kind,v.dueAt,safeIso(),owner.digest,owner.account_id,Date.now(),owner.account_id,v.deviceId,owner.account_id,v.deviceId).first();
   if(!row){const prior=await db.prepare('SELECT kind,due_at FROM wellness_reminders_v116 WHERE account_id=? AND device_id=? AND reminder_id=?').bind(owner.account_id,v.deviceId,v.reminderId).first();if(prior&&prior.kind===v.kind&&prior.due_at===v.dueAt)return json({...common,scheduled:true,replayed:true});return conflict();}
   return json({...common,scheduled:true,replayed:false},201);
  }
  return missing();
 }catch{return json({ok:false,error:'Fallo del laboratorio Salud'},503);}
}
