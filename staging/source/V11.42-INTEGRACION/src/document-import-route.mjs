// Unmounted real-provider composition; requires a real sandbox inspector and verified identity.
import {createDocumentProvider} from './document-import-provider.mjs';
import {createDocumentImportGateway} from './document-import-gateway.mjs';
import {requestId1186} from './coach-quota1186.mjs';
export function createDocumentImportRoute({enabled=false,origin,authenticate,db,apiKey,model,inspectFile,fetchImpl=fetch,now=Date.now,perDay=3,globalPerDay=50}={}){
 if(enabled!==true||typeof db?.prepare!=='function'||typeof now!=='function'||!Number.isInteger(perDay)||perDay<1||perDay>10||!Number.isInteger(globalPerDay)||globalPerDay<perDay||globalPerDay>1000)throw Error('Importación no habilitada');
 const reserve=async(account,id)=>{
  const t=now();if(!/^acct_[a-f0-9]{32}$/.test(account)||!requestId1186(id)||!Number.isSafeInteger(t)||t<86400000)return false;
  const r=await db.prepare('INSERT INTO document_import_reservations_v12(account_id,request_id,reserved_ms) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM accounts_v11 WHERE account_id=?) AND (SELECT COUNT(*) FROM document_import_reservations_v12 WHERE account_id=? AND reserved_ms>?)<? AND (SELECT COUNT(*) FROM document_import_reservations_v12 WHERE reserved_ms>?)<? ON CONFLICT(account_id,request_id) DO NOTHING').bind(account,id,t,account,account,t-86400000,perDay,t-86400000,globalPerDay).run();
  if(r?.success!==true||![0,1].includes(r.meta?.changes))throw Error('Reserva no confirmada');return r.meta.changes===1;
 };
 const provider=createDocumentProvider({enabled,apiKey,model,fetchImpl,inspectFile});
 return createDocumentImportGateway({enabled,origin,authenticate,reserve,provider});
}
