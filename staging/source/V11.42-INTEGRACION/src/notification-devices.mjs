// Proposed lifecycle, unmounted. Only a trusted host can issue or revoke a binding.
// A device ID is not a credential. The host must persist it in a verified session;
// it must serialize enrollment and revoke a previous binding before account switching.
const account=x=>typeof x==='string'&&/^acct_[a-f0-9]{32}$/.test(x);
const device=x=>typeof x==='string'&&/^dev_[a-f0-9]{32}$/.test(x);
const valid=s=>s?.ok===true&&s.syntheticOnly===false&&account(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>=16&&(s.deviceId===null||device(s.deviceId));
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const same=(a,b)=>valid(b)&&a.accountId===b.accountId&&a.deviceId===b.deviceId&&a.csrf===b.csrf;
export async function openNotificationDevices({enabled=false,db,readSession}={}){
 check(enabled===true&&typeof db?.prepare==='function'&&typeof readSession==='function','Dispositivos no habilitados');
 const s=await readSession();check(valid(s),'Sesión inválida');
 const identity=Object.freeze({accountId:s.accountId,deviceId:s.deviceId,csrf:s.csrf});
 let closed=false,busy=false;
 async function verify(){check(!closed,'Servicio cerrado');let fresh;try{fresh=await readSession()}catch{closed=true;throw Error('No se pudo verificar sesión')}if(!same(identity,fresh)){closed=true;throw Error('Cambió la sesión')}check(!closed,'Servicio cerrado')}
 async function revokeBinding(id){
  const r=await db.prepare('UPDATE notification_devices_v12 SET revoked=1 WHERE account_id=? AND device_id=? AND revoked=0').bind(identity.accountId,id).run();
  check(r?.success===true&&[0,1].includes(r.meta?.changes),'Revocación no confirmada');
  const row=await db.prepare('SELECT revoked FROM notification_devices_v12 WHERE account_id=? AND device_id=?').bind(identity.accountId,id).first();
  check(row?.revoked===1,'Dispositivo no autorizado');
 }
 async function enroll(consent){
  check(consent===true&&identity.deviceId===null&&!closed&&!busy,'Consentimiento o vinculación inválidos');
  busy=true;
  let id,inserted=false;
  try{
   await verify();
   id='dev_'+Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
   const r=await db.prepare('INSERT INTO notification_devices_v12(device_id,account_id) VALUES(?,?)').bind(id,identity.accountId).run();
   check(r?.success===true&&r.meta?.changes===1,'Vinculación no confirmada');inserted=true;
   await verify();closed=true;
   return {deviceId:id,status:'binding-issued-not-subscribed'};
  }catch(e){closed=true;if(inserted)await revokeBinding(id);throw e}finally{busy=false}
 }
 async function revoke(){
  check(device(identity.deviceId)&&!closed&&!busy,'Vinculación inválida');
  busy=true;try{await verify();await revokeBinding(identity.deviceId);await verify();return {status:'revoked'}}finally{busy=false}
 }
 await verify();
 return Object.freeze({enroll,revoke,close(){closed=true}});
}
