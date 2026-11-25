// Browser-side transport for V11.11 staging only. No password, client secret, account id or decryption key is transmitted.
import {validEnvelope} from './security1111.mjs';
export function stagingClient1111({origin,fetchImpl=fetch}={}){
 if(typeof origin!=='string'||!/^https:\/\/[^/?#]+$/.test(origin))throw Error('ORIGIN_REQUIRES_HTTPS');
 const make=async(path,options={})=>{const r=await fetchImpl(origin+path,{credentials:'include',cache:'no-store',redirect:'error',...options});const data=await r.json();return {status:r.status,...data};};
 let csrf=null;
 return Object.freeze({
  async session(){const result=await make('/v11.11/auth/me');if(result.status===200&&result.ok&&typeof result.csrf==='string')csrf=result.csrf;else csrf=null;return result;},
  async list(){return make('/v11.11/data/snapshots');},
  async read(revision){if(!Number.isInteger(revision)||revision<1||revision>20)throw Error('REVISION_INVALIDA');return make('/v11.11/data/snapshots/'+revision);},
  async save(expectedRevision,envelope){if(!csrf)throw Error('SESION_SIN_CSRF');if(!Number.isInteger(expectedRevision)||expectedRevision<0||expectedRevision>=20||!validEnvelope(envelope))throw Error('SOBRE_INVALIDO');return make('/v11.11/data/snapshots',{method:'POST',headers:{'Content-Type':'application/json','X-Asia-CSRF':csrf},body:JSON.stringify({expectedRevision,envelope})});},
  async logout(){if(!csrf)throw Error('SESION_SIN_CSRF');const result=await make('/v11.11/auth/logout',{method:'POST',headers:{'X-Asia-CSRF':csrf}});if(result.ok)csrf=null;return result;}
 });
}
