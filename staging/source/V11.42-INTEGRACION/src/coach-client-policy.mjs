// Production composition boundary; not mounted by the synthetic controller.
// Explicit grant from the verified parent session, never from diary contents or URL.
import {createCoachTransport1181} from './coach-transport1181.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const valid=s=>s?.ok===true&&s.syntheticOnly===false&&typeof s.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>=16;
const modes=['intake','strength','hybrid'];
export async function openCoachClients({enabled=false,identity,readSession,origin,fetcher,now=Date.now,transportFactory=createCoachTransport1181}={}){
 check(enabled===true&&valid(identity)&&typeof readSession==='function'&&typeof fetcher==='function','Coach no habilitado para esta sesión');
 const account=identity.accountId,csrf=identity.csrf,clients=new Map();let closed=false,busy=false;
 const verified=async()=>{check(!closed,'Coach cerrado');let s;try{s=await readSession()}catch{close();throw Error('No se pudo verificar la sesión')}if(!valid(s)||s.accountId!==account||s.csrf!==csrf){close();throw Error('Cambió la sesión')}check(!closed,'Coach cerrado');return s};
 function close(){closed=true;for(const c of clients.values())c.close();clients.clear();}
 try{await verified();for(const m of modes){const c=await transportFactory({origin,readSession:verified,fetcher,now});check(['preview','send','take','discard','close','available'].every(k=>typeof c?.[k]==='function'),'Transporte inválido');clients.set(m,c);await verified()}}
 catch(e){close();throw e}
 const make=m=>{const c=clients.get(m);return Object.freeze({available:()=>!closed&&c.available()===true,preview(x){check(!closed&&!busy&&x?.version===({strength:1,hybrid:2,intake:3})[m],'Consulta inválida u ocupada');return c.preview(x)},async send(p,consent){check(!closed&&!busy,'Otra consulta en curso');busy=true;try{await verified();return await c.send(p,consent)}finally{busy=false}},async take(p){await verified();return c.take(p)},discard(){c.discard()}})};
 return Object.freeze({mode:'provider',intake:make('intake'),strength:make('strength'),hybrid:make('hybrid'),close});
}
// A synthetic pilot has no provider capability. Invalid grants fail closed, never switch to a fixture.
export function coachUiPolicy(grant,kind,allowSynthetic=false){
 check(modes.includes(kind),'Modo Coach inválido');
 if(grant===undefined||grant===null){check(allowSynthetic===true,'Coach no disponible para esta cuenta');return Object.freeze({transport:null,synthetic:true})}
 check(allowSynthetic!==true,'Una sesión de prueba no puede abrir el proveedor real');
 check(grant.mode==='provider'&&['preview','send','take','discard','available'].every(k=>typeof grant[kind]?.[k]==='function'),'Coach no disponible');
 return Object.freeze({transport:grant[kind],synthetic:false});
}
