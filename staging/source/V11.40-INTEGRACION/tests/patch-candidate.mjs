import {readFileSync,writeFileSync} from 'node:fs';
const dir='staging/source/V11.29-INTEGRACION/tests/candidate/';
let p=readFileSync(dir+'candidate-preload.js','utf8');
if(p.split("typeof f.readSession!=='function'||typeof f.passphrase!=='string'||!f.storage||!f.sessionStorage").length!==2)throw Error('Preload inesperado');
p=p.replace("typeof f.readSession!=='function'||typeof f.passphrase!=='string'||!f.storage||!f.sessionStorage","!f.moduleStore||!f.storage||!f.sessionStorage||!f.services").replace('readSession:f.readSession,passphrase:f.passphrase,','moduleStore:f.moduleStore,');
writeFileSync(dir+'candidate-preload.js',p);
writeFileSync(dir+'candidate-store.mjs',`export async function openCandidateStore(){
 if(location.hostname!=='127.0.0.1'||typeof asiaCandidateSession==='undefined')throw Error('Candidato CI no autorizado');
 return asiaCandidateSession.moduleStore;
}
`);
