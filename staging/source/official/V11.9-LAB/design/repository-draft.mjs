// STAGING CONTRACT ONLY. No Worker, no routes, no login. Caller must be trusted server code
// after verifying signature, issuer, audience, expiration and resolving issuer+subject in DB.
// Never pass an account ID taken from a client header/body/path or browser storage.
const valid=id=>typeof id==='string'&&/^acct_[a-f0-9]{32}$/.test(id);
function check(x,msg){if(!x)throw Error(msg);}
export async function resolveAccount(db,verifiedClaims){
 const issuer=verifiedClaims?.iss,subject=verifiedClaims?.sub;
 check(typeof issuer==='string'&&issuer.length>0&&issuer.length<=500&&typeof subject==='string'&&subject.length>0&&subject.length<=500,'Identidad no resuelta');
 const row=await db.prepare('SELECT account_id FROM accounts_v11 WHERE issuer=? AND subject=?').bind(issuer,subject).first();
 check(valid(row?.account_id),'Cuenta no aprovisionada');return row.account_id;
}
export function repository(db,serverResolvedId){
 check(valid(serverResolvedId),'Cuenta no resuelta');const owner=serverResolvedId;
 return Object.freeze({
  async list(){return db.prepare('SELECT revision,created_at FROM encrypted_snapshots_v11 WHERE account_id=? ORDER BY revision DESC LIMIT 20').bind(owner).all();},
  async read(revision){check(Number.isSafeInteger(revision)&&revision>=1,'Revisión inválida');return db.prepare('SELECT revision,envelope,created_at FROM encrypted_snapshots_v11 WHERE account_id=? AND revision=?').bind(owner,revision).first();},
  async append(expected,envelope,createdAt){check(Number.isSafeInteger(expected)&&expected>=0&&expected<Number.MAX_SAFE_INTEGER,'Revisión inválida');check(typeof envelope==='string'&&new TextEncoder().encode(envelope).length<=1400000&&envelope.length>0,'Tamaño inválido');check(typeof createdAt==='string'&&Number.isFinite(Date.parse(createdAt)),'Fecha inválida');
   // Envelope framing/cryptographic validation belongs to the authenticated route, not this draft repository.
   const r=await db.prepare('INSERT INTO encrypted_snapshots_v11(account_id,revision,envelope,created_at) SELECT ?,?,?,? WHERE COALESCE((SELECT MAX(revision) FROM encrypted_snapshots_v11 WHERE account_id=?),0)=?').bind(owner,expected+1,envelope,createdAt,owner,expected).run();
   check(r?.meta?.changes===1,'Conflicto de revisión');return expected+1;
  }
 });
}
