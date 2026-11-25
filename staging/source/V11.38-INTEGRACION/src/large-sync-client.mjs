import {prepareSync} from '../../V11.36-INTEGRACION/src/sync.mjs';
import {createLargeTransport} from './large-transport.mjs';
import {validLargeEnvelope,MAX_BYTES} from './large-sync.mjs';
export function validateLargeList(r){
 if(r?.ok!==true||!Number.isSafeInteger(r.head)||r.head<0||r.head>200||!Array.isArray(r.versions)||r.versions.length>20)throw Error('Índice remoto inválido');
 let prev=201;for(const v of r.versions){if(!Number.isSafeInteger(v.revision)||v.revision<1||v.revision>=prev||!Number.isSafeInteger(v.bytes)||v.bytes<1||v.bytes>MAX_BYTES||!Number.isFinite(Date.parse(v.created_at)))throw Error('Versión remota inválida');prev=v.revision}
 if(r.head!==(r.versions[0]?.revision??0))throw Error('Cabecera inconsistente');return r;
}
export function prepareLargeSync(options){
 const request=createLargeTransport(options);
 return prepareSync({...options,transport:{namespace:'objects-v1138',request,validEnvelope:validLargeEnvelope,validateList:validateLargeList}});
}
