// Boundary for a separately provisioned private provider. No public URL or historical bearer.
const check=(x,m)=>{if(!x)throw Error(m)};
const kinds=new Set(['health','workouts','coach','chat','diet','weekly','training','scan','nutrition52','vision']);
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const jpeg=(s,max)=>typeof s==='string'&&s.length<=max&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(s);
export function validateProviderInput(kind,payload){
 check(kinds.has(kind),'Servicio desconocido');
 if(['health','workouts'].includes(kind)){check(payload===null,'Lectura inválida');return}
 check(plain(payload),'Solicitud inválida');
 if(kind==='vision'){check(Object.keys(payload).length===3&&['meal','technique'].includes(payload.mode)&&typeof payload.question==='string'&&payload.question.length<=600&&Array.isArray(payload.images)&&payload.images.length>=1&&payload.images.length<=4&&payload.images.every(x=>jpeg(x,600000)),'Imágenes inválidas');return}
 if(kind==='scan'||kind==='nutrition52'){check(jpeg(payload.image,3500000),'Imagen inválida');if(kind==='nutrition52')check(Object.keys(payload).length===2&&['meal','label'].includes(payload.mode),'Modo inválido');else check(Object.keys(payload).length===2&&plain(payload.data)&&JSON.stringify(payload.data).length<=25000,'Escaneo inválido');return}
 check(JSON.stringify(payload).length<=25000,'Consulta demasiado extensa');
 const walk=[payload];while(walk.length){const v=walk.pop();if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){check(!/^(?:__proto__|prototype|constructor|accountId|account_id|userId|authorization|token|password|secret|apiKey|image|images)$/i.test(k),'Campo prohibido');walk.push(x)}else check(typeof v!=='string'||!v.startsWith('data:image/'),'Imagen no autorizada')}
}
export function validateProviderResponse(kind,x){
 check(plain(x)&&x.ok===true&&x.syntheticOnly===true,'Respuesta no sintética o inválida');
 if(['health','workouts'].includes(kind)){const rows=x[kind==='health'?'records':'workouts'];check(Array.isArray(rows)&&rows.length<=10000&&JSON.stringify(rows).length<=1000000,'Registros inválidos');return x}
 check(typeof x.model==='string'&&x.model.length<=100&&Number.isSafeInteger(x.remaining)&&x.remaining>=0,'Metadatos inválidos');
 if(kind==='vision')check(typeof x.answer==='string'&&x.answer.length>0&&x.answer.length<=12000,'Visión inválida');
 else if(kind==='coach')check(plain(x.result)&&typeof x.result.answer==='string'&&x.result.answer.length<=12000,'Coach inválido');
 else if(['scan','nutrition52'].includes(kind))check(plain(x.result)&&JSON.stringify(x.result).length<=12000,'Extracción inválida');
 else check(typeof x.result==='string'&&x.result.length<=12000,'Respuesta inválida');return x;
}
export function createPrivateProvider({binding,enabled=false}){
 check(enabled===true&&typeof binding?.fetch==='function','Proveedor privado no configurado');
 return Object.freeze({async request({kind,accountId,payload,verify}){
  check(/^acct_[a-f0-9]{32}$/.test(accountId)&&typeof verify==='function','Identidad inválida');
  validateProviderInput(kind,payload);check(await verify(),'Sesión revocada');
  // Only service binding, fixed synthetic namespace, no client-supplied upstream.
  const r=await binding.fetch(new Request('https://private-provider.invalid/synthetic/'+kind,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accountId,payload,syntheticOnly:true}),redirect:'error'}));
  check(r.ok,'Proveedor no disponible');const x=await r.json();check(await verify(),'Sesión revocada');return validateProviderResponse(kind,x);
 }});
}
