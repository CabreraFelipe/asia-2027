// Open Food Facts adapter for the existing V10.6 barcode flow, no account data sent upstream.
// Explicitly provisioned server-side. Not mounted in the synthetic Worker.
const check=(v,m)=>{if(!v)throw Error(m)},valid=s=>s?.ok===true&&s.syntheticOnly===false&&/^acct_[a-f0-9]{32}$/.test(s.accountId)&&typeof s.csrf==='string'&&s.csrf.length>=16;
export function barcodeValue(raw){
 check(typeof raw==='string'&&/^(?:\d{8}|\d{12,14})$/.test(raw),'Código inválido');let n=0;for(let i=raw.length-2,j=0;i>=0;i--,j++)n+=Number(raw[i])*(j%2?1:3);check((10-n%10)%10===Number(raw.at(-1)),'Código inválido');return raw.padStart(14,'0');
}
const bounds={'energy-kcal_100g':1000,proteins_100g:100,carbohydrates_100g:100,fat_100g:100,fiber_100g:100};
function clean(x,raw){
 if(x?.status===0)return {status:0};
 check(x?.status===1&&x.product&&barcodeValue(String(x.product.code??x.code))===barcodeValue(raw),'Respuesta inválida');
 const p=x.product,n=p.nutriments??{},product={code:raw,nutriments:{}};
 for(const k of ['product_name','product_name_es'])if(typeof p[k]==='string')product[k]=p[k].trim().slice(0,100);
 for(const [k,max] of Object.entries(bounds))if(typeof n[k]==='number'&&Number.isFinite(n[k])&&n[k]>=0&&n[k]<=max)product.nutriments[k]=n[k];
 if(!product.product_name&&!product.product_name_es||!Object.hasOwn(product.nutriments,'energy-kcal_100g')||!Object.hasOwn(product.nutriments,'proteins_100g'))return {status:0};
 return {status:1,product};
}
export async function openFoodLookup({enabled=false,readSession,fetcher,contact}={}){
 check(enabled===true&&typeof readSession==='function'&&typeof fetcher==='function'&&typeof contact==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact),'Consulta no habilitada');
 const identity=await readSession();check(valid(identity),'Sesión inválida');let closed=false,busy=false;
 async function verify(){check(!closed,'Consulta cerrada');const s=await readSession();if(!valid(s)||s.accountId!==identity.accountId||s.csrf!==identity.csrf){closed=true;throw Error('Cambió la sesión')}check(!closed,'Consulta cerrada')}
 async function lookup(raw,consent){
  barcodeValue(raw);check(consent===true&&!closed&&!busy,'Confirmá la consulta');busy=true;let timer;const c=new AbortController();
  try{await verify();const work=(async()=>{const u='https://world.openfoodfacts.org/api/v2/product/'+raw+'.json?fields=code,product_name,product_name_es,nutriments';const res=await fetcher(u,{method:'GET',headers:{'User-Agent':'Asia2027/12.0 ('+contact+')',Accept:'application/json'},credentials:'omit',redirect:'error',cache:'no-store',signal:c.signal});
   if(res.status===404)return {status:0};check(res.ok&&res.body&&/application\/json/i.test(res.headers.get('content-type')??''),'Servicio no disponible');
   const reader=res.body.getReader(),parts=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();throw Error('Respuesta demasiado grande')}parts.push(value)}}finally{reader.releaseLock()}
   const bytes=new Uint8Array(size);let offset=0;for(const a of parts){bytes.set(a,offset);offset+=a.length}return clean(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),raw)})();
   const limit=new Promise((_,reject)=>{timer=setTimeout(()=>{c.abort();reject(Error('Consulta vencida'))},8000)});
   const result=await Promise.race([work,limit]);await verify();return result;
  }finally{clearTimeout(timer);c.abort();busy=false}
 }
 return Object.freeze({lookup,close(){closed=true},available:()=>!closed});
}
