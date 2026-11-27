// A trusted private host must invoke the one-shot sanitizer inside an isolated sandbox.
// No public URL, credentials, original filename, or account ID are passed.
import {validatePlanFile} from './document-plan-import.mjs';
const check=x=>{if(!x)throw Error('Archivo no verificable')};
export function createDocumentFileInspector({enabled=false,binding}={}){
 check(enabled===true&&typeof binding?.fetch==='function');
 return async function inspect(file,{signal}={}){
  const source=validatePlanFile(file);let clean;
  try{
   check(!signal?.aborted);
   const response=await binding.fetch('https://document-inspector.internal/inspect',{method:'POST',redirect:'error',cache:'no-store',signal,headers:{'Content-Type':source.mime},body:source.bytes});
   check(response.ok&&response.body&&response.headers.get('Content-Type')===source.mime&&response.headers.get('X-Asia-Inspector')==='raster-v1');
   const number=k=>{const v=response.headers.get(k);check(typeof v==='string'&&/^[1-9][0-9]{0,7}$/.test(v));return Number(v)};
   const pages=number('X-Asia-Pages');check(pages<=10);
   let dimensions={};
   if(source.mime!=='application/pdf'){const width=number('X-Asia-Width'),height=number('X-Asia-Height');check(pages===1&&width*height<=20000000);dimensions={width,height}}
   const rd=response.body.getReader(),chunks=[];let total=0;
   try{for(;;){check(!signal?.aborted);const {done,value}=await rd.read();if(done)break;total+=value.byteLength;check(total<=10*1024*1024);chunks.push(value)}}finally{await rd.cancel().catch(()=>{});rd.releaseLock()}
   const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
   clean=validatePlanFile({mime:source.mime,bytes});check(!signal?.aborted);
   return {safe:true,mime:source.mime,pages,...dimensions,bytes:clean.bytes};
  }catch{clean?.bytes.fill(0);throw Error('Archivo no verificable')}finally{source.bytes.fill(0)}
 };
}
