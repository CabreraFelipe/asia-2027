#!/usr/bin/env node
// V11.24 clean-copy regression runner. No network or credentials.
// Verify known files, ignore extras from OneDrive, NEVER copy unlisted files.
import {readFileSync,lstatSync,mkdirSync,copyFileSync,mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const base=dirname(fileURLToPath(import.meta.url));
const pathTo=p=>resolve(base,...p.split('/'));
const hash=b=>createHash('sha256').update(b).digest('hex');
let tmp=null;
try{
 const manifest=readFileSync(join(base,'INVENTARIO_OFICIAL_V11_24_SHA256.txt'),'utf8');
 const entries=[];const allowed=new Set();
 for(const line of manifest.split(/\r?\n/).filter(x=>x&&!x.startsWith('#'))){
  const m=/^([a-f0-9]{64})  (.+)$/.exec(line);
  if(!m)throw Error('Inventario de distribución inválido');
  const rel=m[2],parts=rel.split('/');
  if(rel.includes('\\')||rel.startsWith('/')||parts.some(p=>!p||p==='.'||p==='..')||allowed.has(rel))throw Error('Ruta duplicada o insegura '+rel);
  allowed.add(rel);
  const filename=pathTo(rel),info=lstatSync(filename);
  if(!info.isFile()||info.isSymbolicLink())throw Error('Archivo no regular '+rel);
  if(hash(readFileSync(filename))!==m[1])throw Error('SHA256 no coincide '+rel);
  entries.push([rel,filename]);
 }
 if(entries.length<570||!allowed.has('INSTALAR_V11_24.cmd')||!allowed.has('V11.24-STAGING/scripts/preflight1124.mjs'))throw Error('Inventario incompleto');
 console.log('V11.24 inventario: '+entries.length+' archivos oficiales verificados por SHA-256.');
 if(process.argv.includes('--solo-integridad')){
  console.log('INTEGRIDAD V11.24 OK: sin cambios en archivos oficiales.');
 }else{
  tmp=mkdtempSync(join(tmpdir(),'asia-2027-v1124-'));
  for(const [rel,source] of entries){const dst=join(tmp,...rel.split('/'));mkdirSync(dirname(dst),{recursive:true});copyFileSync(source,dst);}
  const stage=join(tmp,'V11.24-STAGING');
  const test=spawnSync(process.execPath,[join(stage,'scripts/preflight1124.mjs')],{
   cwd:stage,encoding:'utf8',stdio:'inherit',timeout:420000,env:{...process.env,NODE_NO_WARNINGS:'1'}});
  if(test.error||test.status!==0||test.signal)throw Error('Pruebas en copia limpia fallidas: '+(test.error?.message||'codigo '+test.status));
  console.log('PREFLIGHT LOCAL OK: copia temporal aislada y regresiones aprobadas.');
 }
}catch(e){console.error('PREFLIGHT PORTABLE V11.24 ERROR: '+(e?.message||String(e)));process.exitCode=1;}
finally{if(tmp){try{rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:250});}catch(e){console.error('Aviso: limpieza temporal fallida '+e.message);}}}
