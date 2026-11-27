// Unmounted dispatch engine. Inject a trusted sender; no network or scheduler here.
// Durable at-most-once attempts: ambiguous failures are never silently retried.
import {normalizePushSubscription} from './notification-push-registry.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const un64=v=>Uint8Array.from(atob(v.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
const b64=x=>btoa(String.fromCharCode(...x)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const kinds=['weight','gym','diet','weekly','rest'];
const clock=t=>Number.isSafeInteger(t)&&t>=86400000;
const eligible=` FROM notification_queue_v12 q
 JOIN notification_devices_v12 d ON d.account_id=q.account_id AND d.device_id=q.device_id AND d.revoked=0
 JOIN notification_push_v12 p ON p.account_id=q.account_id AND p.device_id=q.device_id AND p.ciphertext IS NOT NULL
 JOIN json_each(q.events_json) e
 WHERE json_type(e.value,'$.due')='integer' AND json_extract(e.value,'$.due')<=?
 AND json_extract(e.value,'$.due')>?-CASE WHEN q.channel='rest' THEN 300000 ELSE 3600000 END
 AND ((q.channel='rest' AND json_extract(e.value,'$.kind')='rest') OR (q.channel='agenda' AND json_extract(e.value,'$.kind') IN ('weight','gym','diet','weekly')))`;
const fields=`q.account_id,q.device_id,q.channel,q.revision,json_extract(e.value,'$.kind') AS kind,json_extract(e.value,'$.due') AS due,p.endpoint_hash,p.iv,p.ciphertext`;
const match=` AND q.account_id=? AND q.device_id=? AND q.channel=? AND q.revision=? AND json_extract(e.value,'$.kind')=? AND json_extract(e.value,'$.due')=? AND p.endpoint_hash=?`;
const noClaim=` AND NOT EXISTS(SELECT 1 FROM notification_delivery_v12 l WHERE l.account_id=q.account_id AND l.device_id=q.device_id AND l.channel=q.channel AND l.kind=json_extract(e.value,'$.kind') AND l.due=json_extract(e.value,'$.due'))`;
const args=r=>[r.account_id,r.device_id,r.channel,r.revision,r.kind,r.due,r.endpoint_hash];
export async function dispatchNotificationBatch({enabled=false,db,key,origins=[],send,now=Date.now,max=20}={}){
 check(enabled===true&&typeof db?.prepare==='function'&&typeof send==='function'&&typeof now==='function'&&Number.isInteger(max)&&max>=1&&max<=100&&Array.isArray(origins)&&origins.length>0&&key?.type==='secret'&&key.extractable===false&&key.algorithm?.name==='AES-GCM'&&key.algorithm.length===256&&key.usages.includes('decrypt'),'Entrega no habilitada');
 const report={claimed:0,accepted:0,failed:0,skipped:0};
 for(let i=0;i<max;i++){
  const t=now();check(clock(t),'Reloj inválido');
  const row=await db.prepare('SELECT '+fields+eligible+noClaim+' ORDER BY due,q.account_id,q.device_id,q.channel,kind LIMIT 1').bind(t,t).first();
  if(!row)break;
  const claim=await db.prepare('INSERT INTO notification_delivery_v12(account_id,device_id,channel,kind,due,status) SELECT q.account_id,q.device_id,q.channel,json_extract(e.value,\'$.kind\'),json_extract(e.value,\'$.due\'),\'attempted\''+eligible+match+noClaim+' ON CONFLICT DO NOTHING').bind(t,t,...args(row)).run();
  check(claim?.success===true&&[0,1].includes(claim.meta?.changes),'Reserva no confirmada');
  if(!claim.meta.changes)continue;
  report.claimed++;let outcome='failed';
  try{
   const freshTime=now();check(clock(freshTime),'Reloj inválido');
   const current=await db.prepare('SELECT '+fields+eligible+match).bind(freshTime,freshTime,...args(row)).first();
   if(!current){outcome='skipped'}else{
    const aad=enc.encode(JSON.stringify(['asia-push-v12',row.account_id,row.device_id,row.endpoint_hash]));
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(current.iv),additionalData:aad},key,un64(current.ciphertext));
    const sub=await normalizePushSubscription(JSON.parse(dec.decode(plain)),origins);
    check(b64(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(sub.endpoint))))===row.endpoint_hash,'Destino alterado');
    // Recheck the exact revision and revocation immediately before the external call.
    const finalTime=now();check(clock(finalTime),'Reloj inválido');
    const latest=await db.prepare('SELECT '+fields+eligible+match).bind(finalTime,finalTime,...args(row)).first();
    if(!latest||latest.ciphertext!==current.ciphertext||latest.iv!==current.iv){outcome='skipped'}else{
     check(kinds.includes(row.kind),'Aviso inválido');
     // Generic payload: no health, food, account or diary data on the lock screen.
     const result=await send(sub,{version:1,kind:row.kind,due:row.due});
     outcome=result?.accepted===true?'accepted':'failed';
    }
   }
  }catch{outcome='failed'}
  const done=await db.prepare("UPDATE notification_delivery_v12 SET status=? WHERE account_id=? AND device_id=? AND channel=? AND kind=? AND due=? AND status='attempted'").bind(outcome,row.account_id,row.device_id,row.channel,row.kind,row.due).run();
  check(done?.success===true&&done.meta?.changes===1,'Resultado no confirmado');
  report[outcome]++;
 }
 return report;
}
