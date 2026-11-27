// Explicit one-time fresh profile for the isolated synthetic pilot only.
import {digest} from '../../official/V11.24-STAGING/src/security1111.mjs';
const reply=(status,code)=>new Response(JSON.stringify({ok:status===200,code}),{status,headers:{'Cache-Control':'no-store, private','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const valid=s=>s?.ok===true&&s.syntheticOnly===true&&typeof s.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&/^[A-Za-z0-9_-]{43}$/.test(s.csrf);
export async function handleFreshPilotProfile(request,env,{authenticate,now=Date.now}={}){
 if(env.STAGING_ALLOW_PILOT_FRESH_PROFILE_V12!=='true'||env.STAGING_ALLOW_MANAGED_KEYS_1152!=='true')return reply(404,'NO_HABILITADO');
 const u=new URL(request.url);
 if(u.origin!==env.STAGING_ORIGIN||u.pathname!=='/v12/pilot/fresh-profile'||u.search||request.method!=='POST'||request.body!==null||request.headers.get('Origin')!==env.STAGING_ORIGIN||request.headers.get('Sec-Fetch-Site')==='cross-site'||request.headers.get('X-Asia-Fresh-Profile')!=='archive-legacy-v1')return reply(403,'SOLICITUD_INVALIDA');
 const cookies=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith('__Host-asia1111_session='));
 if(cookies.length!==1||!/^__Host-asia1111_session=[A-Za-z0-9_-]{43}$/.test(cookies[0]))return reply(401,'NO_AUTORIZADO');
 try{
  const s=await authenticate();if(!valid(s)||s.csrf!==request.headers.get('X-Asia-CSRF'))return reply(403,'NO_AUTORIZADO');
  const token=await digest(cookies[0].split('=')[1]),t=now(),fresh='acct_'+Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
  // The SQL statement and triggers atomically create a disjoint empty profile,
  // enroll it and revoke old sessions. No old snapshot or browser vault is deleted.
  const current=await authenticate();if(!valid(current)||current.accountId!==s.accountId||current.csrf!==s.csrf)return reply(401,'NO_AUTORIZADO');
  const row=await env.STAGING_DB.prepare("INSERT INTO pilot_fresh_profiles_v12(legacy_account_id,fresh_account_id,created_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM auth_oidc_sessions_v1111 WHERE token_digest=? AND account_id=? AND csrf=? AND expires_at>?) AND NOT EXISTS(SELECT 1 FROM managed_account_keys_v1152 WHERE account_id=?) ON CONFLICT(legacy_account_id) DO NOTHING RETURNING fresh_account_id").bind(s.accountId,fresh,new Date(t).toISOString(),token,s.accountId,s.csrf,t,s.accountId).first();
  if(row?.fresh_account_id!==fresh)return reply(409,'NO_CONFIRMADO');
  return reply(200,'VOLVER_A_GOOGLE');
 }catch{return reply(409,'NO_CONFIRMADO')}
}
