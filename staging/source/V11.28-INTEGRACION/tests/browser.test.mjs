import {openModuleRepository,openEncryptedModuleStore} from '../src/encrypted-module-store.mjs';
import {MODULES} from '../../../../store84.mjs';
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
async function rejects(fn,pattern){try{await fn()}catch(e){check(pattern.test(String(e.message)),String(e.message));return}throw Error('Se esperaba rechazo')}
export async function run(){
 const A='acct_'+'a'.repeat(32),B='acct_'+'b'.repeat(32);
 let accountId=A,csrf='a',revoked=false;
 const readSession=async()=>{if(revoked){const e=Error('revocada');e.revoked=true;throw e}return {accountId,csrf}};
 let repo=await openModuleRepository();
 const open=(passphrase='frase sintética de cuenta '+accountId)=>openEncryptedModuleStore({readSession,repository:repo,passphrase});
 let a=await open();
 try{
  for(const name of MODULES){const r=await a.read(name);check(r.revision===0&&r.name===name,'Módulo inicial inválido')}
  const original=await a.replacePair({preferences:0,gym:0},{preferences:{marker:'preferencia sintética A'},gym:{marker:'gimnasio sintético A'}});
  check(original.gym.revision===1&&original.preferences.revision===1,'Par no guardado');
  await rejects(()=>a.replacePair({preferences:1,gym:0},{preferences:{marker:'NO'},gym:{marker:'NO'}}),/Conflicto/);
  let p=await a.readPair();check(p.preferences.payload.marker==='preferencia sintética A'&&p.gym.payload.marker==='gimnasio sintético A','Restauración parcial');
  await rejects(()=>a.write('coach',0,{token:'no guardar'}),/Campo no permitido/);
  await rejects(()=>a.read('unknown'),/Módulo desconocido/);
  const other=await open();
  const results=await Promise.allSettled([a.write('gym',1,{marker:'concurrente A'}),other.write('gym',1,{marker:'concurrente B'})]);
  check(results.filter(r=>r.status==='fulfilled').length===1&&results.filter(r=>r.status==='rejected').length===1,'CAS no atómico');
  other.close();
  const record=await repo.read(A);
  check(record.revision===2&&record.envelope.format==='asia84-encrypted-v1'&&!JSON.stringify(record).includes('sintética')&&!JSON.stringify(record).includes('gym'),'Datos en claro');
  const expected=(await a.read('gym')).payload.marker;
  a.close();repo.close();repo=await openModuleRepository();
  await rejects(()=>open('frase incorrecta sintética'),/[\s\S]*/);
  a=await open();check((await a.read('gym')).payload.marker===expected,'No persistió tras reapertura');
  accountId=B;csrf='b';await rejects(()=>a.readPair(),/cambió/);await rejects(()=>a.read('gym'),/cerrada/);
  const b=await open();check((await b.read('gym')).revision===0,'Mezcla A/B');
  await b.write('gym',0,{marker:'cuenta B'});b.close();
  accountId=A;csrf='a-nueva';a=await open();check((await a.read('gym')).payload.marker===expected,'B alteró A');
  revoked=true;await rejects(()=>a.write('gym',2,{marker:'revocada'}),/no verificable/);
  check((await repo.read(A)).revision===2,'Escritura tras revocación');
  revoked=false;a=await open();check((await a.read('gym')).payload.marker===expected,'Datos alterados');a.close();
  return {ok:true,checks:'IndexedDB real, 12 módulos, AES-GCM, restauración atómica, CAS, aislamiento A/B, reapertura, frase errónea, revocación y rechazo de credenciales'};
 }finally{repo.close()}
}
