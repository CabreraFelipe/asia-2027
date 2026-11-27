// V11.52 — guarded, synthetic-only account key custody. No enrollment API.
// Explicit server enrollment is a separate future operation. Never infer it
// from missing local/remote data; an old device may still have unsynced data.
import {generateAccountSecret,importWrappingKey,wrapAccountSecret,unwrapWithKeyring1172} from './account-key1150.mjs';
import {digest} from '../../official/V11.24-STAGING/src/security1111.mjs';
const headers={'Cache-Control':'no-store, private','Pragma':'no-cache','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'};
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers});
const fail=(status,code)=>json({ok:false,error:code},status);
const valid=s=>s?.ok===true&&s.syntheticOnly===true&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&/^[A-Za-z0-9_-]{43}$/.test(s.csrf);
export async function handleManagedKey(request,env,{authenticate,now=Date.now}){
 if(env.STAGING_ALLOW_MANAGED_KEYS_1152!=='true')return fail(404,'NO_HABILITADO');
 const u=new URL(request.url);
 if(u.pathname!=='/v11.52/account-key'||u.search||u.origin!==env.STAGING_ORIGIN)return fail(404,'RUTA_INVALIDA');
 if(request.method!=='POST')return fail(405,'METODO_INVALIDO');
 if(request.body!==null)return fail(400,'CUERPO_NO_PERMITIDO');
 const cookies=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith('__Host-asia1111_session='));
 if(cookies.length!==1||!/^__Host-asia1111_session=[A-Za-z0-9_-]{43}$/.test(cookies[0]))return fail(401,'NO_AUTORIZADO');
 try{
  const session=await authenticate();if(!valid(session))return fail(401,'NO_AUTORIZADO');
  if(request.headers.get('Origin')!==env.STAGING_ORIGIN||request.headers.get('X-Asia-CSRF')!==session.csrf)return fail(403,'CSRF_INVALIDO');
  const accountId=session.accountId,tokenDigest=await digest(cookies[0].split('=')[1]),db=env.STAGING_DB;
  const current=async()=>{const s=await authenticate();return valid(s)&&s.accountId===accountId&&s.csrf===session.csrf};
  const live='EXISTS(SELECT 1 FROM auth_oidc_sessions_v1111 WHERE token_digest=? AND account_id=? AND csrf=? AND expires_at>?)';
  const liveArgs=()=>[tokenDigest,accountId,session.csrf,now()];
  const read=()=>db.prepare('SELECT envelope,migration_lock,enrollment_kind FROM managed_account_keys_v1152 WHERE account_id=? AND '+live).bind(accountId,...liveArgs()).first();
  let row=await read();if(!row){
   if(env.STAGING_ALLOW_PILOT_FRESH_PROFILE_V12==='true'){
    const eligible=await db.prepare("SELECT account_id FROM accounts_v11 WHERE account_id=? AND issuer='https://accounts.google.com' AND NOT EXISTS(SELECT 1 FROM pilot_fresh_profiles_v12 WHERE legacy_account_id=? OR fresh_account_id=?)").bind(accountId,accountId,accountId).first();
    if(eligible?.account_id===accountId)return json({ok:false,error:'ALTA_NO_HABILITADA',freshProfileAvailable:true},409);
   }
   return fail(409,'ALTA_NO_HABILITADA');
  }
  if(row.migration_lock!==null)return fail(409,'MIGRACION_EN_CURSO');
  // The previous KEK is opt-in; an unknown version fails closed.
  const kekId=env.STAGING_MANAGED_KEK_ID_1152,key=await importWrappingKey(env.STAGING_MANAGED_KEK_1152);
  if(row.envelope===null&&row.enrollment_kind==='legacy')return fail(409,'MIGRACION_REQUERIDA');
  if(row.envelope===null){
   const secret=generateAccountSecret(),envelope=await wrapAccountSecret({accountId,kekId,key,secret});
   // One conditional write: no replacement, no creation for legacy cloud
   // data, no write after revocation. Concurrent initializers reuse winner.
   const empty=['sync_v1138_objects','synthetic_journal_v115','encrypted_snapshots_v11'].map(t=>'NOT EXISTS(SELECT 1 FROM '+t+' WHERE account_id=?)').join(' AND ');
   if(!await current())return fail(401,'NO_AUTORIZADO');
   await db.prepare('UPDATE managed_account_keys_v1152 SET envelope=? WHERE account_id=? AND envelope IS NULL AND migration_lock IS NULL AND enrollment_kind=\'new\' AND '+live+' AND '+empty+' RETURNING account_id').bind(JSON.stringify(envelope),accountId,...liveArgs(),accountId,accountId,accountId).first();
   row=await read();
   if(!row)return fail(401,'NO_AUTORIZADO');
   if(row.migration_lock!==null)return fail(409,'MIGRACION_EN_CURSO');
   if(row.envelope===null)return fail(409,'MIGRACION_REQUERIDA');
  }
  const rotation=env.STAGING_ALLOW_KEK_ROTATION_1172==='true';
  const keyring={accountId,kekId,kekSecret:env.STAGING_MANAGED_KEK_1152,...(rotation?{previousKekId:env.STAGING_PREVIOUS_KEK_ID_1172,previousKekSecret:env.STAGING_PREVIOUS_KEK_1172}:{})};
  const envelope=JSON.parse(row.envelope),secret=await unwrapWithKeyring1172({...keyring,envelope});
  if(envelope.kekId!==kekId){
   const replacement=JSON.stringify(await wrapAccountSecret({accountId,kekId,key,secret}));
   if(await unwrapWithKeyring1172({...keyring,envelope:JSON.parse(replacement)})!==secret)throw Error('Rotación no verificada');
   if(!await current())return fail(401,'NO_AUTORIZADO');
   await db.prepare('UPDATE managed_account_keys_v1152 SET envelope=? WHERE account_id=? AND envelope=? AND migration_lock IS NULL AND '+live+' RETURNING account_id').bind(replacement,accountId,row.envelope,...liveArgs()).first();
   row=await read();if(!row)return fail(401,'NO_AUTORIZADO');
   if(row.migration_lock!==null||!row.envelope)return fail(409,'CLAVE_CAMBIO');
   const winner=JSON.parse(row.envelope);
   if(winner.kekId!==kekId||await unwrapWithKeyring1172({...keyring,envelope:winner})!==secret)return fail(409,'CLAVE_CAMBIO');
  }
  if(!await current())return fail(401,'NO_AUTORIZADO');
  const last=await read();if(!last)return fail(401,'NO_AUTORIZADO');
  if(last.migration_lock!==null)return fail(409,'MIGRACION_EN_CURSO');
  if(last.envelope!==row.envelope)return fail(409,'CLAVE_CAMBIO');
  // Only in memory and authenticated HTTPS response; never logged or cached.
  return json({ok:true,syntheticOnly:true,accountId,secret});
 }catch{return fail(503,'CLAVE_NO_DISPONIBLE')}
}
