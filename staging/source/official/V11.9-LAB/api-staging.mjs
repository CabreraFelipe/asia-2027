import {authRoute111} from './auth111.mjs';
import {dataRoute112} from './data112.mjs';
import {coachRoute115} from './coach115.mjs';
import {wellnessRoute116} from './wellness116.mjs';
import {VERSION,MARKER,json,guard,unavailable} from './guard.mjs';
const EXPECTED=['accounts_v11','encrypted_snapshots_v11','push_devices_v11','reminder_queue_v11','staging_identity_v110'];
const LEGACY=['ai_usage','health_daily','health_workouts_v43','asia_backup_v42','asia_backup_v844'];
export default {async fetch(request,env){
 if(new URL(request.url).pathname.startsWith('/v11/auth/'))return authRoute111(request,env);
 if(new URL(request.url).pathname.startsWith('/v11/data/'))return dataRoute112(request,env);
 if(new URL(request.url).pathname.startsWith('/v11/coach/'))return coachRoute115(request,env);
 if(new URL(request.url).pathname.startsWith('/v11/wellness/'))return wellnessRoute116(request,env);
 const refused=await guard(request,env,'STAGING_API_TOKEN');if(refused)return refused;
 if(new URL(request.url).pathname!=='/v11/status')return unavailable();
 if(request.method!=='GET')return json({ok:false,error:'Método no admitido'},405,{Allow:'GET'});
 if(!env.STAGING_DB||env.DB)return json({ok:false,error:'Binding de staging inválido'},503);
 try{
  const r=await env.STAGING_DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const names=new Set((r.results||[]).map(x=>x.name));
  if(LEGACY.some(n=>names.has(n))||!EXPECTED.every(n=>names.has(n)))return json({ok:false,error:'Esquema aislado no verificado'},503);
  const marker=await env.STAGING_DB.prepare('SELECT marker FROM staging_identity_v110 WHERE id=1').first();
  if(marker?.marker!==MARKER)return json({ok:false,error:'Identidad de base no verificada'},503);
  return json({ok:true,version:'11.2',environment:'staging',service:'api',database:'verified',authentication:'operator-probe-and-synthetic-users',publicRegistration:false,personalData:false,ai:false});
 }catch{return json({ok:false,error:'No se pudo verificar la base de pruebas'},503);}
}};
