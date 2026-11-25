// Account-bound transport for original V10.6 service contracts. Synthetic only.
const allowed=new Set(['health','workouts','coach','chat','diet','weekly','training']);
const check=(x,m)=>{if(!x)throw Error(m)};
const valid=s=>typeof s?.accountId==='string'&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>0;
export async function createAccountServices({origin,readSession,fetcher=fetch}){
 check(/^https:\/\/asia-v1111-identity-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin),'Origen inválido');
 const identity=await readSession();check(valid(identity),'Sesión inválida');let active=true,flight=false;
 async function verify(){check(active,'Servicios cerrados');const s=await readSession();if(!valid(s)||s.accountId!==identity.accountId||s.csrf!==identity.csrf){active=false;throw Error('La sesión cambió')}return s}
 return Object.freeze({available:()=>active,close(){active=false},
  async request(kind,payload=null){
   check(allowed.has(kind),'Servicio no habilitado en staging');const reading=['health','workouts'].includes(kind);
   check(reading?payload===null:payload&&typeof payload==='object'&&!Array.isArray(payload)&&JSON.stringify(payload).length<=25000,'Solicitud inválida');
   if(!reading){check(!flight,'Consulta en curso');flight=true}
   try{
    await verify();const r=await fetcher(origin+'/v11.39/services/'+kind,{method:reading?'GET':'POST',credentials:'same-origin',cache:'no-store',redirect:'error',headers:reading?{}:{'Content-Type':'application/json','X-Asia-CSRF':identity.csrf},...(reading?{}:{body:JSON.stringify(payload)})});
    const x=await r.json();await verify();check(r.ok&&x.ok===true&&x.syntheticOnly===true,'Servicio sintético no disponible');
    if(reading){const rows=x[kind==='health'?'records':'workouts'];check(Array.isArray(rows),'Respuesta inválida');return rows}
    check(typeof x.model==='string'&&Number.isInteger(x.remaining)&&x.remaining>=0,'Respuesta inválida');
    check(kind==='coach'?typeof x.result?.answer==='string':typeof x.result==='string','Respuesta inválida');return x;
   }finally{if(!reading)flight=false}
  }
 });
}
