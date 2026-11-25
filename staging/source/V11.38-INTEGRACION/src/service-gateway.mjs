// Synthetic read-only fixtures only, no live provider calls or user-provided account IDs.
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const routes=Object.freeze({health:'records',workouts:'workouts'});
export async function handleServices(request,{session,stillCurrent,provider,enabled=false}){
 if(!enabled||!provider)return json({ok:false,error:'DESACTIVADO'},403);
 const u=new URL(request.url),m=/^\/v11\.38\/services\/(health|workouts)$/.exec(u.pathname);
 if(!m||u.search||request.method!=='GET'||request.body!==null||['X-Asia-Account','X-Account-ID','X-User-ID','Authorization'].some(k=>request.headers.has(k)))return json({ok:false,error:'SOLICITUD_INVALIDA'},400);
 if(!session||!/^acct_[a-f0-9]{32}$/.test(session.id)||!await stillCurrent())return json({ok:false,error:'NO_AUTORIZADO'},401);
 try{
  const result=await provider.read(session.id,m[1]);
  if(!await stillCurrent())return json({ok:false,error:'NO_AUTORIZADO'},401);
  if(!Array.isArray(result)||result.length>10000||JSON.stringify(result).length>1000000)return json({ok:false,error:'RESPUESTA_INVALIDA'},503);
  return json({ok:true,[routes[m[1]]]:result});
 }catch{return json({ok:false,error:'SERVICIO_NO_DISPONIBLE'},503)}
}
export function createServiceClient({origin,readSession,fetcher=fetch}){
 if(!/^https:\/\/asia-v1111-identity-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin))throw Error('Origen inválido');
 return async kind=>{
  if(!Object.hasOwn(routes,kind))throw Error('Servicio no habilitado');
  const before=await readSession(),r=await fetcher(origin+'/v11.38/services/'+kind,{method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error'});
  if(!r.ok)throw Error('Servicio no disponible');
  const result=await r.json(),after=await readSession();
  if(before.accountId!==after.accountId||before.csrf!==after.csrf||result.ok!==true||!Array.isArray(result[routes[kind]]))throw Error('Sesión o respuesta inválida');
  return result[routes[kind]];
 };
}
