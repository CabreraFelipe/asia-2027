import {VERSION,MARKER,json,guard,unavailable,emptyBody110} from './guard.mjs';
// New SQLite-backed namespace, never reuses RestAlarm. No alarms or push.
export class StagingProbe110 {
 constructor(ctx,env){this.ctx=ctx;this.env=env;}
 async fetch(request){
  if(this.env.STAGING_MODE!==MARKER||new URL(request.url).pathname!=='/probe'||request.method!=='POST'||!await emptyBody110(request))return unavailable();
  try{
   const value=await this.ctx.blockConcurrencyWhile(async()=>{
    const old=await this.ctx.storage.get('staging-marker-v110');
    if(old!==undefined&&old!==MARKER)throw Error('unexpected state');
    if(old===undefined)await this.ctx.storage.put('staging-marker-v110',MARKER);
    return await this.ctx.storage.get('staging-marker-v110');
   });
   if(value!==MARKER)throw Error('verification failed');
   return json({ok:true,version:VERSION,environment:'staging',service:'rest',durableObject:'verified',authentication:'operator-probe-only',push:false});
  }catch{return json({ok:false,error:'No se pudo verificar el objeto de pruebas'},503);}
 }
}
export default {async fetch(request,env){
 const refused=await guard(request,env,'STAGING_REST_TOKEN');if(refused)return refused;
 if(new URL(request.url).pathname!=='/v11/probe')return unavailable();
 if(request.method!=='POST')return json({ok:false,error:'Método no admitido'},405,{Allow:'POST'});
 if(!env.STAGING_REST||env.REST)return json({ok:false,error:'Binding de staging inválido'},503);
 try{return await env.STAGING_REST.get(env.STAGING_REST.idFromName('asia-v11-staging-probe-110')).fetch('https://internal/probe',{method:'POST'});}catch{return json({ok:false,error:'No se pudo verificar el objeto de pruebas'},503);}
}};
