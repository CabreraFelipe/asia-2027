// Unmounted queue storage. No credentials, push delivery, or implicit enrollment.
const check=(x,m)=>{if(!x)throw Error(m)},int=(x,a,b)=>Number.isSafeInteger(x)&&x>=a&&x<=b,exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const id=x=>typeof x==='string'&&/^acct_[a-f0-9]{32}$/.test(x),device=x=>typeof x==='string'&&/^dev_[a-f0-9]{32}$/.test(x),channels=['agenda','rest'],day=86400000;
const valid=s=>s?.ok===true&&s.syntheticOnly===false&&id(s.accountId)&&device(s.deviceId)&&typeof s.csrf==='string'&&s.csrf.length>=16;
export function normalizeNotificationEvents(channel,events,now){
 check(channels.includes(channel)&&int(now,day,Number.MAX_SAFE_INTEGER-15*day)&&Array.isArray(events)&&events.length<=(channel==='rest'?1:56),'Agenda inválida');
 const seen=new Set(),allowed=channel==='rest'?['rest']:['weight','gym','diet','weekly'],horizon=channel==='rest'?2*3600000:14*day;
 return events.map(e=>{check(exact(e,['kind','due'])&&allowed.includes(e.kind)&&int(e.due,now+1,now+horizon),'Aviso inválido o vencido');const k=e.kind+':'+e.due;check(!seen.has(k),'Aviso duplicado');seen.add(k);return {kind:e.kind,due:e.due}}).sort((a,b)=>a.due-b.due||a.kind.localeCompare(b.kind));
}
export async function openNotificationQueue({enabled=false,db,readSession,now=Date.now}={}){
 check(enabled===true&&typeof db?.prepare==='function'&&typeof readSession==='function'&&typeof now==='function','Notificaciones no habilitadas');
 const identity=await readSession();check(valid(identity),'Sesión de avisos inválida');
 const {accountId,deviceId,csrf}=identity;let closed=false;
 async function verify(){check(!closed,'Servicio cerrado');let s;try{s=await readSession()}catch{closed=true;throw Error('No se pudo verificar la sesión de avisos')}if(!valid(s)||s.accountId!==accountId||s.deviceId!==deviceId||s.csrf!==csrf){closed=true;throw Error('Cambió la sesión de avisos')}check(!closed,'Servicio cerrado');}
 async function binding(){const b=await db.prepare('SELECT 1 AS active FROM notification_devices_v12 WHERE account_id=? AND device_id=? AND revoked=0').bind(accountId,deviceId).first();check(b?.active===1,'Dispositivo no autorizado o revocado');}
 async function read(channel){check(channels.includes(channel),'Canal inválido');await verify();await binding();const r=await db.prepare('SELECT revision,events_json FROM notification_queue_v12 WHERE account_id=? AND device_id=? AND channel=?').bind(accountId,deviceId,channel).first();await verify();await binding();const t=now();return {revision:r?.revision??0,events:r?JSON.parse(r.events_json).filter(e=>e.due>t):[]};}
 async function replace(channel,expected,events){
  check(channels.includes(channel)&&int(expected,0,Number.MAX_SAFE_INTEGER-1),'Revisión inválida');const normalized=normalizeNotificationEvents(channel,events,now()),json=JSON.stringify(normalized),next=expected+1;
  await verify();await binding();
  // Atomic compare-and-swap and revocation check in the write statement, including first insert.
  const q=await db.prepare("INSERT INTO notification_queue_v12(account_id,device_id,channel,revision,events_json) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM notification_devices_v12 WHERE account_id=? AND device_id=? AND revoked=0) AND (?=0 OR EXISTS(SELECT 1 FROM notification_queue_v12 WHERE account_id=? AND device_id=? AND channel=? AND revision=?)) ON CONFLICT(account_id,device_id,channel) DO UPDATE SET revision=excluded.revision,events_json=excluded.events_json WHERE notification_queue_v12.revision=?").bind(accountId,deviceId,channel,next,json,accountId,deviceId,expected,accountId,deviceId,channel,expected,expected).run();
  check(q?.success===true&&[0,1].includes(q.meta?.changes),'Guardado de avisos no confirmado');
  await verify();await binding();
  if(q.meta.changes===0){const existing=await db.prepare('SELECT revision,events_json FROM notification_queue_v12 WHERE account_id=? AND device_id=? AND channel=?').bind(accountId,deviceId,channel).first();await verify();await binding();check(existing?.revision===next&&existing.events_json===json,'Conflicto de agenda; revisá nuevamente');}
  return {revision:next,events:normalized,status:'stored-not-delivered'};
 }
 await verify();await binding();return Object.freeze({read,replace,close(){closed=true}});
}
