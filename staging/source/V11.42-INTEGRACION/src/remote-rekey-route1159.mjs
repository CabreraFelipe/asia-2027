// Synthetic-only, separately disabled transport. No logs, no query secrets.
import {createRemoteRekey1157} from './remote-rekey1157.mjs';
import policy from './rekey-policy.generated.mjs';
import {digest} from '../../official/V11.24-STAGING/src/security1111.mjs';
const headers={'Cache-Control':'no-store, private','Pragma':'no-cache','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'};
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers});
const fail=(status,error)=>json({ok:false,error},status);
const valid=s=>s?.ok===true&&s.syntheticOnly===true&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&/^[A-Za-z0-9_-]{43}$/.test(s.csrf);
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const uuid=s=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(s);
async function body(request){
 if(!request.body||!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('Content-Type')||''))throw Error('body');
 const length=request.headers.get('Content-Length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>2048))throw Error('length');
 const reader=request.body.getReader(),out=new Uint8Array(2048);let n=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;if(n+value.length>out.length){await reader.cancel();throw Error('limit')}out.set(value,n);n+=value.length}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(out.subarray(0,n)));
 }finally{out.fill(0);reader.releaseLock()}
}
export async function handleRemoteRekey1159(request,env,{authenticate}){
 if(env.STAGING_ALLOW_REMOTE_REKEY_1159!=='true'||env.STAGING_ALLOW_MANAGED_KEYS_1152!=='true'||env.STAGING_ALLOW_V1138_TESTS!=='true')return fail(404,'NO_HABILITADO');
 const u=new URL(request.url);
 if(u.pathname!=='/v11.59/rekey'||u.search||u.origin!==env.STAGING_ORIGIN||u.protocol!=='https:')return fail(404,'RUTA_INVALIDA');
 if(request.method!=='POST')return fail(405,'METODO_INVALIDO');
 const tokens=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith('__Host-asia1111_session='));
 if(tokens.length!==1||!/^__Host-asia1111_session=[A-Za-z0-9_-]{43}$/.test(tokens[0]))return fail(401,'NO_AUTORIZADO');
 try{
  const s=await authenticate();if(!valid(s))return fail(401,'NO_AUTORIZADO');
  if(request.headers.get('Origin')!==env.STAGING_ORIGIN||request.headers.get('X-Asia-CSRF')!==s.csrf)return fail(403,'CSRF_INVALIDO');
  let input;try{input=await body(request)}catch{return fail(400,'CUERPO_INVALIDO')}
  const action=input?.action;
  const schema={discover:['action'],inspect:['action','operationId'],begin:['action','operationId','expectedRevision','expectedSha','confirmed'],cancel:['action','operationId','confirmed'],commit:['action','operationId','confirmed','oldPhrase','consent']};
  if(!Object.hasOwn(schema,action)||!exact(input,schema[action])||action!=='discover'&&!uuid(input.operationId))return fail(400,'SOLICITUD_INVALIDA');
  if(['begin','cancel','commit'].includes(action)&&input.confirmed!==true)return fail(400,'CONFIRMACION_REQUERIDA');
  if(action==='begin'&&(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<1||input.expectedRevision>=200||!/^[a-f0-9]{64}$/.test(input.expectedSha||'')))return fail(400,'REVISION_INVALIDA');
  if(action==='commit'&&(input.consent!=='transient-server-rekey-v1'||typeof input.oldPhrase!=='string'||input.oldPhrase.length<12||input.oldPhrase.length>200))return fail(400,'CONSENTIMIENTO_REQUERIDO');
  const service=createRemoteRekey1157({db:env.STAGING_DB,bucket:env.STAGING_SYNC_OBJECTS,session:{id:s.accountId,digest:await digest(tokens[0].split('=')[1]),csrf:s.csrf},policy,kekId:env.STAGING_MANAGED_KEK_ID_1152,kekSecret:env.STAGING_MANAGED_KEK_1152,...(env.STAGING_ALLOW_KEK_ROTATION_1172==='true'?{previousKekId:env.STAGING_PREVIOUS_KEK_ID_1172,previousKekSecret:env.STAGING_PREVIOUS_KEK_1172}:{}),enabled:true});
  let operation;
  try{
   if(action==='discover')operation=await service.discover();
   else if(action==='inspect')operation=await service.inspect(input.operationId);
   else if(action==='begin')operation=await service.begin(input);
   else if(action==='cancel')operation=await service.cancel(input);
   else operation=await service.commit(input);
  }catch{return fail(409,'OPERACION_NO_CONFIRMADA')}
  finally{if(action==='commit')input.oldPhrase=null}
  const current=await authenticate();if(!valid(current)||current.accountId!==s.accountId||current.csrf!==s.csrf)return fail(401,'NO_AUTORIZADO');
  return json({ok:true,syntheticOnly:true,accountId:s.accountId,operation});
 }catch{return fail(503,'MIGRACION_NO_DISPONIBLE')}
}
