// Unmounted production composition. The synthetic Worker MUST NOT import or call it.
// Real identity adapter must enforce account authorization, session expiry/revocation and CSRF.
// Explicit provisioning required; no default secret, model, origin or automatic enablement.
import {createOpenAIProvider1181,createCoachGateway1181} from './coach-inference1181.mjs';
import {createCoachQuota1186} from './coach-quota1186.mjs';
export function createCoachRoute1186({enabled=false,origin,authenticate,db,apiKey,model,fetchImpl=fetch,now=Date.now,limits={}}={}){
 if(enabled!==true||typeof authenticate!=='function')throw Error('Inferencia no habilitada');
 if(!limits||Object.keys(limits).some(k=>!['perMinute','perDay','globalPerDay'].includes(k)))throw Error('Límites inválidos');
 const reserve=createCoachQuota1186({db,now,...limits}),provider=createOpenAIProvider1181({apiKey,model,fetchImpl});
 return createCoachGateway1181({origin,authenticate,reserve,provider});
}
