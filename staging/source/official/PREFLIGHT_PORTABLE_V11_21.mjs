#!/usr/bin/env node
// Asia 2027 V11.21 portable offline preflight.
// The original historical SHA-256/regression tests run UNMODIFIED in a clean copy
// of the manifest-verified release. Files added by Windows/OneDrive are never copied.
// No network, Cloudflare credentials, migrations or real user data.
import {readFileSync, lstatSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, readdirSync} from 'node:fs';
import {dirname, resolve, join, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const base=dirname(fileURLToPath(import.meta.url));
const pathTo=p=>resolve(base,...p.split('/'));
const fail=message=>{console.error('PREFLIGHT PORTABLE V11.21 ERROR: '+message);process.exitCode=1;};
const manifest=join(base,'INVENTARIO_OFICIAL_V11_21_SHA256.txt');
const hash=b=>createHash('sha256').update(b).digest('hex');
let temp=null;
try {
 const lines=readFileSync(manifest,'utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#'));
 const checked=[];const allowed=new Set();
 for(const line of lines){
  const m=/^([0-9a-f]{64})  (.+)$/.exec(line);
  if(!m)throw Error('Inventario con formato incorrecto');
  const rel=m[2],segments=rel.split('/');
  if(rel.includes('\\')||segments.some(p=>!p||p==='.'||p==='..')||rel.startsWith('/')||allowed.has(rel))
    throw Error('Ruta duplicada o insegura en inventario: '+rel);
  allowed.add(rel);
  const file=pathTo(rel),info=lstatSync(file);
  if(!info.isFile()||info.isSymbolicLink())throw Error('Archivo esperado no regular: '+rel);
  const computed=hash(readFileSync(file));
  if(computed!==m[1])throw Error('Hash no coincide: '+rel);
  checked.push([rel,file]);
 }
 if(checked.length<500||!allowed.has('V11.21-STAGING/scripts/preflight1121.mjs')||!allowed.has('INSTALAR_V11_21.cmd'))
   throw Error('Inventario incompleto: '+checked.length+' archivos');
 console.log('Inventario verificado: '+checked.length+' archivos oficiales SHA-256.');
 if(process.argv.includes('--solo-integridad')){
   console.log('INTEGRIDAD ORIGINAL OK: no se modifico ningun archivo de la version.');
 } else {
   // Only sample the top-level of each staging tree to diagnose benign extra files,
   // never execute or copy unrecognized files from any tree.
   const extras=[];
   const scan=(dir,rel)=>{for(const item of readdirSync(dir,{withFileTypes:true})){
     const next=rel?rel+'/'+item.name:item.name;
     if(item.isDirectory()) scan(join(dir,item.name),next);
     else if(!allowed.has(next)&&!next.startsWith('BACKUP_STAGING/')&&next!=='INVENTARIO_OFICIAL_V11_21_SHA256.txt')extras.push(next);
   }};
   for(const name of ['V11.13-STAGING','V11.14-STAGING','V11.15-STAGING','V11.16-STAGING','V11.17-STAGING','V11.18-STAGING','V11.21-STAGING'])
     scan(join(base,name),name);
   if(extras.length)console.log('Archivos auxiliares ajenos a la version, EXCLUIDOS de la prueba: '+extras.slice(0,8).join(', ')+(extras.length>8?' (y '+(extras.length-8)+' mas)':''));
   temp=mkdtempSync(join(tmpdir(),'asia-2027-v1121-'));
   for(const [rel,file] of checked){const dst=join(temp,...rel.split('/'));mkdirSync(dirname(dst),{recursive:true});copyFileSync(file,dst);}
   const root=join(temp,'V11.21-STAGING');
   const r=spawnSync(process.execPath,[join(root,'scripts/preflight1121.mjs')],{
     cwd:root,encoding:'utf8',stdio:'inherit',timeout:360000,
     env:{...process.env,NODE_NO_WARNINGS:'1'}
   });
   if(r.error||r.status!==0||r.signal)throw Error('Las pruebas originales no pasaron. '+(r.error?.message||'Codigo '+r.status));
   console.log('PREFLIGHT LOCAL OK: pruebas originales ejecutadas sobre copia limpia.');
 }
}catch(err){fail(err?.message||String(err));}
finally{if(temp)try{rmSync(temp,{recursive:true,force:true,maxRetries:3,retryDelay:300});}catch(err){console.error('AVISO: limpieza del directorio temporal fallida: '+err.message);}}
