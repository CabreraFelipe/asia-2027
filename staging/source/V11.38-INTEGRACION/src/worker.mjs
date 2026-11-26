import {createAuthorizedWorker} from '../../V11.36-INTEGRACION/src/authorized-worker.mjs';
import {digest} from '../../official/V11.24-STAGING/src/security1111.mjs';
import {handleLargeSync} from './large-sync.mjs';
import {handleServices} from './service-gateway.mjs';
export function createWorker({assets,provider,fetchImpl=fetch}={}){
 const original=createAuthorizedWorker({assets,fetchImpl});
 const deny=status=>new Response(null,{status,headers:{'Cache-Control':'no-store'}});
 return {async fetch(request,env){
  const u=new URL(request.url),large=u.pathname==='/v11.38/sync'||u.pathname.startsWith('/v11.38/sync/'),service=u.pathname.startsWith('/v11.38/services/');
  if(!large&&!service)return original.fetch(request,env);
  if(env.STAGING_ALLOW_V1138_TESTS!=='true'||u.origin!==env.STAGING_ORIGIN||u.search||['X-Asia-Account','X-Account-ID','X-User-ID','Authorization'].some(k=>request.headers.has(k)))return deny(403);
  const cookie=request.headers.get('cookie')||'',matches=cookie.split(';').map(x=>x.trim()).filter(x=>x.startsWith('__Host-asia1111_session='));
  if(matches.length!==1||!/^__Host-asia1111_session=[A-Za-z0-9_-]{43}$/.test(matches[0]))return deny(401);
  async function read(){const r=await original.fetch(new Request(u.origin+'/v11.11/auth/me',{headers:{Cookie:cookie}}),env);return r.ok?await r.json():null}
  const s=await read();if(s?.ok!==true||s.syntheticOnly!==true||!/^acct_[a-f0-9]{32}$/.test(s.accountId))return deny(401);
  const session={id:s.accountId,digest:await digest(matches[0].split('=')[1])};
  if(large)return handleLargeSync(request,{db:env.STAGING_DB,bucket:env.STAGING_SYNC_OBJECTS,session,validWrite:r=>r.headers.get('Origin')===env.STAGING_ORIGIN&&r.headers.get('X-Asia-CSRF')===s.csrf,enabled:true,fenceEnabled:env.STAGING_ALLOW_MANAGED_KEYS_1152==='true',seedEnabled:env.STAGING_ALLOW_REMOTE_REKEY_1159==='true'});
  return handleServices(request,{session,provider,enabled:true,stillCurrent:async()=>{const x=await read();return x?.accountId===s.accountId&&x.csrf===s.csrf}});
 }};
}
