// A single INSERT statement is the atomic cost-reservation boundary in D1.
// Charge a slot before upstream work, never refund a failed/ambiguous call.
// No automatic retry or retention cleanup; proposed retention policy required before production.
export const requestId1186=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(x);
const integer=(v,a,b)=>Number.isSafeInteger(v)&&v>=a&&v<=b;
export function createCoachQuota1186({db,now=Date.now,perMinute=2,perDay=20,globalPerDay=200}){
 if(typeof db?.prepare!=='function'||typeof now!=='function'||!integer(perMinute,1,10)||!integer(perDay,perMinute,100)||!integer(globalPerDay,perDay,10000))throw Error('Cuota no disponible');
 return async function reserve(accountId,requestId){
  const t=now();if(typeof accountId!=='string'||!/^acct_[a-f0-9]{32}$/.test(accountId)||!requestId1186(requestId)||!integer(t,86400000,Number.MAX_SAFE_INTEGER))return false;
  // Rolling windows (not midnight reset); timestamps are server-generated.
  // Count future rows too, conservatively, if the server clock moves backwards.
  const r=await db.prepare("INSERT INTO coach_reservations_v1186(account_id,request_id,reserved_ms) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM accounts_v11 WHERE account_id=?) AND (SELECT COUNT(*) FROM coach_reservations_v1186 WHERE account_id=? AND reserved_ms>?)<? AND (SELECT COUNT(*) FROM coach_reservations_v1186 WHERE account_id=? AND reserved_ms>?)<? AND (SELECT COUNT(*) FROM coach_reservations_v1186 WHERE reserved_ms>?)<? ON CONFLICT(account_id,request_id) DO NOTHING").bind(accountId,requestId,t,accountId,accountId,t-60000,perMinute,accountId,t-86400000,perDay,t-86400000,globalPerDay).run();
  if(r?.success!==true||![0,1].includes(r.meta?.changes))throw Error('Reserva no confirmada');
  return r.meta.changes===1;
 };
}
