// Read-only, session-bound health view. No provider credentials or account IDs enter the diary.
import {projectHealthSources} from './health-sources.mjs';
const check=(v,m)=>{if(!v)throw Error(m)},copy=x=>JSON.parse(JSON.stringify(x)),valid=s=>s?.ok===true&&s.syntheticOnly===false&&typeof s.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>=16;
const exact=(x,k)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===k.length&&k.every(y=>Object.hasOwn(x,y));
export async function openHealthSourceView({enabled=false,readSession,readAuthorized}={}){
 check(enabled===true&&typeof readSession==='function'&&typeof readAuthorized==='function','Fuentes no habilitadas');const identity=await readSession();check(valid(identity),'Sesión de salud inválida');let closed=false,epoch=0,busy=false;
 async function verify(){check(!closed,'Consulta cerrada');const s=await readSession();if(!valid(s)||s.accountId!==identity.accountId||s.csrf!==identity.csrf){closed=true;epoch++;throw Error('Cambió la sesión')}check(!closed,'Consulta cerrada')}
 function discard(){epoch++}
 async function read({from,to,today,preferred={}}){
  check(!closed&&!busy,'Consulta en curso o cerrada');
  projectHealthSources({sources:[],records:[],from,to,today,preferred:{}});const mark=epoch,choice=copy(preferred);busy=true;
  try{await verify();check(mark===epoch,'Consulta descartada');const x=await readAuthorized({from,to});await verify();check(mark===epoch,'Consulta descartada');
   check(exact(x,['sources','records']),'Respuesta de fuentes inválida');
   const rows=projectHealthSources({sources:x.sources,records:x.records,from,to,today,preferred:choice});
   return copy({sources:x.sources.filter(s=>s.status==='active').map(({id,provider,label,metrics})=>({id,provider,label,metrics})),rows});
  }finally{busy=false}
 }
 return Object.freeze({available:()=>!closed,read,discard,close(){closed=true;discard()}});
}
