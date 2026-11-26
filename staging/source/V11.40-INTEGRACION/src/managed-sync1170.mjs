// Managed account only. No silent replacement of existing local data.
// All publishing uses the existing authenticated append-only CAS transport.
import {prepareLargeSync} from '../../V11.38-INTEGRACION/src/large-sync-client.mjs';
import {reconcileOffline} from '../../V11.37-INTEGRACION/src/offline-session.mjs';
const check=(x,m)=>{if(!x)throw Error(m)},eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export async function syncManaged1170(options,{reconcileBranch=false,prepare=prepareLargeSync,reconcile=reconcileOffline}={}){
 check(options.managedWrite===true,'Sincronización gestionada no disponible');
 const {repository,pending,readSession}=options,identity=await readSession(),id=identity.accountId;
 const verify=async()=>{const s=await readSession();check(s.accountId===id&&s.csrf===identity.csrf,'La sesión cambió');return s};
 const noPending=async()=>{await verify();check(!await pending.inspect(id),'Apareció una rama pendiente; conservá ambas copias')};
 const branch=await pending.inspect(id);
 if(branch){
  if(!reconcileBranch)return {kind:'review-required',reason:'pending'};
  await reconcile({...options,maintenanceConfirmed:true,confirmed:true,expectedBranch:branch});
 }
 await noPending();
 const guardedRepository={
  async readSync(account){check(account===id,'Cuenta cambió');await noPending();const row=await repository.readSync(id);await noPending();return row},
  async commitSync(account,expected,next){
   check(account===id,'Cuenta cambió');await noPending();
   const result=await repository.commitSync(id,expected,next);
   check(result===true,'Marcador local no confirmado');await noPending();
   const row=await repository.readSync(id);
   check(eq(row.baseline,next.baseline)&&eq(row.local,next.local??expected.local)&&eq(row.modules,next.modules??expected.modules),'Lectura posterior local no coincide');
   return result;
  }
 };
 const source=await guardedRepository.readSync(id);let plan;
 try{
  plan=await prepare({...options,repository:guardedRepository,maintenanceConfirmed:true});
  if(plan.kind==='empty')return {kind:'empty'};
  if(!['push','equal','pull'].includes(plan.kind)||plan.backup||plan.kind==='pull'&&(source.local||source.modules||source.baseline))return {kind:'review-required',reason:plan.kind,remoteRevision:plan.remoteRevision};
  await noPending();check(eq(await guardedRepository.readSync(id),source),'Copia local cambió');
  const result=await plan.apply({confirmed:true});
  await noPending();
  check(result.kind===plan.kind&&Number.isSafeInteger(result.remoteRevision)&&result.remoteRevision>=1,'Sincronización no confirmada');
  return {kind:'synced',direction:result.kind,remoteRevision:result.remoteRevision};
 }finally{plan?.cancel()}
}
