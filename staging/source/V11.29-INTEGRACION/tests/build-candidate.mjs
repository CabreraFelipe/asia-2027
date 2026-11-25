// Build a disposable candidate from the pinned V10.6 snapshot. Never edit root files.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const base='061bb34dc3735d38dfd14eeb77f1054f34b63578';
const here='staging/source/V11.29-INTEGRACION',dest=join(here,'tests/candidate');
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
check(!existsSync(dest),'El candidato debe construirse en un directorio nuevo');
const rows=execFileSync('git',['ls-tree','-rz',base]).toString('utf8').split('\0').filter(Boolean);
check(rows.length===110,'Inventario original inesperado');
const report=[],sources=new Map();
for(const row of rows){
 const [meta,path]=row.split('\t'),sha=meta.split(' ')[2],bytes=readFileSync(path);
 check(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')===sha,'Archivo original alterado: '+path);
 if(/\.(?:js|mjs|html|cjs)$/.test(path)){
  const s=bytes.toString('utf8'),counts=Object.fromEntries(['localStorage','sessionStorage','indexedDB','openStore','serviceWorker','cabrerafelipe.github.io'].map(k=>[k,s.split(k).length-1]));
  const direct=[...s.matchAll(/\b(?:window|globalThis|self|root|w)\s*(?:\.\s*(?:localStorage|sessionStorage|indexedDB)\b|\[\s*['"](?:localStorage|sessionStorage|indexedDB)['"]\s*\])/g)].map(x=>x[0]);
  report.push({path,...counts,direct});
 }
 if(!path.includes('/')&&/\.(?:js|mjs|css|png|json)$/.test(path)&&path!=='sw.js'||path==='index.html')sources.set(path,bytes);
}
const originalIndex=sources.get('index.html').toString('utf8');
const scriptTags=[...originalIndex.matchAll(/<script(?:\s[^>]*)?>/g)];
check(scriptTags.length===51,'Inventario de scripts inesperado');
const replaceOnce=(s,from,to)=>{check(s.split(from).length===2,'Parche no único: '+from);return s.replace(from,to)};
sources.set('index.html',Buffer.from(replaceOnce(originalIndex,'<head>','<head><script src="candidate-preload.js"></script>')));
const originalStore=sources.get('store84.mjs').toString('utf8'),marker='export function openStore(factory=globalThis.indexedDB) {';
check(originalStore.split(marker).length===2,'openStore original inesperado');
sources.set('store84.mjs',Buffer.from(originalStore.split(marker)[0]+"export {openCandidateStore as openStore} from './candidate-store.mjs';\n"));
const release=sources.get('release831.mjs').toString('utf8');
sources.set('release831.mjs',Buffer.from(replaceOnce(release,'if(!local831(location))return;',"if(typeof asiaCandidateSession==='undefined')return;")));
const exceptions=new Set(['index.html','store84.mjs','release831.mjs']);
// Fail rather than silently bypass a native-storage access in any copied code.
for(const r of report){
 if(sources.has(r.path)&&r.path!=='store84.mjs')check(r.direct.length===0,'Acceso directo no adaptado: '+r.path+' '+r.direct.join(','));
}
for(const [path,bytes] of sources){
 if(!exceptions.has(path))check(bytes.equals(readFileSync(path)),'Cambio no autorizado: '+path);
 const target=join(dest,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes);
}
for(const name of ['candidate-preload.js','candidate-store.mjs'])writeFileSync(join(dest,name),readFileSync(join(here,'src',name)));
console.log('110/110 originales intactos; 51 scripts; excepciones candidatas:',[...exceptions]);
console.log('Inventario de referencias (incluye rutas auxiliares no montadas):',JSON.stringify(report));
