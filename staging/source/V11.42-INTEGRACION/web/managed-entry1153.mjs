// No browser storage, no credential logging. Legacy fallback is explicit.
const valid=s=>s?.ok===true&&s.syntheticOnly===true&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&/^[A-Za-z0-9_-]{43}$/.test(s.csrf);
const same=(a,b)=>valid(a)&&valid(b)&&a.accountId===b.accountId&&a.csrf===b.csrf;
const base={credentials:'same-origin',cache:'no-store',redirect:'error'};
export async function discoverAccess1153(fetcher=fetch){
 const r=await fetcher('/v11.11/auth/me',base);
 if(r.status===401)return {mode:'anonymous'};
 if(!r.ok)throw Error('No se pudo verificar la sesión');
 const identity=await r.json();if(!valid(identity))throw Error('Sesión inválida');
 const response=await fetcher('/v11.52/account-key',{...base,method:'POST',headers:{'X-Asia-CSRF':identity.csrf}});
 const x=await response.json();
 const check=await fetcher('/v11.11/auth/me',base);
 if(!check.ok||!same(identity,await check.json()))throw Error('La sesión cambió');
 if((response.status===404&&x.error==='NO_HABILITADO')||(response.status===409&&['ALTA_NO_HABILITADA','MIGRACION_REQUERIDA'].includes(x.error)))return {mode:'legacy',identity};
 if(!response.ok||x.ok!==true||x.syntheticOnly!==true||x.accountId!==identity.accountId||!/^[A-Za-z0-9_-]{43}$/.test(x.secret||''))throw Error('No se pudo verificar la clave gestionada');
 return {mode:'managed',identity,secret:x.secret};
}
export async function renewAccess1153(identity,fetcher=fetch){
 const r=await fetcher('/v11.11/auth/renew',{...base,method:'POST',headers:{'X-Asia-CSRF':identity.csrf}});
 if(!r.ok||(await r.json()).ok!==true)throw Error('No se pudo renovar la sesión');
 const check=await fetcher('/v11.11/auth/me',base);
 if(!check.ok||!same(identity,await check.json()))throw Error('La sesión cambió');
}
