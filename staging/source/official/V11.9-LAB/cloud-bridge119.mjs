// Asia V11.9, offline-only bridge between the browser demo state and the V11.2 D1 wire envelope.
// Does NOT authenticate an account, transport data, migrate V10.6, or resolve encryption-key recovery.
import {encrypt84,decrypt84,checksum84} from './legacy_v106/model84.mjs';
import {validateEnvelope114} from './sync114.mjs';
import {validState117} from './v119/vault117.mjs';

const FORMAT='asia119-lab-cloud-bridge-v1';
const validId=id=>typeof id==='string'&&/^demo_[a-f0-9]{32}$/.test(id);
const validRevision=r=>Number.isSafeInteger(r)&&r>=1&&r<=100;
const keys=(x,required)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===required.slice().sort().join('|');
export function validateBridgePayload119(p){return keys(p,['format','source','accountId','localRevision','state'])&&p.format===FORMAT&&p.source==='synthetic-lab-only'&&validId(p.accountId)&&validRevision(p.localRevision)&&validState117(p.state);}
export async function encryptForD1Lab119(state,phrase,{accountId,localRevision}={}){
 const payload={format:FORMAT,source:'synthetic-lab-only',accountId,localRevision,state:structuredClone(state)};
 if(!validateBridgePayload119(payload))throw Error('INVALID_LAB_BRIDGE_PAYLOAD');
 const envelope=await encrypt84({payload,sha256:await checksum84(payload)},phrase);
 if(!validateEnvelope114(envelope))throw Error('INVALID_D1_WIRE_ENVELOPE');
 return envelope;
}
export async function decryptFromD1Lab119(envelope,phrase,{accountId}={}){
 if(!validId(accountId)||!validateEnvelope114(envelope))throw Error('INVALID_D1_WIRE_ENVELOPE');
 let body;try{body=await decrypt84(envelope,phrase);}catch{throw Error('LAB_BRIDGE_INTEGRITY_FAILED');}
 if(!keys(body,['payload','sha256'])||!validateBridgePayload119(body.payload)||body.payload.accountId!==accountId||body.sha256!==await checksum84(body.payload))throw Error('LAB_BRIDGE_INTEGRITY_FAILED');
 return {state:structuredClone(body.payload.state),revision:body.payload.localRevision};
}
